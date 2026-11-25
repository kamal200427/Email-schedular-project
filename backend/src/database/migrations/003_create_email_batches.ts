
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("email_batches", (table) => {
    table.bigIncrements("id").primary();

    table.bigInteger("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.bigInteger("sender_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("senders")
      .onDelete("RESTRICT");

    table.string("subject", 500).notNullable();
    table.text("body","longtext").notNullable();

    table.timestamp("start_at").notNullable();
    table.integer("delay_seconds").notNullable().defaultTo(0);
    table.integer("hourly_limit").notNullable();

    table.integer("total_emails").notNullable().defaultTo(0);
    table.integer("sent_count").notNullable().defaultTo(0);
    table.integer("failed_count").notNullable().defaultTo(0);

    table.string("status", 30).notNullable().defaultTo("scheduled");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "status"]);
    table.index(["sender_id", "status"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("email_batches");
}
