import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  password: text().notNull(), // bcrypt hash
  isAdmin: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const links = sqliteTable("links", {
  id: integer().primaryKey({ autoIncrement: true }),
  link: text().notNull(),
  alias: text().notNull().unique(),
  userId: integer().references(() => users.id),
  createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  hits: integer().notNull().default(0),
});