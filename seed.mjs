import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { createHash } from "crypto";
import * as dotenv from "dotenv";
import { tetrisEntries, staff, venues, areas, staffStatus, systemConfig, pinSessions } from "./drizzle/schema.ts";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ─── ハッシュ関数 ───────────────────────────────
function hashPin(pin) {
  return createHash("sha256").update(`icc-pin:${pin}`).digest("hex");
}

// ─── system_config ───────────────────────────────
await db.execute(`DELETE FROM system_config`);
await db.execute(
  `INSERT INTO system_config (\`key\`, value) VALUES ('pin_hash', '${hashPin("1234")}'), ('pin_generation', '1')`
);
console.log("✓ system_config seeded");

// ─── staff ───────────────────────────────────────
await db.execute(`DELETE FROM staff`);
await db.execute(`
  INSERT INTO staff (staffId, name, role, active) VALUES
  ('yuuyu',   'ゆうゆ',   'admin',  true),
  ('fumiya',  'ふみや',   'member', true),
  ('tsucchi', 'つっちー', 'member', true),
  ('yumeka',  'ゆめか',   'member', true),
  ('babe',    'ばべちゃん','member', true)
`);
console.log("✓ staff seeded");

// ─── venues ──────────────────────────────────────
await db.execute(`DELETE FROM venues`);
await db.execute(`
  INSERT INTO venues (id, name, floor, sortOrder) VALUES
  (1, 'ヒルトン福岡シーホーク', NULL, 0),
  (2, '1F 宴会場',  '1F',  1),
  (3, '3F 宴会場',  '3F',  2),
  (4, '4F ロビー',  '4F',  3),
  (5, '34F 宴会場', '34F', 4),
  (6, '32F エグゼクティブ', '32F', 5)
`);
console.log("✓ venues seeded");

// ─── areas ───────────────────────────────────────
await db.execute(`DELETE FROM areas`);
await db.execute(`
  INSERT INTO areas (venueId, name, sortOrder) VALUES
  (2, 'アルタイル',   0),
  (2, 'ベガ',         1),
  (2, 'リゲル',       2),
  (2, 'プロモーションブース', 3),
  (2, 'スタッフ控室', 4),
  (3, 'アルタイル',   0),
  (3, 'ベガ',         1),
  (3, 'リゲル',       2),
  (3, 'スタッフ控室', 3),
  (4, 'シアラ',       0),
  (4, 'メインロビー', 1),
  (4, 'コンビニ',     2),
  (5, 'オーシャンペントハウス', 0),
  (5, 'タワーペントハウス',     1),
  (5, 'ベイペントハウス',       2),
  (5, 'ブレークアウトスペース', 3),
  (5, 'ルナ',         4),
  (5, 'ソル',         5),
  (6, '15客室',       0),
  (1, 'ホテル外',     0),
  (1, '移動中',       1)
`);
console.log("✓ areas seeded");

// ─── staff_status ─────────────────────────────────
await db.execute(`DELETE FROM staff_status`);
await db.execute(`
  INSERT INTO staff_status (staffId, venueId, areaId, workContent, status) VALUES
  ('yuuyu',   1, NULL, '', 'active'),
  ('fumiya',  1, NULL, '', 'active'),
  ('tsucchi', 1, NULL, '', 'active'),
  ('yumeka',  1, NULL, '', 'active'),
  ('babe',    1, NULL, '', 'active')
`);
console.log("✓ staff_status seeded");

// ─── tetris_entries ───────────────────────────────
await db.execute(`DELETE FROM tetris_entries`);

const entries = [
  // ── 3/1（日） ──────────────────────────────────
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "13:00〜",   staffId: "fumiya",  content: "配送物チェック",       sortOrder: 1 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "15:00〜",   staffId: "fumiya",  content: "チェックインなど",     sortOrder: 2 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "20:00〜",   staffId: "fumiya",  content: "スタッフ前夜祭",       sortOrder: 3 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "13:00〜",   staffId: "tsucchi", content: "配送物チェック",       sortOrder: 1 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "15:00〜",   staffId: "tsucchi", content: "チェックインなど",     sortOrder: 2 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "20:00〜",   staffId: "tsucchi", content: "スタッフ前夜祭",       sortOrder: 3 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "13:00〜",   staffId: "yumeka",  content: "配送物チェック",       sortOrder: 1 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "15:00〜",   staffId: "yumeka",  content: "チェックインなど",     sortOrder: 2 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "20:00〜",   staffId: "yumeka",  content: "スタッフ前夜祭",       sortOrder: 3 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "13:00〜",   staffId: "babe",    content: "配送物チェック",       sortOrder: 1 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "15:00〜",   staffId: "babe",    content: "チェックインなど",     sortOrder: 2 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "20:00〜",   staffId: "babe",    content: "スタッフ前夜祭",       sortOrder: 3 },
  { date: "2026-03-01", dayLabel: "3/1（日）", timeSlot: "プロモーションブース準備", staffId: "yuuyu", content: "・プロモーションブース\n・ハッピーアワー", sortOrder: 1 },

  // ── 3/2（準備日） ──────────────────────────────
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "6:45",        staffId: "fumiya",  content: "ホテル〜会場",                  sortOrder: 1 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "7:30",        staffId: "fumiya",  content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "9:00-10:00",  staffId: "fumiya",  content: "館内ツアー＋スタッフ控室作り",  sortOrder: 3 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "10:15-11:00", staffId: "fumiya",  content: "準備\nプロモーションブース備品配布", sortOrder: 4 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "11:00-12:00", staffId: "fumiya",  content: "ランチ準備",                    sortOrder: 5 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "12:00",       staffId: "fumiya",  content: "全体集合",                      sortOrder: 6 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "13:00-14:00", staffId: "fumiya",  content: "飲料運ぶ",                      sortOrder: 7 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "14:00-15:00", staffId: "fumiya",  content: "飲料運ぶ・ベースブレッドもらいにいく", sortOrder: 8 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:00-15:30", staffId: "fumiya",  content: "スタッフ集合写真",              sortOrder: 9 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:30-17:30", staffId: "fumiya",  content: "ハピアワのお酒の仕分け？",      sortOrder: 10 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "17:30-18:30", staffId: "fumiya",  content: "準備\nお弁当配布・ベースフード設置", sortOrder: 11 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "18:30-21:30", staffId: "fumiya",  content: "パーティー運営・CCN準備\nもかさんについていってCCNWTS準備", sortOrder: 12 },

  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "6:45",        staffId: "tsucchi", content: "ホテル〜会場",                  sortOrder: 1 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "7:30",        staffId: "tsucchi", content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "9:00-10:00",  staffId: "tsucchi", content: "館内ツアー＋スタッフ控室作り\n木村石鹸置く", sortOrder: 3 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "10:15-11:00", staffId: "tsucchi", content: "プロモーションブース備品配布",  sortOrder: 4 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "11:00-12:00", staffId: "tsucchi", content: "お弁当配布・パートナーさんに服をお届けする", sortOrder: 5 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "12:00",       staffId: "tsucchi", content: "全体集合",                      sortOrder: 6 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "13:00-14:00", staffId: "tsucchi", content: "飲料運ぶ",                      sortOrder: 7 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "14:00-15:00", staffId: "tsucchi", content: "飲料運ぶ・ベースブレッドもらいにいく", sortOrder: 8 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:00-15:30", staffId: "tsucchi", content: "スタッフ集合写真",              sortOrder: 9 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:30-17:30", staffId: "tsucchi", content: "ハピアワのお酒の仕分け？",      sortOrder: 10 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "17:30-18:30", staffId: "tsucchi", content: "お弁当配布・ベースフード設置",  sortOrder: 11 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "18:30-21:30", staffId: "tsucchi", content: "もかさんについていってCCNWTS準備", sortOrder: 12 },

  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "6:45",        staffId: "yumeka",  content: "ホテル〜会場",                  sortOrder: 1 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "7:30",        staffId: "yumeka",  content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "9:00-10:00",  staffId: "yumeka",  content: "館内ツアー＋スタッフ控室作り",  sortOrder: 3 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "10:15-11:00", staffId: "yumeka",  content: "プロモーションブース備品配布",  sortOrder: 4 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "11:00-12:00", staffId: "yumeka",  content: "お弁当配布・パートナーさんに服をお届けする", sortOrder: 5 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "12:00",       staffId: "yumeka",  content: "全体集合",                      sortOrder: 6 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "13:00-14:00", staffId: "yumeka",  content: "飲料運ぶ",                      sortOrder: 7 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "14:00-15:00", staffId: "yumeka",  content: "パネル設置",                    sortOrder: 8 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:00-15:30", staffId: "yumeka",  content: "スタッフ集合写真",              sortOrder: 9 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:30-17:30", staffId: "yumeka",  content: "ハピアワのお酒の仕分け？",      sortOrder: 10 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "17:30-18:30", staffId: "yumeka",  content: "お弁当配布・ベースフード設置",  sortOrder: 11 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "18:30-21:30", staffId: "yumeka",  content: "もかさんについていってCCNWTS準備", sortOrder: 12 },

  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "6:45",        staffId: "babe",    content: "ホテル〜会場",                  sortOrder: 1 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "7:30",        staffId: "babe",    content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "9:00-10:00",  staffId: "babe",    content: "館内ツアー＋スタッフ控室作り",  sortOrder: 3 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "10:15-11:00", staffId: "babe",    content: "プロモーションブース備品配布",  sortOrder: 4 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "11:00-12:00", staffId: "babe",    content: "パネル設置",                    sortOrder: 5 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "12:00",       staffId: "babe",    content: "全体集合",                      sortOrder: 6 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "13:00-14:00", staffId: "babe",    content: "飲料運ぶ",                      sortOrder: 7 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "14:00-15:00", staffId: "babe",    content: "パネル設置",                    sortOrder: 8 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:00-15:30", staffId: "babe",    content: "スタッフ集合写真",              sortOrder: 9 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:30-17:30", staffId: "babe",    content: "ハピアワのお酒の仕分け？\nパネル・パネルまさきさんチェック", sortOrder: 10 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "17:30-18:30", staffId: "babe",    content: "17:00- パーティー準備",         sortOrder: 11 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "18:30-21:30", staffId: "babe",    content: "17:00- パーティー準備",         sortOrder: 12 },

  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "6:45",        staffId: "yuuyu",   content: "ホテル〜会場",                  sortOrder: 1 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "7:30",        staffId: "yuuyu",   content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "9:00-10:00",  staffId: "yuuyu",   content: "館内ツアー＋スタッフ控室作り",  sortOrder: 3 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "10:15-11:00", staffId: "yuuyu",   content: "プロモーションブース備品配布",  sortOrder: 4 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "11:00-12:00", staffId: "yuuyu",   content: "お弁当配布・パートナーさんに服をお届けする", sortOrder: 5 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "12:00",       staffId: "yuuyu",   content: "全体集合",                      sortOrder: 6 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "13:00-14:00", staffId: "yuuyu",   content: "飲料運ぶ",                      sortOrder: 7 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "14:00-15:00", staffId: "yuuyu",   content: "パネル設置",                    sortOrder: 8 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:00-15:30", staffId: "yuuyu",   content: "スタッフ集合写真",              sortOrder: 9 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "15:30-17:30", staffId: "yuuyu",   content: "ハピアワのお酒の仕分け？",      sortOrder: 10 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "17:30-18:30", staffId: "yuuyu",   content: "お弁当配布・ベースフード設置",  sortOrder: 11 },
  { date: "2026-03-02", dayLabel: "3/2（準備日）", timeSlot: "18:30-21:30", staffId: "yuuyu",   content: "パーティー運営・CCN準備",       sortOrder: 12 },

  // ── 3/3（1日目） ───────────────────────────────
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:00-7:30",   staffId: "fumiya",  content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:30-8:00",   staffId: "fumiya",  content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "8:00-9:00",   staffId: "fumiya",  content: "準備",                          sortOrder: 3 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "9:00-11:15",  staffId: "fumiya",  content: "CCN抽選支援\n9:00-10:00 ビジネスセンター設置", sortOrder: 4 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:15-11:45", staffId: "fumiya",  content: "休憩\nCCN抽選続きor美食受付",   sortOrder: 5 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:45-13:00", staffId: "fumiya",  content: "Session2",                      sortOrder: 6 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "13:00-14:00", staffId: "fumiya",  content: "休憩・ランチ",                  sortOrder: 7 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:00-14:30", staffId: "fumiya",  content: "休憩・ランチ",                  sortOrder: 8 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:30-15:45", staffId: "fumiya",  content: "Session3",                      sortOrder: 9 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "15:45-16:15", staffId: "fumiya",  content: "休憩",                          sortOrder: 10 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "16:15-17:30", staffId: "fumiya",  content: "Session4\nハピアワ準備",        sortOrder: 11 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "17:30-18:00", staffId: "fumiya",  content: "休憩",                          sortOrder: 12 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "18:00-19:15", staffId: "fumiya",  content: "Session5\nCCN WTSかも",         sortOrder: 13 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "19:15-22:00", staffId: "fumiya",  content: "作業\nCCN WTSかも",             sortOrder: 14 },

  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:00-7:30",   staffId: "tsucchi", content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:30-8:00",   staffId: "tsucchi", content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "8:00-9:00",   staffId: "tsucchi", content: "準備",                          sortOrder: 3 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "9:00-11:15",  staffId: "tsucchi", content: "CCN抽選支援\n9:00-10:00 ビジネスセンター設置", sortOrder: 4 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:15-11:45", staffId: "tsucchi", content: "弁当配布（パートナー含む）",     sortOrder: 5 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:45-13:00", staffId: "tsucchi", content: "Session2",                      sortOrder: 6 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "13:00-14:00", staffId: "tsucchi", content: "休憩・ランチ",                  sortOrder: 7 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:00-14:30", staffId: "tsucchi", content: "休憩・ランチ",                  sortOrder: 8 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:30-15:45", staffId: "tsucchi", content: "Session3",                      sortOrder: 9 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "15:45-16:15", staffId: "tsucchi", content: "ハピアワ準備",                  sortOrder: 10 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "16:15-17:30", staffId: "tsucchi", content: "Session4\nハピアワ準備",        sortOrder: 11 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "17:30-18:00", staffId: "tsucchi", content: "お弁当受け取り\n明日の朝ごはん・飲料補充", sortOrder: 12 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "18:00-19:15", staffId: "tsucchi", content: "Session5\nCCN WTSかも",         sortOrder: 13 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "19:15-22:00", staffId: "tsucchi", content: "CCN WTSかも",                   sortOrder: 14 },

  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:00-7:30",   staffId: "yumeka",  content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:30-8:00",   staffId: "yumeka",  content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "8:00-9:00",   staffId: "yumeka",  content: "準備",                          sortOrder: 3 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "9:00-11:15",  staffId: "yumeka",  content: "CCN抽選支援\n9:00-10:00 ビジネスセンター設置", sortOrder: 4 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:15-11:45", staffId: "yumeka",  content: "弁当配布（パートナー含む）",     sortOrder: 5 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:45-13:00", staffId: "yumeka",  content: "Session2",                      sortOrder: 6 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "13:00-14:00", staffId: "yumeka",  content: "休憩・ランチ",                  sortOrder: 7 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:00-14:30", staffId: "yumeka",  content: "休憩・ランチ",                  sortOrder: 8 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:30-15:45", staffId: "yumeka",  content: "Session3",                      sortOrder: 9 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "15:45-16:15", staffId: "yumeka",  content: "ハピアワ準備",                  sortOrder: 10 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "16:15-17:30", staffId: "yumeka",  content: "Session4\nハピアワ準備",        sortOrder: 11 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "17:30-18:00", staffId: "yumeka",  content: "↓",                             sortOrder: 12 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "18:00-19:15", staffId: "yumeka",  content: "Session5\nCCN WTSかも",         sortOrder: 13 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "19:15-22:00", staffId: "yumeka",  content: "パネル変更",                    sortOrder: 14 },

  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:00-7:30",   staffId: "babe",    content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:30-8:00",   staffId: "babe",    content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "8:00-9:00",   staffId: "babe",    content: "準備",                          sortOrder: 3 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "9:00-11:15",  staffId: "babe",    content: "CCN抽選支援\n9:00-10:00 ビジネスセンター設置", sortOrder: 4 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:15-11:45", staffId: "babe",    content: "弁当配布（パートナー含む）",     sortOrder: 5 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:45-13:00", staffId: "babe",    content: "Session2",                      sortOrder: 6 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "13:00-14:00", staffId: "babe",    content: "休憩・ランチ",                  sortOrder: 7 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:00-14:30", staffId: "babe",    content: "休憩・ランチ",                  sortOrder: 8 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:30-15:45", staffId: "babe",    content: "Session3",                      sortOrder: 9 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "15:45-16:15", staffId: "babe",    content: "ハピアワ準備",                  sortOrder: 10 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "16:15-17:30", staffId: "babe",    content: "Session4\nハピアワ準備",        sortOrder: 11 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "17:30-18:00", staffId: "babe",    content: "↓",                             sortOrder: 12 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "18:00-19:15", staffId: "babe",    content: "Session5\nCCN WTSかも",         sortOrder: 13 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "19:15-22:00", staffId: "babe",    content: "パネル変更",                    sortOrder: 14 },

  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:00-7:30",   staffId: "yuuyu",   content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "7:30-8:00",   staffId: "yuuyu",   content: "集合・準備",                    sortOrder: 2 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "8:00-9:00",   staffId: "yuuyu",   content: "準備",                          sortOrder: 3 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "9:00-11:15",  staffId: "yuuyu",   content: "CCN抽選支援\n9:00-10:00 ビジネスセンター設置", sortOrder: 4 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:15-11:45", staffId: "yuuyu",   content: "弁当配布（パートナー含む）",     sortOrder: 5 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "11:45-13:00", staffId: "yuuyu",   content: "Session2",                      sortOrder: 6 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "13:00-14:00", staffId: "yuuyu",   content: "休憩・ランチ",                  sortOrder: 7 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:00-14:30", staffId: "yuuyu",   content: "休憩・ランチ",                  sortOrder: 8 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "14:30-15:45", staffId: "yuuyu",   content: "Session3",                      sortOrder: 9 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "15:45-16:15", staffId: "yuuyu",   content: "ハピアワ準備",                  sortOrder: 10 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "16:15-17:30", staffId: "yuuyu",   content: "Session4\nハピアワ準備",        sortOrder: 11 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "17:30-18:00", staffId: "yuuyu",   content: "お弁当受け取り\n明日の朝ごはん・飲料補充", sortOrder: 12 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "18:00-19:15", staffId: "yuuyu",   content: "Session5\nCCN WTSかも",         sortOrder: 13 },
  { date: "2026-03-03", dayLabel: "3/3（1日目）", timeSlot: "19:15-22:00", staffId: "yuuyu",   content: "CCN WTSかも",                   sortOrder: 14 },

  // ── 3/4（2日目） ───────────────────────────────
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:00-7:30",   staffId: "fumiya",  content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:30-8:00",   staffId: "fumiya",  content: "控室見回り・朝ごはん補充",      sortOrder: 2 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "8:00-9:00",   staffId: "fumiya",  content: "スカラシップ撮影",              sortOrder: 3 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:00-7:30",   staffId: "tsucchi", content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:30-8:00",   staffId: "tsucchi", content: "控室見回り・朝ごはん補充",      sortOrder: 2 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "8:00-9:00",   staffId: "tsucchi", content: "スカラシップ撮影",              sortOrder: 3 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:00-7:30",   staffId: "yumeka",  content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:30-8:00",   staffId: "yumeka",  content: "パネル予備",                    sortOrder: 2 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "8:00-9:00",   staffId: "yumeka",  content: "スカラシップ撮影",              sortOrder: 3 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:00-7:30",   staffId: "babe",    content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:30-8:00",   staffId: "babe",    content: "パネル予備",                    sortOrder: 2 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "8:00-9:00",   staffId: "babe",    content: "スカラシップ撮影",              sortOrder: 3 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:00-7:30",   staffId: "yuuyu",   content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "7:30-8:00",   staffId: "yuuyu",   content: "控室見回り・朝ごはん補充",      sortOrder: 2 },
  { date: "2026-03-04", dayLabel: "3/4（2日目）", timeSlot: "8:00-9:00",   staffId: "yuuyu",   content: "スカラシップ撮影",              sortOrder: 3 },

  // ── 3/5（最終日） ──────────────────────────────
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:00-7:30",  staffId: "fumiya",  content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:30-8:00",  staffId: "fumiya",  content: "控室見回り・朝ごはん補充",      sortOrder: 2 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:00-7:30",  staffId: "tsucchi", content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:30-8:00",  staffId: "tsucchi", content: "控室見回り・朝ごはん補充",      sortOrder: 2 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:00-7:30",  staffId: "yumeka",  content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:30-8:00",  staffId: "yumeka",  content: "パネル予備",                    sortOrder: 2 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:00-7:30",  staffId: "babe",    content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:30-8:00",  staffId: "babe",    content: "パネル予備",                    sortOrder: 2 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:00-7:30",  staffId: "yuuyu",   content: "ホテル〜会場 移動",             sortOrder: 1 },
  { date: "2026-03-05", dayLabel: "3/5（最終日）", timeSlot: "7:30-8:00",  staffId: "yuuyu",   content: "控室見回り・朝ごはん補充",      sortOrder: 2 },
];

// drizzle ORM insert (batch)
for (const e of entries) {
  await db.insert(tetrisEntries).values({
    date: e.date,
    dayLabel: e.dayLabel,
    timeSlot: e.timeSlot,
    staffId: e.staffId,
    content: e.content,
    sortOrder: e.sortOrder,
  });
}
console.log(`✓ tetris_entries seeded (${entries.length} rows)`);

await connection.end();
console.log("✅ All seed data inserted successfully");
