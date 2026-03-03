import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// PIN 認証
// ─────────────────────────────────────────────

/** システム全体の設定（PINハッシュ等） */
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** PIN セッション（端末ごと） */
export const pinSessions = mysqlTable("pin_sessions", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** 信頼端末なら30日、通常は1日 */
  trusted: boolean("trusted").default(false).notNull(),
  /** セッション世代（PIN変更時にインクリメントして旧セッションを無効化） */
  generation: int("generation").default(1).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  /** ブルートフォース対策 */
  failCount: int("failCount").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
});

export type PinSession = typeof pinSessions.$inferSelect;
export type InsertPinSession = typeof pinSessions.$inferInsert;

// ─────────────────────────────────────────────
// スタッフ
// ─────────────────────────────────────────────

export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  staffId: varchar("staffId", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["admin", "member"]).default("member").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

// ─────────────────────────────────────────────
// 会場・エリア
// ─────────────────────────────────────────────

export const venues = mysqlTable("venues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  floor: varchar("floor", { length: 16 }),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const areas = mysqlTable("areas", {
  id: int("id").autoincrement().primaryKey(),
  venueId: int("venueId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Venue = typeof venues.$inferSelect;
export type Area = typeof areas.$inferSelect;

// ─────────────────────────────────────────────
// スタッフ状況
// ─────────────────────────────────────────────

export const staffStatus = mysqlTable("staff_status", {
  id: int("id").autoincrement().primaryKey(),
  staffId: varchar("staffId", { length: 32 }).notNull().unique(),
  venueId: int("venueId"),
  areaId: int("areaId"),
  workContent: varchar("workContent", { length: 255 }).default("").notNull(),
  status: mysqlEnum("status", ["active", "moving", "break_1f", "break_3f", "break_room"]).default("active").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffStatus = typeof staffStatus.$inferSelect;
export type InsertStaffStatus = typeof staffStatus.$inferInsert;

// ─────────────────────────────────────────────
// タスク
// ─────────────────────────────────────────────

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  state: mysqlEnum("state", ["todo", "in_progress", "done"]).default("todo").notNull(),
  assigneeId: varchar("assigneeId", { length: 32 }),
  venueId: int("venueId"),
  areaId: int("areaId"),
  dueDate: timestamp("dueDate"),
  reminderAt: timestamp("reminderAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─────────────────────────────────────────────
// テトリス（スケジュール）
// ─────────────────────────────────────────────

export const tetrisEntries = mysqlTable("tetris_entries", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // "2026-03-01"
  dayLabel: varchar("dayLabel", { length: 32 }), // "3/1", "3/2 準備日" など
  timeSlot: varchar("timeSlot", { length: 32 }).notNull(), // "7:30", "9:00-10:00"
  staffId: varchar("staffId", { length: 32 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).default(""),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type TetrisEntry = typeof tetrisEntries.$inferSelect;
export type InsertTetrisEntry = typeof tetrisEntries.$inferInsert;

// ─────────────────────────────────────────────
// users テーブル（テンプレート互換用・実際には使用しない）
// ─────────────────────────────────────────────
import { mysqlTable as _t } from "drizzle-orm/mysql-core";
export const users = _t("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
