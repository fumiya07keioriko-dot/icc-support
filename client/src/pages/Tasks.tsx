import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Bell, BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useNotification } from "@/hooks/useNotification";

const PRIORITY_OPTIONS = [
  { value: "high",   label: "高", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "medium", label: "中", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "low",    label: "低", color: "bg-green-100 text-green-700 border-green-200" },
] as const;

const STATE_OPTIONS = [
  { value: "todo",        label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done",        label: "完了" },
] as const;

type Priority = typeof PRIORITY_OPTIONS[number]["value"];
type State = typeof STATE_OPTIONS[number]["value"];

const STAFF_IDS = ["yuuyu", "fumiya", "susshy", "yumeka", "babe"];
const STAFF_NAMES: Record<string, string> = {
  yuuyu: "ゆうゆ", fumiya: "ふみや", susshy: "すっしー", yumeka: "ゆめか", babe: "ばべちゃん",
};

/** Date → "YYYY-MM-DDTHH:mm" (datetime-local input用) */
function toDatetimeLocal(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:mm" → Date | null */
function fromDatetimeLocal(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatReminderLabel(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return `${d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}（期限切れ）`;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}分後`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間後`;
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const emptyForm = {
  title: "",
  description: "",
  priority: "medium" as Priority,
  state: "todo" as State,
  assigneeId: "" as string,
  venueId: null as number | null,
  areaId: null as number | null,
  reminderAt: "" as string, // datetime-local string
};

export default function Tasks() {
  const utils = trpc.useUtils();
  const { isSupported, permission, requestPermission, scheduleReminder, cancelReminder } = useNotification();

  const [showCompleted, setShowCompleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const taskQuery = trpc.task.list.useQuery({ includeCompleted: showCompleted });
  const venueQuery = trpc.venue.list.useQuery();

  const createMutation = trpc.task.create.useMutation({
    onSuccess: (data) => {
      utils.task.list.invalidate();
      toast.success("タスクを作成しました");
      setIsDialogOpen(false);
      // リマインダーをスケジュール
      const reminderDate = fromDatetimeLocal(form.reminderAt);
      if (reminderDate && reminderDate > new Date() && permission === "granted") {
        scheduleReminder({ taskId: data.id, title: form.title, reminderAt: reminderDate });
        toast.info(`リマインダーを設定しました（${formatReminderLabel(reminderDate)}）`);
      }
    },
    onError: () => toast.error("作成に失敗しました"),
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      toast.success("タスクを更新しました");
      setIsDialogOpen(false);
      // リマインダーを再スケジュール
      if (editingId !== null) {
        cancelReminder(editingId);
        const reminderDate = fromDatetimeLocal(form.reminderAt);
        if (reminderDate && reminderDate > new Date() && permission === "granted") {
          scheduleReminder({ taskId: editingId, title: form.title, reminderAt: reminderDate });
          toast.info(`リマインダーを更新しました（${formatReminderLabel(reminderDate)}）`);
        }
      }
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => { utils.task.list.invalidate(); toast.success("タスクを削除しました"); },
    onError: () => toast.error("削除に失敗しました"),
  });

  // ページロード時に既存リマインダーを再登録
  useEffect(() => {
    if (!taskQuery.data || permission !== "granted") return;
    const now = new Date();
    taskQuery.data.forEach((t) => {
      if (t.reminderAt && new Date(t.reminderAt) > now && t.state !== "done") {
        scheduleReminder({ taskId: t.id, title: t.title, reminderAt: t.reminderAt });
      }
    });
  }, [taskQuery.data, permission]);

  const taskList = taskQuery.data ?? [];
  const venueList = venueQuery.data ?? [];
  const selectedVenue = venueList.find((v) => v.id === form.venueId);
  const areaOptions = selectedVenue?.areas ?? [];

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEdit = (t: typeof taskList[0]) => {
    setForm({
      title: t.title,
      description: t.description ?? "",
      priority: t.priority as Priority,
      state: t.state as State,
      assigneeId: t.assigneeId ?? "",
      venueId: t.venueId ?? null,
      areaId: t.areaId ?? null,
      reminderAt: toDatetimeLocal(t.reminderAt ? new Date(t.reminderAt) : null),
    });
    setEditingId(t.id);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("タイトルを入力してください"); return; }
    const reminderDate = fromDatetimeLocal(form.reminderAt);

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        state: form.state,
        assigneeId: form.assigneeId || null,
        venueId: form.venueId,
        areaId: form.areaId,
        reminderAt: reminderDate,
      });
    } else {
      createMutation.mutate({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        venueId: form.venueId ?? undefined,
        areaId: form.areaId ?? undefined,
        reminderAt: reminderDate ?? undefined,
      });
    }
  };

  const handleQuickDone = (t: typeof taskList[0]) => {
    const newState = t.state === "done" ? "todo" : "done";
    updateMutation.mutate({ id: t.id, state: newState });
    if (newState === "done") cancelReminder(t.id);
  };

  const handleRequestNotification = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("通知が許可されました");
    } else {
      toast.error("通知が拒否されました。ブラウザの設定から許可してください");
    }
  };

  const priorityOpt = (p: string) => PRIORITY_OPTIONS.find((o) => o.value === p);
  const stateOpt = (s: string) => STATE_OPTIONS.find((o) => o.value === s);

  const sortedTasks = [...taskList].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority as Priority] ?? 1) - (order[b.priority as Priority] ?? 1);
  });

  return (
    <AppLayout
      title="タスク管理"
      headerRight={
        <button
          onClick={openCreate}
          className="flex items-center gap-1 bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
        >
          <Plus className="w-4 h-4" />追加
        </button>
      }
    >
      {/* 通知許可バナー */}
      {isSupported && permission === "default" && (
        <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
          <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs text-blue-700 flex-1">リマインダー通知を有効にしますか？</span>
          <button
            onClick={handleRequestNotification}
            className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg active:bg-blue-200"
          >
            許可する
          </button>
        </div>
      )}
      {isSupported && permission === "denied" && (
        <div className="mb-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <BellOff className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500">通知がブロックされています。ブラウザ設定から許可してください</span>
        </div>
      )}

      {/* フィルター */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
            ${showCompleted ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}
        >
          {showCompleted ? "完了含む" : "未完了のみ"}
        </button>
        <span className="text-xs text-gray-400">{taskList.length}件</span>
      </div>

      {taskQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">タスクがありません</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />タスクを追加
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((t) => {
            const pOpt = priorityOpt(t.priority);
            const sOpt = stateOpt(t.state);
            const isExpanded = expandedId === t.id;
            const isDone = t.state === "done";
            const hasReminder = !!t.reminderAt;
            const reminderPast = hasReminder && new Date(t.reminderAt!) < new Date();

            return (
              <Card key={t.id} className={`shadow-none border transition-colors ${isDone ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-white"}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    {/* 完了チェック */}
                    <button
                      onClick={() => handleQuickDone(t)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                        ${isDone ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
                    >
                      {isDone && <span className="text-white text-xs">✓</span>}
                    </button>

                    {/* タイトル・バッジ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${pOpt?.color ?? ""}`}>
                          {pOpt?.label}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {sOpt?.label}
                        </span>
                        {t.assigneeId && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {STAFF_NAMES[t.assigneeId] ?? t.assigneeId}
                          </span>
                        )}
                        {hasReminder && (
                          <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded
                            ${reminderPast ? "bg-red-50 text-red-500" : "bg-yellow-50 text-yellow-700"}`}>
                            <BellRing className="w-3 h-3" />
                            {formatReminderLabel(t.reminderAt ? new Date(t.reminderAt) : null)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-medium mt-1 ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {t.title}
                      </p>
                      {isExpanded && t.description && (
                        <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                      )}
                    </div>

                    {/* アクション */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("このタスクを削除しますか？")) {
                            deleteMutation.mutate({ id: t.id });
                            cancelReminder(t.id);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 作成・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "タスクを編集" : "タスクを追加"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* タイトル */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">タイトル *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="タスクのタイトル"
                maxLength={255}
              />
            </div>

            {/* 優先度 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">優先度</label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, priority: opt.value }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all
                      ${form.priority === opt.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 状態（編集時のみ） */}
            {editingId !== null && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">状態</label>
                <Select
                  value={form.state}
                  onValueChange={(v) => setForm((f) => ({ ...f, state: v as State }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 担当者 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">担当者</label>
              <Select
                value={form.assigneeId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, assigneeId: v === "none" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="担当者を選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未割当</SelectItem>
                  {STAFF_IDS.map((id) => (
                    <SelectItem key={id} value={id}>{STAFF_NAMES[id]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 会場 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">会場</label>
              <Select
                value={form.venueId ? String(form.venueId) : "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, venueId: v === "none" ? null : Number(v), areaId: null }))}
              >
                <SelectTrigger><SelectValue placeholder="会場を選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未設定</SelectItem>
                  {venueList.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* エリア */}
            {areaOptions.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">エリア</label>
                <Select
                  value={form.areaId ? String(form.areaId) : "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, areaId: v === "none" ? null : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="エリアを選択" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未設定</SelectItem>
                    {areaOptions.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* リマインダー */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-yellow-600" />
                リマインダー（任意）
              </label>
              {permission === "denied" ? (
                <p className="text-xs text-red-500">通知がブロックされています。ブラウザ設定から許可してください。</p>
              ) : permission === "default" ? (
                <div className="space-y-2">
                  <Input
                    type="datetime-local"
                    value={form.reminderAt}
                    onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value }))}
                    className="text-sm"
                  />
                  {form.reminderAt && (
                    <p className="text-xs text-orange-600">
                      ⚠️ 通知を受け取るには「許可する」が必要です
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleRequestNotification}
                    className="w-full text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-2 font-medium"
                  >
                    <Bell className="w-3.5 h-3.5 inline mr-1" />通知を許可する
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    type="datetime-local"
                    value={form.reminderAt}
                    onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value }))}
                    className="text-sm"
                  />
                  {form.reminderAt && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {formatReminderLabel(fromDatetimeLocal(form.reminderAt))}に通知
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 説明 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">説明（任意）</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="詳細メモ"
                rows={3}
                maxLength={1000}
              />
            </div>

            <Button
              className="w-full h-11"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>
              ) : (
                editingId !== null ? "更新する" : "作成する"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
