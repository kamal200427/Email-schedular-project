
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("email_outbox", (table) => {
    table.bigIncrements("id").primary();

    table.bigInteger("email_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("emails")
      .onDelete("CASCADE");

    table.string("event_type", 50).notNullable().defaultTo("email.schedule");
    table.string("status", 30).notNullable().defaultTo("pending");

    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error").nullable();

    table.timestamp("processed_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["email_id", "event_type"]);
    table.index(["status", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("email_outbox");
}
