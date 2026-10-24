import { pgTable, text, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
export const products = pgTable('products', {
  id: text().primaryKey(),
  name: text().notNull(),
  color: text().notNull(),
  swatch: text().notNull().default('#414536'),
  images: jsonb().$type<string[]>().notNull(),
  sprite: text(),
  sample: boolean().notNull().default(false),
  description: text().notNull().default(''),
  price: integer(),
  position: integer().notNull().default(0),
});
