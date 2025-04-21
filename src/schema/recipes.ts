import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  ingredients: text('ingredients').notNull(), // Should be JSON ideally
  instructions: text('instructions').notNull(), // Should be JSON ideally
  cooking_time: integer('cooking_time'),
  servings: integer('servings'),
  thumbnail: text('thumbnail'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
