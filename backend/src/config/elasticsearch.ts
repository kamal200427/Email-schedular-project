
import { Client } from "@elastic/elasticsearch";

import { env } from "./env";

const clientConfig: ConstructorParameters<typeof Client>[0] = {
  node: env.ELASTICSEARCH_URL,

  requestTimeout: 30000,

  maxRetries: 3,
};

if (
  env.ELASTICSEARCH_USERNAME &&
  env.ELASTICSEARCH_PASSWORD
) {
  clientConfig.auth = {
    username: env.ELASTICSEARCH_USERNAME,
    password: env.ELASTICSEARCH_PASSWORD,
  };
}

const elasticsearch = new Client(clientConfig);

export const EMAIL_INDEX = "scheduled_emails";

// Check Elasticsearch connectivity.
export const checkElasticsearchConnection =
  async (): Promise<void> => {
    try {
      const response = await elasticsearch.ping();

      if (!response) {
        throw new Error("Elasticsearch ping failed.");
      }

      console.log("Elasticsearch connected successfully.");
    } catch (error) {
      console.error(
        "Elasticsearch connection failed:",
        error
      );

      throw error;
    }
  };

// Create email index if it does not exist.
export const createEmailIndex = async (): Promise<void> => {
  try {
    const exists = await elasticsearch.indices.exists({
      index: EMAIL_INDEX,
    });

    if (exists) {
      console.log("Email index already exists.");

      return;
    }

    await elasticsearch.indices.create({
      index: EMAIL_INDEX,

      mappings: {
        properties: {
          emailId: {
            type: "keyword",
          },

          batchId: {
            type: "keyword",
          },

          userId: {
            type: "keyword",
          },

          senderId: {
            type: "keyword",
          },

          senderEmail: {
            type: "keyword",
          },

          recipient: {
            type: "keyword",
          },

          subject: {
            type: "text",
          },

          body: {
            type: "text",
          },

          status: {
            type: "keyword",
          },

          scheduledAt: {
            type: "date",
          },

          sentAt: {
            type: "date",
          },

          createdAt: {
            type: "date",
          },
        },
      },
    });

    console.log("Email search index created.");
  } catch (error) {
    console.error(
      "Unable to create email index:",
      error
    );

    throw error;
  }
};

// Close Elasticsearch connection.
export const closeElasticsearchConnection =
  async (): Promise<void> => {
    await elasticsearch.close();

    console.log("Elasticsearch connection closed.");
  };

export default elasticsearch;
