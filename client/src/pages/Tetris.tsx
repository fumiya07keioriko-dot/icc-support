import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

const STAFF_IDS = ["yuuyu", "fumiya", "tsucchi", "yumeka", "babe"];
const STAFF_NAMES: Record<string, string> = {
  yuuyu: "ゆうゆ", fumiya: "ふみや", tsucchi: "つっちー", yumeka: "ゆめか", babe: "ばべちゃん",
};

const STAFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  yuuyu:   { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200" },
  fumiya:  { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200" },
  tsucchi: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  yumeka:  { bg: "bg-pink-50",   text: "text-pink-800",   border: "border-pink-200" },
  babe:    { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
};

export default function Tetris() {
  const tetrisQuery = trpc.tetris.list.useQuery();
  const [viewMode, setViewMode] = useState<"person" | "timeline">("person");
  const [selectedDate, setSelectedDate] = useState<string>("2026-03-01");
  const [selectedStaff, setSelectedStaff] = useState<string>("yuuyu");

  const entries = tetrisQuery.data ?? [];

  // 日付一覧
  const dates = useMemo(() => {
    const set = new Set(entries.map((e) => e.date));
    return Array.from(set).sort();
  }, [entries]);

  // 日付ラベルマップ
  const dayLabels = useMemo(() => {
    const map: Record<string, string> = {};
    entries.forEach((e) => { map[e.date] = e.dayLabel ?? e.date; });
    return map;
  }, [entries]);

  // 人別ビュー：選択スタッフ × 選択日
  const personEntries = useMemo(() => {
    return entries
      .filter((e) => e.staffId === selectedStaff && e.date === selectedDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [entries, selectedStaff, selectedDate]);

  // タイムラインビュー：選択日 × 全スタッフ
  const timelineEntries = useMemo(() => {
    const filtered = entries.filter((e) => e.date === selectedDate);
    // timeSlotでグループ化
    const slots: Record<string, typeof filtered> = {};
    filtered.forEach((e) => {
      if (!slots[e.timeSlot]) slots[e.timeSlot] = [];
      slots[e.timeSlot].push(e);
    });
    return Object.entries(slots)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slot, items]) => ({ slot, items }));
  }, [entries, selectedDate]);

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
      {/* ビュー切替 */}
      <div className="px-4 pt-4 pb-2">
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
                ${selectedDate === d ? "bg-blue-700 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
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

            {/* スケジュール */}
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
                      <div className="flex-shrink-0 text-xs font-mono text-gray-500 pt-0.5 w-20">
                        {e.timeSlot}
                      </div>
                      <div className={`text-sm font-medium ${c.text}`}>{e.content}</div>
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
                          <span className={`text-xs ${c.text}`}>{entry.content}</span>
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
