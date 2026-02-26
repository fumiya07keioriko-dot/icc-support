import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Pencil, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "active",    label: "稼働中",  color: "bg-green-100 text-green-800 border-green-200" },
  { value: "moving",    label: "移動中",  color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "break",     label: "休憩",    color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "available", label: "ヘルプ可", color: "bg-blue-100 text-blue-800 border-blue-200" },
] as const;

type StatusValue = typeof STATUS_OPTIONS[number]["value"];

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

export default function Staff() {
  const utils = trpc.useUtils();
  const staffQuery = trpc.staff.list.useQuery();
  const venueQuery = trpc.venue.list.useQuery();
  const updateMutation = trpc.staff.updateStatus.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      toast.success("状況を更新しました");
      setEditingStaffId(null);
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [form, setForm] = useState({
    venueId: null as number | null,
    areaId: null as number | null,
    workContent: "",
    status: "active" as StatusValue,
  });

  const staffList = staffQuery.data ?? [];
  const venueList = venueQuery.data ?? [];

  const openEdit = (s: typeof staffList[0]) => {
    setForm({
      venueId: s.venueId ?? null,
      areaId: s.areaId ?? null,
      workContent: s.workContent ?? "",
      status: (s.status as StatusValue) ?? "active",
    });
    setEditingStaffId(s.staffId);
  };

  const selectedVenue = venueList.find((v) => v.id === form.venueId);
  const areaOptions = selectedVenue?.areas ?? [];

  const handleSave = () => {
    if (!editingStaffId) return;
    updateMutation.mutate({
      staffId: editingStaffId,
      venueId: form.venueId,
      areaId: form.areaId,
      workContent: form.workContent,
      status: form.status,
    });
  };

  const editingStaff = staffList.find((s) => s.staffId === editingStaffId);

  return (
    <AppLayout title="スタッフ状況">
      {staffQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((s) => {
            const statusOpt = STATUS_OPTIONS.find((o) => o.value === s.status);
            return (
              <Card key={s.staffId} className="shadow-none border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* アバター */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-blue-700">{s.name.slice(0, 1)}</span>
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{s.name}</span>
                        {s.role === "admin" && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">統括</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusOpt?.color ?? ""}`}>
                          {statusOpt?.label ?? s.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {s.venueName
                          ? `📍 ${s.venueName}${s.areaName ? ` › ${s.areaName}` : ""}`
                          : "📍 場所未設定"}
                      </p>
                      {s.workContent && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">💬 {s.workContent}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(s.updatedAt)}</p>
                    </div>

                    {/* 編集ボタン */}
                    <button
                      onClick={() => openEdit(s)}
                      className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 編集ダイアログ */}
      <Dialog open={!!editingStaffId} onOpenChange={(o) => !o && setEditingStaffId(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff?.name} の状況を更新</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* ステータス */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ステータス</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                      ${form.status === opt.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 会場 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">会場</label>
              <Select
                value={form.venueId ? String(form.venueId) : "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, venueId: v === "none" ? null : Number(v), areaId: null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="会場を選択" />
                </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="エリアを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未設定</SelectItem>
                    {areaOptions.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 作業内容 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">作業内容</label>
              <Input
                value={form.workContent}
                onChange={(e) => setForm((f) => ({ ...f, workContent: e.target.value }))}
                placeholder="例：受付対応、パネル設置など"
                maxLength={100}
              />
            </div>

            <Button
              className="w-full h-11"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />更新中...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" />更新する</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
