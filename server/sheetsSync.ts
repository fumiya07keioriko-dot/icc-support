/**
 * Google Sheets → tetris_entries 同期ヘルパー
 * f26テトリスシートを読み込み、DBを最新状態に更新する
 */

import { getDb } from "./db";
import { tetrisEntries } from "../drizzle/schema";

const SPREADSHEET_ID = process.env.TETRIS_SPREADSHEET_ID ?? "1URyt0NdWjR5JWlAt7inDSi4Uw59dNB2IGFfelixs-FE";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY ?? "";
const SHEET_NAME = "f26テトリス";

// スタッフ名とstaffIdのマッピング
const STAFF_NAME_MAP: Record<string, string> = {
  "ふみや": "fumiya",
  "すっしー": "susshy",
  "ゆめか": "yumeka",
  "ばべちゃん": "babe",
  "ゆうゆ": "yuuyu",
};

export interface TetrisSyncResult {
  success: boolean;
  rowsUpserted: number;
  error?: string;
  lastSyncAt: Date;
}

/**
 * シートデータを取得してパースし、tetris_entriesテーブルを更新する
 */
export async function syncTetrisFromSheets(): Promise<TetrisSyncResult> {
  const lastSyncAt = new Date();

  if (!API_KEY) {
    return { success: false, rowsUpserted: 0, error: "GOOGLE_SHEETS_API_KEY not set", lastSyncAt };
  }

  try {
    // シートデータ取得
    const range = encodeURIComponent(`${SHEET_NAME}!A1:H200`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, rowsUpserted: 0, error: `Sheets API error: ${res.status} ${errText}`, lastSyncAt };
    }
    const data = await res.json() as { values?: string[][] };
    const rows = data.values ?? [];

    if (rows.length < 2) {
      return { success: false, rowsUpserted: 0, error: "Sheet has no data rows", lastSyncAt };
    }

    // ヘッダー行からスタッフ列インデックスを取得
    // 行0: ["適宜...", "", "ICCの流れ", "ふみや", "すっしー", "ゆめか", "ばべちゃん", "ゆうゆ"]
    const headerRow = rows[0];
    const staffColumns: { colIndex: number; staffId: string; name: string }[] = [];
    for (let i = 3; i < headerRow.length; i++) {
      const name = headerRow[i]?.trim();
      if (name && STAFF_NAME_MAP[name]) {
        staffColumns.push({ colIndex: i, staffId: STAFF_NAME_MAP[name], name });
      }
    }

    // エントリーをパース
    const entries: {
      staffId: string;
      date: string;
      timeSlot: string;
      content: string;
      category: string;
      sortOrder: number;
    }[] = [];

    let currentDate = "";
    for (let rowIdx = 2; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length === 0) continue;

      // 日付列（A列）が空でなければ更新
      const dateCell = row[0]?.trim();
      if (dateCell) {
        // "3/2\n準備日" → "3/2" のように改行前を取得
        currentDate = dateCell.split("\n")[0].trim();
      }

      const timeSlot = row[1]?.trim() ?? "";
      const category = row[2]?.trim() ?? "";

      if (!currentDate || !timeSlot) continue;

      // 各スタッフ列のセルを処理
      for (const { colIndex, staffId } of staffColumns) {
        const cellValue = row[colIndex]?.trim();
        // 空・矢印（継続表示）はスキップ
        if (!cellValue || cellValue === "↓" || cellValue === "↑") continue;

        entries.push({
          staffId,
          date: currentDate,
          timeSlot,
          content: cellValue,
          category,
          sortOrder: rowIdx,
        });
      }
    }

    // DBに一括upsert
    const db = await getDb();
    if (!db) {
      return { success: false, rowsUpserted: 0, error: "Database not available", lastSyncAt };
    }

    // 既存データを全削除して再挿入（シートが正とする）
    await db.delete(tetrisEntries);

    if (entries.length > 0) {
      // 50件ずつバッチ挿入
      const BATCH = 50;
      for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries.slice(i, i + BATCH);
        await db.insert(tetrisEntries).values(
          batch.map((e) => ({
            staffId: e.staffId,
            date: e.date,
            dayLabel: e.date, // "3/2" などの日付ラベル
            timeSlot: e.timeSlot,
            content: e.content,
            category: e.category,
            sortOrder: e.sortOrder,
          }))
        );
      }
    }

    return { success: true, rowsUpserted: entries.length, lastSyncAt };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, rowsUpserted: 0, error: msg, lastSyncAt };
  }
}

// 同期状態をメモリにキャッシュ（再起動でリセット）
let lastSyncResult: TetrisSyncResult | null = null;
let syncTimer: ReturnType<typeof setInterval> | null = null;

export function getLastSyncResult() {
  return lastSyncResult;
}

/**
 * 定期自動同期を開始する（デフォルト5分ごと）
 */
export function startAutoSync(intervalMs = 5 * 60 * 1000) {
  if (syncTimer) return; // 既に起動済み

  // 起動時に即時同期
  syncTetrisFromSheets().then((result) => {
    lastSyncResult = result;
    if (result.success) {
      console.log(`[TetrisSync] Initial sync done: ${result.rowsUpserted} entries`);
    } else {
      console.warn(`[TetrisSync] Initial sync failed: ${result.error}`);
    }
  });

  syncTimer = setInterval(async () => {
    const result = await syncTetrisFromSheets();
    lastSyncResult = result;
    if (result.success) {
      console.log(`[TetrisSync] Auto sync done: ${result.rowsUpserted} entries at ${result.lastSyncAt.toISOString()}`);
    } else {
      console.warn(`[TetrisSync] Auto sync failed: ${result.error}`);
    }
  }, intervalMs);

  console.log(`[TetrisSync] Auto sync started (interval: ${intervalMs / 1000}s)`);
}
