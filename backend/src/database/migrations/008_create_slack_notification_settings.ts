
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(
    "slack_notification_settings",
    (table) => {
      table.bigIncrements("id").primary();

      // One notification configuration per user
      table
        .bigInteger("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE")
        .unique();

      // Slack channel configuration
      table.string("channel_id", 100).notNullable();
      table.string("channel_name", 255).nullable();

      // Master notification switch
      table.boolean("is_enabled").notNullable().defaultTo(true);

      // Individual notification preferences
      table.boolean("notify_email_sent").notNullable().defaultTo(true);

      table.boolean("notify_email_failed").notNullable().defaultTo(true);

      table.boolean("notify_rate_limited").notNullable().defaultTo(true);

      table.boolean("notify_batch_completed").notNullable().defaultTo(true);

      table
        .timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp("updated_at")
        .notNullable()
        .defaultTo(knex.fn.now());
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(
    "slack_notification_settings"
  );
}
