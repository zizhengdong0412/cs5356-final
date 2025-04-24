import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { appUsers as users } from '@/schema';
import { recipes } from './recipes';

export const binders = pgTable('binders', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Junction table to connect binders with recipes
export const binder_recipes = pgTable('binder_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  binder_id: uuid('binder_id').notNull().references(() => binders.id),
  recipe_id: uuid('recipe_id').notNull().references(() => recipes.id),
  added_at: timestamp('added_at', { mode: 'date' }).defaultNow().notNull(),
});

// Create enum for binder sharing permissions
export const binderPermissionTypeEnum = pgEnum('binder_permission_type', ['view', 'edit', 'admin']);

// Table for shared binders
export const shared_binders = pgTable('shared_binders', {
  id: uuid('id').primaryKey().defaultRandom(),
  binder_id: uuid('binder_id').notNull().references(() => binders.id),
  owner_id: uuid('owner_id').notNull().references(() => users.id),
  shared_with_id: uuid('shared_with_id').references(() => users.id), // If null, shared via link
  permission: binderPermissionTypeEnum('permission').notNull().default('view'),
  share_code: text('share_code').notNull(), // Random code for link sharing
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
