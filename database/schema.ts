import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const links = sqliteTable("links", {
  id: integer().primaryKey({ autoIncrement: true }),
  link: text().notNull(),
  alias: text().notNull().unique(),
  createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  hits: integer().notNull().default(0),
});