import { pgTable, text, timestamp, boolean, integer, uuid, pgEnum, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  image: text('image'),
  email_verified: boolean('email_verified').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const measurementUnitEnum = pgEnum('measurement_unit', [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'pinch'
]);

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients').notNull().$type<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }[]>(),
  instructions: jsonb('instructions').notNull().$type<{
    step: number;
    text: string;
    time?: number; // in minutes
  }[]>(),
  cooking_time: integer('cooking_time'),
  servings: integer('servings'),
  type: text('type').notNull(), // 'personal' or 'external'
  thumbnail: text('thumbnail'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const permissionTypeEnum = pgEnum('permission_type', ['view', 'edit', 'admin']);

export const shared_recipes = pgTable('shared_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipe_id: uuid('recipe_id').notNull().references(() => recipes.id),
  owner_id: uuid('owner_id').notNull().references(() => users.id),
  shared_with_id: uuid('shared_with_id').references(() => users.id),
  permission: permissionTypeEnum('permission').notNull().default('view'),
  share_code: text('share_code').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}); 