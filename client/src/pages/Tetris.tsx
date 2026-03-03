import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STAFF_IDS = ["yuuyu", "fumiya", "susshy", "yumeka", "babe"];
const STAFF_NAMES: Record<string, string> = {
  yuuyu: "ゆうゆ", fumiya: "ふみや", susshy: "すっしー", yumeka: "ゆめか", babe: "ばべちゃん",
};

const STAFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  yuuyu:  { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200" },
  fumiya: { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200" },
  susshy: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  yumeka: { bg: "bg-pink-50",   text: "text-pink-800",   border: "border-pink-200" },
  babe:   { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
};

function formatSyncTime(date: Date | null | undefined): string {
  if (!date) return "未同期";
  const d = new Date(date);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

/**
 * "7:30", "9:00-10:00", "18:30~21:30" などを分に変換
 * 開始時刻のみ返す
 */
function parseSlotStartMinutes(slot: string): number | null {
  const match = slot.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function parseSlotEndMinutes(slot: string): number | null {
  // "9:00-10:00" or "18:30~21:30" → end time
  const match = slot.match(/[~\-](\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/** 現在時刻（分）がスロットに含まれるか判定 */
function isCurrentSlot(slot: string, nowMinutes: number): boolean {
  const start = parseSlotStartMinutes(slot);
  if (start === null) return false;
  const end = parseSlotEndMinutes(slot);
  if (end !== null) {
    return nowMinutes >= start && nowMinutes < end;
  }
  // 終了時刻がない場合：開始から30分以内
  return nowMinutes >= start && nowMinutes < start + 30;
}

/** 今日の日付を "2026-03-03" 形式で返す */
function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Tetris() {
  const utils = trpc.useUtils();
  const tetrisQuery = trpc.tetris.list.useQuery();
  const syncStatusQuery = trpc.tetris.syncStatus.useQuery(undefined, { refetchInterval: 60_000 });
  const manualSyncMutation = trpc.tetris.manualSync.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`同期完了：${result.rowsUpserted}件のスケジュールを取得しました`);
        utils.tetris.list.invalidate();
        utils.tetris.syncStatus.invalidate();
      } else {
        toast.error(`同期失敗：${result.error ?? "不明なエラー"}`);
      }
    },
    onError: () => toast.error("同期に失敗しました"),
  });

  const [viewMode, setViewMode] = useState<"person" | "timeline">("person");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("yuuyu");

  // 現在時刻（分）を1分ごとに更新
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const entries = tetrisQuery.data ?? [];
  const syncStatus = syncStatusQuery.data;
  const todayStr = getTodayDateStr();

  // 日付一覧
  const dates = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    entries.forEach((e) => {
      if (!seen.has(e.date)) { seen.add(e.date); result.push(e.date); }
    });
    return result;
  }, [entries]);

  // 初期日付：今日のデータがあれば今日、なければ先頭
  const defaultDate = useMemo(() => {
    if (dates.includes(todayStr)) return todayStr;
    return dates[0] ?? "";
  }, [dates, todayStr]);

  const currentDate = selectedDate || defaultDate;

  // 日付ラベルマップ
  const dayLabels = useMemo(() => {
    const map: Record<string, string> = {};
    entries.forEach((e) => { map[e.date] = e.dayLabel ?? e.date; });
    return map;
  }, [entries]);

  // 人別ビュー
  const personEntries = useMemo(() => {
    return entries
      .filter((e) => e.staffId === selectedStaff && e.date === currentDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [entries, selectedStaff, currentDate]);

  // タイムラインビュー
  const timelineEntries = useMemo(() => {
    const filtered = entries.filter((e) => e.date === currentDate);
    const slots: Record<string, typeof filtered> = {};
    filtered.forEach((e) => {
      if (!slots[e.timeSlot]) slots[e.timeSlot] = [];
      slots[e.timeSlot].push(e);
    });
    return Object.entries(slots)
      .sort(([a], [b]) => {
        const aMin = parseSlotStartMinutes(a) ?? 9999;
        const bMin = parseSlotStartMinutes(b) ?? 9999;
        return aMin - bMin;
      })
      .map(([slot, items]) => ({ slot, items }));
  }, [entries, currentDate]);

  // 今日かどうか（ハイライト有効フラグ）
  const isToday = currentDate === todayStr;

  if (tetrisQuery.isLoading) {
    return (
      <AppLayout title="テトリス">
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="テトリス（スケジュール）" noPadding>
      {/* 同期ステータスバー */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {syncStatus?.success === false ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          )}
          <span>
            {syncStatus
              ? `最終同期：${formatSyncTime(syncStatus.lastSyncAt)}（${syncStatus.rowsUpserted}件）`
              : "同期状況を確認中..."}
          </span>
        </div>
        <button
          onClick={() => manualSyncMutation.mutate()}
          disabled={manualSyncMutation.isPending}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium py-1 px-2.5 rounded-lg bg-blue-50 active:bg-blue-100 disabled:opacity-50"
        >
          {manualSyncMutation.isPending
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <RefreshCw className="w-3 h-3" />}
          今すぐ同期
        </button>
      </div>

      {/* ビュー切替 */}
      <div className="px-4 pt-2 pb-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode("person")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${viewMode === "person" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}
          >
            人別ビュー
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${viewMode === "timeline" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}
          >
            時間軸ビュー
          </button>
        </div>
      </div>

      {/* 日付タブ */}
      <div className="overflow-x-auto px-4 pb-2">
        <div className="flex gap-2 w-max">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${currentDate === d ? "bg-blue-700 text-white" : "bg-white text-gray-600 border border-gray-200"}
                ${d === todayStr ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
            >
              {dayLabels[d] ?? d}
              {d === todayStr && <span className="ml-1 text-[10px]">今日</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* 人別ビュー */}
        {viewMode === "person" && (
          <>
            {/* スタッフタブ */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {STAFF_IDS.map((id) => {
                const c = STAFF_COLORS[id];
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedStaff(id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all
                      ${selectedStaff === id
                        ? `${c.bg} ${c.text} ${c.border} border-2`
                        : "bg-white text-gray-500 border-gray-200"
                      }`}
                  >
                    {STAFF_NAMES[id]}
                  </button>
                );
              })}
            </div>

            {personEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                この日のスケジュールはありません
              </div>
            ) : (
              <div className="space-y-2">
                {personEntries.map((e, i) => {
                  const c = STAFF_COLORS[e.staffId] ?? STAFF_COLORS.yuuyu;
                  const isCurrent = isToday && isCurrentSlot(e.timeSlot, nowMinutes);
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 p-3 rounded-xl border transition-all
                        ${isCurrent
                          ? "border-red-400 bg-red-50 shadow-md animate-pulse ring-2 ring-red-300"
                          : `${c.bg} ${c.border}`
                        }`}
                    >
                      <div className={`flex-shrink-0 text-xs font-mono pt-0.5 w-24 ${isCurrent ? "text-red-600 font-bold" : "text-gray-500"}`}>
                        {e.timeSlot}
                        {isCurrent && <span className="block text-[10px] text-red-500 font-semibold mt-0.5">▶ 現在</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        {e.category && (
                          <div className={`text-xs mb-0.5 ${isCurrent ? "text-red-400" : "text-gray-400"}`}>{e.category}</div>
                        )}
                        <div className={`text-sm font-medium whitespace-pre-line ${isCurrent ? "text-red-700" : c.text}`}>
                          {e.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* タイムラインビュー */}
        {viewMode === "timeline" && (
          <div className="space-y-3">
            {timelineEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                この日のスケジュールはありません
              </div>
            ) : (
              timelineEntries.map(({ slot, items }) => {
                const isCurrent = isToday && isCurrentSlot(slot, nowMinutes);
                return (
                  <div
                    key={slot}
                    className={`rounded-xl border overflow-hidden transition-all
                      ${isCurrent
                        ? "border-red-400 shadow-md ring-2 ring-red-300 animate-pulse"
                        : "border-gray-100 bg-white"
                      }`}
                  >
                    <div className={`px-3 py-2 border-b flex items-center gap-2
                      ${isCurrent ? "bg-red-500 border-red-400" : "bg-gray-50 border-gray-100"}`}
                    >
                      <span className={`text-xs font-mono font-semibold ${isCurrent ? "text-white" : "text-gray-600"}`}>
                        {slot}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-white text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                          ▶ 現在
                        </span>
                      )}
                    </div>
                    <div className={`p-2 space-y-1 ${isCurrent ? "bg-red-50" : ""}`}>
                      {STAFF_IDS.map((staffId) => {
                        const entry = items.find((e) => e.staffId === staffId);
                        if (!entry) return null;
                        const c = STAFF_COLORS[staffId];
                        return (
                          <div key={staffId} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${isCurrent ? "bg-white/80" : c.bg}`}>
                            <span className={`text-xs font-semibold flex-shrink-0 w-16 ${isCurrent ? "text-red-700" : c.text}`}>
                              {STAFF_NAMES[staffId]}
                            </span>
                            <span className={`text-xs whitespace-pre-line ${isCurrent ? "text-red-800" : c.text}`}>
                              {entry.content}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
