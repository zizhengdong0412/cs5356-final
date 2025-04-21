import { pgTable, uuid, text, integer, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  ingredients: text('ingredients').notNull(), // Should be JSON ideally
  instructions: text('instructions').notNull(), // Should be JSON ideally
  cooking_time: integer('cooking_time'),
  servings: integer('servings'),
  type: text('type').default('personal').notNull(), // 'personal' or 'external'
  thumbnail: text('thumbnail'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// 创建枚举类型，定义共享权限级别
export const permissionTypeEnum = pgEnum('permission_type', ['view', 'edit', 'admin']);

// 共享食谱表，记录哪些食谱被共享给了哪些用户
export const shared_recipes = pgTable('shared_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipe_id: uuid('recipe_id').notNull().references(() => recipes.id),
  owner_id: uuid('owner_id').notNull().references(() => users.id), // 食谱拥有者
  shared_with_id: uuid('shared_with_id').references(() => users.id), // 被共享的用户，如果为null则表示通过链接共享
  permission: permissionTypeEnum('permission').notNull().default('view'), // 权限类型
  share_code: text('share_code').notNull(), // 随机生成的共享码，用于通过链接共享
  is_active: boolean('is_active').notNull().default(true), // 是否有效
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
