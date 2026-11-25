
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("emails", (table) => {
    table.bigIncrements("id").primary();

    table.bigInteger("batch_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("email_batches")
      .onDelete("CASCADE");

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

    table.string("recipient", 255).notNullable();
    table.string("subject", 500).notNullable();
    table.text("body","longtext").notNullable();

    table.string("status", 30).notNullable().defaultTo("scheduled");

    table.timestamp("scheduled_at").notNullable();
    table.timestamp("sent_at").nullable();
    table.timestamp("failed_at").nullable();

    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error").nullable();

    // Useful for tracking delivery attempts and reconciliation.
    table.string("delivery_reference", 255).nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["batch_id", "status"]);
    table.index(["user_id", "status"]);
    table.index(["sender_id", "scheduled_at"]);
    table.index(["status", "scheduled_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("emails");
}
