
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("email_events", (table) => {
    table.bigIncrements("id").primary();

    table.bigInteger("email_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("emails")
      .onDelete("CASCADE");

    table.string("event_type", 50).notNullable();
    table.text("message").nullable();
    table.json("metadata").nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["email_id", "created_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("email_events");
}
