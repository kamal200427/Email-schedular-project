
import elasticsearch,{
  EMAIL_INDEX,
} from "../config/elasticsearch";

import { ensureEmailIndex } from "./indexing.service";

import type {
  EmailStatus,
} from "../modules/emails/email.types";

interface EmailSearchDocument {
  email_id: string;
  user_id: string;
  batch_id: string;
  sender_id: string;
  sender_email: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailSearchResult {
  id: string;
  batchId: string;
  senderId: string;
  senderEmail: string;
  email: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt?: string;
  sentAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search emails belonging to a particular user.
 */
export async function searchEmailsByUser(
  userId: string | number,
  searchTerm: string,
  page = 1,
  pageSize = 20
): Promise<{
  emails: EmailSearchResult[];
  total: number;
}> {
  const normalizedQuery = searchTerm.trim();

  if (!normalizedQuery) {
    return {
      emails: [],
      total: 0,
    };
  }

  if (normalizedQuery.length > 200) {
    throw new Error("Search query cannot exceed 200 characters.");
  }

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(
    100,
    Math.max(1, Math.floor(pageSize))
  );

  const from = (safePage - 1) * safePageSize;

  await ensureEmailIndex();

  const response = await elasticsearch.search<EmailSearchDocument>({
    index: EMAIL_INDEX,
    from,
    size: safePageSize,

    query: {
      bool: {
        filter: [
          {
            term: {
              user_id: String(userId),
            },
          },
        ],

        must: [
          {
            multi_match: {
              query: normalizedQuery,
              fields: [
                "recipient",
                "sender_email",
                "subject",
                "body",
              ],
              type: "best_fields",
              operator: "and",
            },
          },
        ],
      },
    },

    sort: [
      {
        created_at: {
          order: "desc",
        },
      },
    ],
  });

  const total =
    typeof response.hits.total === "number"
      ? response.hits.total
      : response.hits.total?.value ?? 0;

  
interface EmailSearchHit {
  _id: string;
  _source?: EmailSearchDocument;
}

const hits: EmailSearchHit[] =
  response.hits.hits as EmailSearchHit[];

const mappedEmails: Array<EmailSearchResult | null> =
  hits.map((hit): EmailSearchResult | null => {
    const document = hit._source;

    if (!document) {
      return null;
    }

    return {
      id: document.email_id,
      batchId: document.batch_id,
      senderId: document.sender_id,
      senderEmail: document.sender_email,
      email: document.recipient,
      subject: document.subject,
      body: document.body,
      status: document.status as EmailStatus,
      scheduledAt: document.scheduled_at ?? undefined,
      sentAt: document.sent_at ?? undefined,
      failedAt: document.failed_at ?? undefined,
      errorMessage: document.last_error ?? undefined,
      retryCount: document.attempts,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    };
  });

const emails: EmailSearchResult[] = mappedEmails.filter(
  (email): email is EmailSearchResult => email !== null
);

  return {
    emails,
    total,
  };
}
