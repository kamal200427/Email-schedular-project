
import db from "../config/database";

import elasticsearch, {
  EMAIL_INDEX,
} from "../config/elasticsearch";

import { ensureEmailIndex, indexEmail } from "./indexing.service";

interface SentEmailId {
  id: number;
}

export interface ReindexResult {
  checked: number;
  indexed: number;
  alreadyIndexed: number;
  failed: number;
}

/**
 * Recover sent emails missing from Elasticsearch.
 *
 * Uses keyset pagination instead of OFFSET pagination,
 * which is more efficient for large email tables.
 */
export async function reindexSentEmails(
  batchSize = 100
): Promise<ReindexResult> {
  if (
    !Number.isInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 1000
  ) {
    throw new Error(
      "Batch size must be between 1 and 1000."
    );
  }

  await ensureEmailIndex();

  const result: ReindexResult = {
    checked: 0,
    indexed: 0,
    alreadyIndexed: 0,
    failed: 0,
  };

  let lastId = 0;

  console.log("Starting sent email reindex recovery...");

  while (true) {
    const emails = await db("emails")
      .select("id")
      .where("status", "sent")
      .where("id", ">", lastId)
      .orderBy("id", "asc")
      .limit(batchSize) as SentEmailId[];

    if (emails.length === 0) {
      break;
    }

    for (const email of emails) {
      lastId = Number(email.id);
      result.checked++;

      try {
        const exists = await elasticsearch.exists({
          index: EMAIL_INDEX,
          id: String(email.id),
        });

        if (exists) {
          result.alreadyIndexed++;
          continue;
        }

        await indexEmail(email.id);

        result.indexed++;

        console.log(
          `Recovered missing email document: ${email.id}`
        );
      } catch (error) {
        result.failed++;

        console.error(
          `Failed to reindex email ${email.id}:`,
          error
        );
      }
    }
  }

  console.log("Email reindex recovery completed.");
  console.log(result);

  return result;
}
