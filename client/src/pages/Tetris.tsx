import { useState, useMemo } from "react";
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

  const entries = tetrisQuery.data ?? [];
  const syncStatus = syncStatusQuery.data;

  // 日付一覧（シートから取得した順）
  const dates = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    entries.forEach((e) => {
      if (!seen.has(e.date)) { seen.add(e.date); result.push(e.date); }
    });
    return result;
  }, [entries]);

  // 初期日付を設定
  const currentDate = selectedDate || dates[0] || "";

  // 日付ラベルマップ
  const dayLabels = useMemo(() => {
    const map: Record<string, string> = {};
    entries.forEach((e) => { map[e.date] = e.dayLabel ?? e.date; });
    return map;
  }, [entries]);

  // 人別ビュー：選択スタッフ × 選択日
  const personEntries = useMemo(() => {
    return entries
      .filter((e) => e.staffId === selectedStaff && e.date === currentDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [entries, selectedStaff, currentDate]);

  // タイムラインビュー：選択日 × 全スタッフ
  const timelineEntries = useMemo(() => {
    const filtered = entries.filter((e) => e.date === currentDate);
    const slots: Record<string, typeof filtered> = {};
    filtered.forEach((e) => {
      if (!slots[e.timeSlot]) slots[e.timeSlot] = [];
      slots[e.timeSlot].push(e);
    });
    return Object.entries(slots)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slot, items]) => ({ slot, items }));
  }, [entries, currentDate]);

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
                ${currentDate === d ? "bg-blue-700 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              {dayLabels[d] ?? d}
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
                  return (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                      <div className="flex-shrink-0 text-xs font-mono text-gray-500 pt-0.5 w-24">
                        {e.timeSlot}
                      </div>
                      <div className="flex-1 min-w-0">
                        {e.category && (
                          <div className="text-xs text-gray-400 mb-0.5">{e.category}</div>
                        )}
                        <div className={`text-sm font-medium ${c.text} whitespace-pre-line`}>{e.content}</div>
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
              timelineEntries.map(({ slot, items }) => (
                <div key={slot} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-mono font-semibold text-gray-600">{slot}</span>
                  </div>
                  <div className="p-2 space-y-1">
                    {STAFF_IDS.map((staffId) => {
                      const entry = items.find((e) => e.staffId === staffId);
                      if (!entry) return null;
                      const c = STAFF_COLORS[staffId];
                      return (
                        <div key={staffId} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${c.bg}`}>
                          <span className={`text-xs font-semibold flex-shrink-0 w-16 ${c.text}`}>
                            {STAFF_NAMES[staffId]}
                          </span>
                          <span className={`text-xs ${c.text} whitespace-pre-line`}>{entry.content}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
