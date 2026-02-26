import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare, Map, Calendar, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { usePinAuth } from "@/contexts/PinAuthContext";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  active: "稼働中",
  moving: "移動中",
  break: "休憩",
  available: "ヘルプ可",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  moving: "bg-orange-100 text-orange-800",
  break: "bg-purple-100 text-purple-800",
  available: "bg-blue-100 text-blue-800",
};

const PRIORITY_LABELS: Record<string, string> = { high: "高", medium: "中", low: "低" };
const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-green-100 text-green-700",
};

function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "未更新";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function Dashboard() {
  const { logout } = usePinAuth();
  const staffQuery = trpc.staff.list.useQuery();
  const taskQuery = trpc.task.list.useQuery({ includeCompleted: false });

  const staffList = staffQuery.data ?? [];
  const taskList = taskQuery.data ?? [];
  const urgentTasks = taskList.filter((t) => t.priority === "high" && t.state !== "done");

  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
  const timeStr = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout
      title="ICC Support"
      headerRight={
        <button onClick={logout} className="text-blue-200 text-xs hover:text-white">
          ログアウト
        </button>
      }
    >
      {/* 日時 */}
      <div className="mb-4 flex items-center gap-2 text-gray-500 text-sm">
        <Clock className="w-4 h-4" />
        <span>{dateStr} {timeStr}</span>
      </div>

      {/* 緊急タスク */}
      {urgentTasks.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 mb-1">優先度「高」のタスク {urgentTasks.length}件</p>
            {urgentTasks.slice(0, 2).map((t) => (
              <p key={t.id} className="text-xs text-red-600">・{t.title}</p>
            ))}
          </div>
          <Link href="/tasks">
            <ChevronRight className="w-4 h-4 text-red-400" />
          </Link>
        </div>
      )}

      {/* スタッフ状況 */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Users className="w-4 h-4" />スタッフ状況
          </h2>
          <Link href="/staff" className="text-xs text-blue-600 flex items-center gap-0.5">
            詳細 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {staffQuery.isLoading ? (
            <div className="text-sm text-gray-400 py-4 text-center">読み込み中...</div>
          ) : (
            staffList.map((s) => (
              <Card key={s.staffId} className="shadow-none border border-gray-100">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700">
                      {s.name.slice(0, 1)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{s.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {s.venueName ? `${s.venueName}${s.areaName ? ` › ${s.areaName}` : ""}` : "場所未設定"}
                      {s.workContent ? ` — ${s.workContent}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(s.updatedAt)}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* タスク概要 */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4" />未完了タスク
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {taskList.length}
            </span>
          </h2>
          <Link href="/tasks" className="text-xs text-blue-600 flex items-center gap-0.5">
            詳細 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {taskQuery.isLoading ? (
            <div className="text-sm text-gray-400 py-4 text-center">読み込み中...</div>
          ) : taskList.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center bg-white rounded-xl border border-gray-100">
              未完了タスクはありません
            </div>
          ) : (
            taskList.slice(0, 3).map((t) => (
              <Card key={t.id} className="shadow-none border border-gray-100">
                <CardContent className="p-3 flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                  <span className="text-sm text-gray-800 flex-1 truncate">{t.title}</span>
                  {t.assigneeId && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{t.assigneeId}</span>
                  )}
                </CardContent>
              </Card>
            ))
          )}
          {taskList.length > 3 && (
            <Link href="/tasks">
              <div className="text-xs text-blue-600 text-center py-2">
                他 {taskList.length - 3} 件を表示
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* クイックアクセス */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">クイックアクセス</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/map">
            <Card className="shadow-none border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Map className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">会場マップ</span>
                <span className="text-xs text-gray-400">1F・3F・4F・34F・32F</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/tetris">
            <Card className="shadow-none border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">テトリス</span>
                <span className="text-xs text-gray-400">3/1〜3/5 スケジュール</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
