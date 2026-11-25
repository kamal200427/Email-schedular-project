
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("senders", (table) => {
    table.bigIncrements("id").primary();

    table.bigInteger("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("name", 150).notNullable();
    table.string("email", 255).notNullable();

    // Store encrypted SMTP credentials, never plaintext passwords.
    table.string("smtp_host", 255).nullable();
    table.integer("smtp_port").nullable();
    table.boolean("smtp_secure").notNullable().defaultTo(false);
    table.text("smtp_user_encrypted").nullable();
    table.text("smtp_pass_encrypted").nullable();

    table.integer("hourly_limit").notNullable().defaultTo(100);
    table.boolean("is_active").notNullable().defaultTo(true);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["user_id", "email"]);
    table.index(["user_id", "is_active"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("senders");
}
