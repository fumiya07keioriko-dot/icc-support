import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { useMyself } from "@/contexts/MySelfContext";

const STATUS_OPTIONS = [
  { value: "active",     label: "稼働中",         emoji: "🟢", bg: "bg-green-50",  border: "border-green-300",  badge: "bg-green-100 text-green-800",   cardBg: "bg-green-50",  cardBorder: "border-green-200" },
  { value: "moving",     label: "移動中",         emoji: "🟠", bg: "bg-orange-50", border: "border-orange-300", badge: "bg-orange-100 text-orange-800", cardBg: "bg-orange-50", cardBorder: "border-orange-200" },
  { value: "break_1f",   label: "休憩（1F）",      emoji: "☕", bg: "bg-purple-50", border: "border-purple-300", badge: "bg-purple-100 text-purple-800", cardBg: "bg-purple-50", cardBorder: "border-purple-200" },
  { value: "break_3f",   label: "休憩（3F）",      emoji: "☕", bg: "bg-violet-50", border: "border-violet-300", badge: "bg-violet-100 text-violet-800", cardBg: "bg-violet-50", cardBorder: "border-violet-200" },
  { value: "break_room", label: "休憩（控え室）",   emoji: "🛋️", bg: "bg-slate-50",  border: "border-slate-300",  badge: "bg-slate-100 text-slate-700",   cardBg: "bg-slate-50",  cardBorder: "border-slate-200" },
] as const;

type StatusValue = typeof STATUS_OPTIONS[number]["value"];

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

function getInitial(name: string): string {
  return name.charAt(0);
}

export default function Staff() {
  const utils = trpc.useUtils();
  const staffQuery = trpc.staff.list.useQuery();
  const venueQuery = trpc.venue.list.useQuery();
  const { myStaffId } = useMyself();

  // 詳細編集用モーダル
  const [editingMember, setEditingMember] = useState<(typeof staffList)[0] | null>(null);
  const [detailForm, setDetailForm] = useState<{
    venueId: number | null;
    areaId: number | null;
    workContent: string;
  }>({ venueId: null, areaId: null, workContent: "" });
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [savingDetailId, setSavingDetailId] = useState<string | null>(null);

  const staffList = staffQuery.data ?? [];
  const venueList = venueQuery.data ?? [];

  // 自分を先頭に並び替え
  const sortedStaffList = myStaffId
    ? [
        ...staffList.filter((s) => s.staffId === myStaffId),
        ...staffList.filter((s) => s.staffId !== myStaffId),
      ]
    : staffList;

  // ステータスをワンタップで即時更新
  const handleStatusTap = async (staffId: string, newStatus: StatusValue, currentData: typeof staffList[0]) => {
    if (updatingStatusId) return;
    setUpdatingStatusId(staffId);
    try {
      await utils.client.staff.updateStatus.mutate({
        staffId,
        status: newStatus,
        venueId: currentData.venueId ?? null,
        areaId: currentData.areaId ?? null,
        workContent: currentData.workContent ?? "",
      });
      await utils.staff.list.invalidate();
      // モーダルが開いていれば閉じる
      if (editingMember?.staffId === staffId) {
        setEditingMember(null);
      }
      toast.success(`${currentData.name}：${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}に更新`);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // 詳細編集モーダルを開く
  const openEdit = (member: typeof staffList[0]) => {
    setEditingMember(member);
    setDetailForm({
      venueId: member.venueId ?? null,
      areaId: member.areaId ?? null,
      workContent: member.workContent ?? "",
    });
  };

  // 詳細保存
  const handleDetailSave = async () => {
    if (!editingMember) return;
    setSavingDetailId(editingMember.staffId);
    try {
      await utils.client.staff.updateStatus.mutate({
        staffId: editingMember.staffId,
        status: (editingMember.status ?? "active") as StatusValue,
        venueId: detailForm.venueId,
        areaId: detailForm.areaId,
        workContent: detailForm.workContent,
      });
      await utils.staff.list.invalidate();
      toast.success("詳細を更新しました");
      setEditingMember(null);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSavingDetailId(null);
    }
  };

  const selectedVenue = venueList.find((v) => v.id === detailForm.venueId);
  const areaOptions = selectedVenue?.areas ?? [];

  if (staffQuery.isLoading) {
    return (
      <AppLayout title="スタッフ状況">
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="スタッフ状況">
      {/* 2行×3列グリッド */}
      <div className="grid grid-cols-3 gap-2.5">
        {sortedStaffList.map((member) => {
          const currentStatus = (member.status ?? "active") as StatusValue;
          const statusOpt = STATUS_OPTIONS.find((s) => s.value === currentStatus) ?? STATUS_OPTIONS[0];
          const isUpdating = updatingStatusId === member.staffId;
          const isMe = member.staffId === myStaffId;

          return (
            <button
              key={member.staffId}
              onClick={() => openEdit(member)}
              disabled={isUpdating}
              className={`relative rounded-2xl border-2 p-3 text-left transition-all active:scale-95
                ${statusOpt.cardBg}
                ${isMe ? "border-blue-400 ring-2 ring-blue-300 ring-offset-1 shadow-lg" : `${statusOpt.cardBorder} shadow-sm`}
                ${isUpdating ? "opacity-60" : ""}`}
            >
              {/* 自分バッジ */}
              {isMe && (
                <div className="text-xs text-blue-600 font-bold text-center mb-0.5 leading-none">👤 自分</div>
              )}
              {/* アバター */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 mx-auto
                ${currentStatus === "active" ? "bg-green-500" :
                  currentStatus === "moving" ? "bg-orange-400" :
                  currentStatus === "break_1f" || currentStatus === "break_3f" ? "bg-purple-400" :
                  "bg-slate-400"}`}
              >
                {isUpdating
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : getInitial(member.name)}
              </div>

              {/* 名前 */}
              <p className="text-center font-semibold text-gray-800 text-sm leading-tight mb-1">
                {member.name}
              </p>

              {/* ステータスバッジ */}
              <div className="flex justify-center mb-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusOpt.badge}`}>
                  {statusOpt.emoji} {statusOpt.label}
                </span>
              </div>

              {/* 場所 */}
              {member.venueName ? (
                <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-0.5 leading-tight">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">{member.areaName ?? member.venueName}</span>
                </p>
              ) : (
                <p className="text-center text-xs text-gray-400">場所未設定</p>
              )}

              {/* 更新時刻 */}
              <p className="text-center text-xs text-gray-400 mt-1 flex items-center justify-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatRelativeTime(member.updatedAt)}
              </p>
            </button>
          );
        })}
      </div>

      {/* 詳細編集モーダル */}
      <Dialog open={!!editingMember} onOpenChange={(open) => { if (!open) setEditingMember(null); }}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          {editingMember && (() => {
            const currentStatus = (editingMember.status ?? "active") as StatusValue;
            const isUpdating = updatingStatusId === editingMember.staffId;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      {getInitial(editingMember.name)}
                    </span>
                    {editingMember.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-1">
                  {/* ステータス選択 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">ステータス</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusTap(editingMember.staffId, opt.value, editingMember)}
                          disabled={isUpdating}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all active:scale-95
                            ${currentStatus === opt.value
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }
                            ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span className="text-base">{opt.emoji}</span>
                          <span className="text-xs leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 場所・作業内容 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">場所・作業内容</p>

                    <Select
                      value={detailForm.venueId ? String(detailForm.venueId) : "none"}
                      onValueChange={(v) =>
                        setDetailForm((f) => ({ ...f, venueId: v === "none" ? null : Number(v), areaId: null }))
                      }
                    >
                      <SelectTrigger className="bg-white text-sm h-9">
                        <SelectValue placeholder="会場を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">会場未設定</SelectItem>
                        {venueList.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {areaOptions.length > 0 && (
                      <Select
                        value={detailForm.areaId ? String(detailForm.areaId) : "none"}
                        onValueChange={(v) =>
                          setDetailForm((f) => ({ ...f, areaId: v === "none" ? null : Number(v) }))
                        }
                      >
                        <SelectTrigger className="bg-white text-sm h-9">
                          <SelectValue placeholder="エリアを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">エリア未設定</SelectItem>
                          {areaOptions.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Input
                      value={detailForm.workContent}
                      onChange={(e) => setDetailForm((f) => ({ ...f, workContent: e.target.value }))}
                      placeholder="作業内容（任意）"
                      className="bg-white text-sm h-9"
                      maxLength={255}
                    />

                    <Button
                      className="w-full h-10"
                      onClick={handleDetailSave}
                      disabled={savingDetailId === editingMember.staffId}
                    >
                      {savingDetailId === editingMember.staffId
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />保存中...</>
                        : "場所・作業内容を保存"}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
