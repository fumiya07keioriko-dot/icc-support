import { and, eq, ne, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  staff,
  staffStatus,
  tasks,
  venues,
  areas,
  tetrisEntries,
  systemConfig,
  pinSessions,
  type Staff,
  type StaffStatus,
  type Task,
  type InsertTask,
  type Venue,
  type Area,
  type TetrisEntry,
  type PinSession,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users (template compat) ──────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── System Config ────────────────────────────────────────────────────────────
export async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(systemConfig)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ─── PIN Sessions ─────────────────────────────────────────────────────────────
export async function createPinSession(data: {
  token: string;
  trusted: boolean;
  generation: number;
  expiresAt: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pinSessions).values({
    token: data.token,
    trusted: data.trusted,
    generation: data.generation,
    expiresAt: data.expiresAt,
  });
}

export async function getPinSession(token: string): Promise<PinSession | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(pinSessions).where(eq(pinSessions.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function touchPinSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(pinSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(pinSessions.token, token));
}

export async function deletePinSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pinSessions).where(eq(pinSessions.token, token));
}

export async function deleteAllPinSessions(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pinSessions);
}

export async function incrementPinFail(token: string, lockedUntil?: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const session = await getPinSession(token);
  if (!session) return;
  await db
    .update(pinSessions)
    .set({
      failCount: (session.failCount ?? 0) + 1,
      lockedUntil: lockedUntil ?? null,
    })
    .where(eq(pinSessions.token, token));
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export async function getAllStaff(): Promise<Staff[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staff).where(eq(staff.active, true)).orderBy(asc(staff.id));
}

export async function getStaffById(staffId: string): Promise<Staff | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(staff).where(eq(staff.staffId, staffId)).limit(1);
  return rows[0] ?? null;
}

// ─── Staff Status ─────────────────────────────────────────────────────────────
export async function getAllStaffStatus(): Promise<StaffStatus[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staffStatus).orderBy(asc(staffStatus.id));
}

export async function upsertStaffStatus(data: {
  staffId: string;
  venueId: number | null;
  areaId: number | null;
  workContent: string;
  status: "active" | "moving" | "break" | "available";
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(staffStatus)
    .values({
      staffId: data.staffId,
      venueId: data.venueId,
      areaId: data.areaId,
      workContent: data.workContent,
      status: data.status,
    })
    .onDuplicateKeyUpdate({
      set: {
        venueId: data.venueId,
        areaId: data.areaId,
        workContent: data.workContent,
        status: data.status,
        updatedAt: new Date(),
      },
    });
}

// ─── Venues & Areas ───────────────────────────────────────────────────────────
export async function getAllVenues(): Promise<Venue[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(venues).orderBy(asc(venues.sortOrder));
}

export async function getAllAreas(): Promise<Area[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(areas).orderBy(asc(areas.venueId), asc(areas.sortOrder));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function getTasks(includeCompleted = false): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  if (includeCompleted) {
    return db.select().from(tasks).orderBy(asc(tasks.createdAt));
  }
  return db
    .select()
    .from(tasks)
    .where(ne(tasks.state, "done"))
    .orderBy(asc(tasks.createdAt));
}

export async function getTaskById(id: number): Promise<Task | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createTask(data: InsertTask): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tasks).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateTask(
  id: number,
  data: Partial<InsertTask>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id));
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Tetris ───────────────────────────────────────────────────────────────────
export async function getTetrisEntries(): Promise<TetrisEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tetrisEntries)
    .orderBy(asc(tetrisEntries.date), asc(tetrisEntries.sortOrder));
}
