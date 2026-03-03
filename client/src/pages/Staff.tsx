import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, MessageSquare, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "active",      label: "稼働中",         emoji: "🟢", border: "border-l-green-500",  bg: "bg-green-50",   badge: "bg-green-100 text-green-800" },
  { value: "moving",      label: "移動中",         emoji: "🟠", border: "border-l-orange-400", bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800" },
  { value: "break_1f",    label: "休憩中（1階）",   emoji: "☕", border: "border-l-purple-400", bg: "bg-purple-50",  badge: "bg-purple-100 text-purple-800" },
  { value: "break_3f",    label: "休憩中（3階）",   emoji: "☕", border: "border-l-violet-400", bg: "bg-violet-50",  badge: "bg-violet-100 text-violet-800" },
  { value: "break_room",  label: "休憩中（控え室）", emoji: "🛋️", border: "border-l-slate-400",  bg: "bg-slate-50",   badge: "bg-slate-100 text-slate-700" },
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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState<Record<string, {
    venueId: number | null;
    areaId: number | null;
    workContent: string;
  }>>({});
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [savingDetailId, setSavingDetailId] = useState<string | null>(null);

  const staffList = staffQuery.data ?? [];
  const venueList = venueQuery.data ?? [];

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
      toast.success(`${currentData.name}：${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}に更新しました`);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // 詳細（会場・エリア・作業内容）を保存
  const handleDetailSave = async (staffId: string, currentStatus: StatusValue) => {
    const form = detailForm[staffId];
    if (!form) return;
    setSavingDetailId(staffId);
    try {
      await utils.client.staff.updateStatus.mutate({
        staffId,
        status: currentStatus,
        venueId: form.venueId,
        areaId: form.areaId,
        workContent: form.workContent,
      });
      await utils.staff.list.invalidate();
      toast.success("詳細を更新しました");
      setExpandedId(null);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSavingDetailId(null);
    }
  };

  const toggleExpand = (staffId: string, currentData: typeof staffList[0]) => {
    if (expandedId === staffId) {
      setExpandedId(null);
    } else {
      setExpandedId(staffId);
      setDetailForm((prev) => ({
        ...prev,
        [staffId]: {
          venueId: currentData.venueId ?? null,
          areaId: currentData.areaId ?? null,
          workContent: currentData.workContent ?? "",
        },
      }));
    }
  };

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
      <div className="space-y-3">
        {staffList.map((member) => {
          const currentStatus = (member.status ?? "active") as StatusValue;
          const statusOpt = STATUS_OPTIONS.find((s) => s.value === currentStatus) ?? STATUS_OPTIONS[0];
          const isExpanded = expandedId === member.staffId;
          const isUpdating = updatingStatusId === member.staffId;
          const isSaving = savingDetailId === member.staffId;
          const form = detailForm[member.staffId];
          const selectedVenue = venueList.find((v) => v.id === form?.venueId);
          const areaOptions = selectedVenue?.areas ?? [];

          return (
            <div
              key={member.staffId}
              className={`rounded-xl border-l-4 border border-gray-100 bg-white shadow-sm overflow-hidden transition-all ${statusOpt.border}`}
            >
              {/* カードヘッダー：タップで展開 */}
              <button
                className="w-full text-left px-4 py-3"
                onClick={() => toggleExpand(member.staffId, member)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isUpdating ? "⏳" : statusOpt.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{member.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusOpt.badge}`}>
                          {statusOpt.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {member.venueName && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {member.venueName}{member.areaName ? ` / ${member.areaName}` : ""}
                          </span>
                        )}
                        {member.workContent && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" />
                            {member.workContent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(member.updatedAt)}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </button>

              {/* 展開パネル */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-4 pb-4 pt-1 border-t border-gray-100 ${statusOpt.bg}`}>
                      {/* ステータスボタン（2列グリッド） */}
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">ステータスを変更</p>
                        <div className="grid grid-cols-2 gap-2">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusTap(member.staffId, opt.value, member)}
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

                      {/* 詳細編集 */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">場所・作業内容</p>

                        {/* 会場 */}
                        <Select
                          value={form?.venueId ? String(form.venueId) : "none"}
                          onValueChange={(v) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              [member.staffId]: {
                                ...prev[member.staffId],
                                venueId: v === "none" ? null : Number(v),
                                areaId: null,
                              },
                            }))
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

                        {/* エリア */}
                        {areaOptions.length > 0 && (
                          <Select
                            value={form?.areaId ? String(form.areaId) : "none"}
                            onValueChange={(v) =>
                              setDetailForm((prev) => ({
                                ...prev,
                                [member.staffId]: {
                                  ...prev[member.staffId],
                                  areaId: v === "none" ? null : Number(v),
                                },
                              }))
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

                        {/* 作業内容 */}
                        <Input
                          value={form?.workContent ?? ""}
                          onChange={(e) =>
                            setDetailForm((prev) => ({
                              ...prev,
                              [member.staffId]: {
                                ...prev[member.staffId],
                                workContent: e.target.value,
                              },
                            }))
                          }
                          placeholder="作業内容（任意）"
                          className="bg-white text-sm h-9"
                          maxLength={255}
                        />

                        <Button
                          size="sm"
                          className="w-full h-9"
                          onClick={() => handleDetailSave(member.staffId, currentStatus)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                          場所・作業内容を保存
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
