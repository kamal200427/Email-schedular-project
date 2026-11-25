
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("slack_integrations", (table) => {
    // Primary key
    table.bigIncrements("id").primary();

    // Foreign key referencing users table
    table
      .bigInteger("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // Slack workspace information
    table.string("team_id", 100).notNullable();
    table.string("team_name", 255).nullable();
    table.string("bot_user_id", 100).nullable();

    // Encrypted Slack bot token
    table.text("access_token_encrypted").notNullable();

    // OAuth permissions
    table.string("scope", 500).nullable();

    // Integration status
    table.boolean("is_active").notNullable().defaultTo(true);

    // Timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // One Slack integration per user
    table.unique(["user_id"]);

    // Workspace search index
    table.index(["team_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("slack_integrations");
}
