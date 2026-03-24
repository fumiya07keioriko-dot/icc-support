import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Users, CheckSquare, Map, Calendar, AlertCircle, Clock, ChevronRight, MapPin, UserCircle } from "lucide-react";

import { useMyself } from "@/contexts/MySelfContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS: Record<string, { label: string; emoji: string; badge: string; cardBg: string; cardBorder: string; avatarBg: string }> = {
  active:     { label: "稼働中",        emoji: "🟢", badge: "bg-green-100 text-green-800",   cardBg: "bg-green-50",  cardBorder: "border-green-200",  avatarBg: "bg-green-500" },
  moving:     { label: "移動中",        emoji: "🟠", badge: "bg-orange-100 text-orange-800", cardBg: "bg-orange-50", cardBorder: "border-orange-200", avatarBg: "bg-orange-400" },
  break_1f:   { label: "休憩（1F）",    emoji: "☕", badge: "bg-purple-100 text-purple-800", cardBg: "bg-purple-50", cardBorder: "border-purple-200", avatarBg: "bg-purple-400" },
  break_3f:   { label: "休憩（3F）",    emoji: "☕", badge: "bg-violet-100 text-violet-800", cardBg: "bg-violet-50", cardBorder: "border-violet-200", avatarBg: "bg-violet-400" },
  break_room: { label: "休憩（控え室）", emoji: "🛋️", badge: "bg-slate-100 text-slate-700",  cardBg: "bg-slate-50",  cardBorder: "border-slate-200",  avatarBg: "bg-slate-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-green-100 text-green-700",
};
const PRIORITY_LABELS: Record<string, string> = { high: "高", medium: "中", low: "低" };

function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "未更新";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function Dashboard() {
  const { myStaffId, setMyStaffId } = useMyself();
  const staffQuery = trpc.staff.list.useQuery();
  const taskQuery = trpc.task.list.useQuery({ includeCompleted: false });

  const staffList = staffQuery.data ?? [];
  const taskList = taskQuery.data ?? [];
  const urgentTasks = taskList.filter((t) => t.priority === "high" && t.state !== "done");

  // 自分を選択ダイアログ（初回のみ表示）
  const [showMyselfDialog, setShowMyselfDialog] = useState(false);

  useEffect(() => {
    // スタッフデータが読み込まれ、まだ自分が未選択なら初回ダイアログを表示
    if (!staffQuery.isLoading && staffList.length > 0 && !myStaffId) {
      setShowMyselfDialog(true);
    }
  }, [staffQuery.isLoading, staffList.length, myStaffId]);

  // 自分を先頭に並び替えたスタッフリスト
  const sortedStaffList = myStaffId
    ? [
        ...staffList.filter((s) => s.staffId === myStaffId),
        ...staffList.filter((s) => s.staffId !== myStaffId),
      ]
    : staffList;

  const myStaff = staffList.find((s) => s.staffId === myStaffId);

  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
  const timeStr = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout
      title="ICC Support"
      headerRight={
        <div className="flex items-center gap-2">
          {/* 自分の名前表示（タップで変更） */}
          <button
            onClick={() => setShowMyselfDialog(true)}
            className="flex items-center gap-1 text-blue-200 text-xs hover:text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserCircle className="w-3.5 h-3.5" />
            <span>{myStaff ? myStaff.name : "自分を選択"}</span>
          </button>

        </div>
      }
    >
      {/* 日時バー */}
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
        <Clock className="w-3.5 h-3.5" />
        <span>{dateStr} {timeStr}</span>
      </div>

      {/* 緊急タスクバナー */}
      {urgentTasks.length > 0 && (
        <Link href="/tasks">
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-700 flex-1">
              優先度「高」のタスク {urgentTasks.length}件
              {urgentTasks[0] && <span className="font-normal"> — {urgentTasks[0].title}</span>}
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* ─── スタッフ状況（3列グリッド） ─── */}
      <section className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />スタッフ状況
          </h2>
          <Link href="/staff" className="text-xs text-blue-600 flex items-center gap-0.5">
            更新 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {staffQuery.isLoading ? (
          <div className="text-xs text-gray-400 py-3 text-center">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {sortedStaffList.map((s) => {
              const opt = STATUS_OPTIONS[s.status] ?? STATUS_OPTIONS["active"];
              const isMe = s.staffId === myStaffId;
              return (
                <Link key={s.staffId} href="/staff">
                  <div className={`rounded-xl border-2 p-2 text-center transition-all ${opt.cardBg}
                    ${isMe ? "border-blue-400 ring-2 ring-blue-300 ring-offset-1 shadow-md" : opt.cardBorder}`}
                  >
                    {/* 「自分」バッジ */}
                    {isMe && (
                      <div className="text-xs text-blue-600 font-bold mb-0.5 leading-none">👤 自分</div>
                    )}
                    {/* アバター */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-1 ${opt.avatarBg}`}>
                      {s.name.charAt(0)}
                    </div>
                    {/* 名前 */}
                    <p className="text-xs font-semibold text-gray-800 leading-tight mb-1">{s.name}</p>
                    {/* ステータス */}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${opt.badge}`}>
                      {opt.emoji} {opt.label}
                    </span>
                    {/* 場所 */}
                    {s.areaName || s.venueName ? (
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-0.5 leading-tight">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{s.areaName ?? s.venueName}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">-</p>
                    )}
                    {/* 更新時刻 */}
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(s.updatedAt)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 未完了タスク ─── */}
      <section className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />未完了タスク
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {taskList.length}
            </span>
          </h2>
          <Link href="/tasks" className="text-xs text-blue-600 flex items-center gap-0.5">
            全て <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {taskQuery.isLoading ? (
          <div className="text-xs text-gray-400 py-3 text-center">読み込み中...</div>
        ) : taskList.length === 0 ? (
          <div className="text-xs text-gray-400 py-3 text-center bg-white rounded-xl border border-gray-100">
            未完了タスクなし ✓
          </div>
        ) : (
          <div className="space-y-1.5">
            {taskList.slice(0, 4).map((t) => (
              <Link key={t.id} href="/tasks">
                <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                  <span className="text-sm text-gray-800 flex-1 truncate">{t.title}</span>
                  {t.assigneeId && (
                    <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {staffList.find(s => s.staffId === t.assigneeId)?.name ?? t.assigneeId}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {taskList.length > 4 && (
              <Link href="/tasks">
                <div className="text-xs text-blue-600 text-center py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                  他 {taskList.length - 4} 件を表示
                </div>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ─── クイックアクセス（2列） ─── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 mb-2">クイックアクセス</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/map">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5 active:bg-blue-100 transition-colors">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">会場マップ</p>
                <p className="text-xs text-gray-500">1F〜34F</p>
              </div>
            </div>
          </Link>
          <Link href="/tetris">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2.5 active:bg-orange-100 transition-colors">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">テトリス</p>
                <p className="text-xs text-gray-500">3/1〜3/5</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 自分を選択ダイアログ ─── */}
      <Dialog open={showMyselfDialog} onOpenChange={setShowMyselfDialog}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-600" />
              あなたは誰ですか？
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-3">
            自分のカードが先頭に表示されます。
          </p>
          <div className="grid grid-cols-2 gap-2">
            {staffList.map((s) => {
              const opt = STATUS_OPTIONS[s.status] ?? STATUS_OPTIONS["active"];
              const isSelected = s.staffId === myStaffId;
              return (
                <button
                  key={s.staffId}
                  onClick={() => {
                    setMyStaffId(s.staffId);
                    setShowMyselfDialog(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all active:scale-95
                    ${isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${opt.avatarBg}`}>
                    {s.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{s.name}</span>
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-1 text-gray-400 text-xs"
            onClick={() => {
              setMyStaffId(null);
              setShowMyselfDialog(false);
            }}
          >
            スキップ（選択しない）
          </Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
