import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, MessageSquare, Clock, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "active",    label: "稼働中",   emoji: "🟢", border: "border-l-green-500",  bg: "bg-green-50",   badge: "bg-green-100 text-green-800" },
  { value: "moving",    label: "移動中",   emoji: "🟠", border: "border-l-orange-400", bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800" },
  { value: "break",     label: "休憩",     emoji: "🟣", border: "border-l-purple-400", bg: "bg-purple-50",  badge: "bg-purple-100 text-purple-800" },
  { value: "available", label: "ヘルプ可", emoji: "🔵", border: "border-l-blue-500",   bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-800" },
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

  // 展開中のカードID
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 詳細編集フォームの状態（カードごと）
  const [detailForm, setDetailForm] = useState<Record<string, {
    venueId: number | null;
    areaId: number | null;
    workContent: string;
  }>>({});
  // ステータス即時更新中のID
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  // 詳細保存中のID
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
      utils.staff.list.invalidate();
      toast.success(`${currentData.name}を「${STATUS_OPTIONS.find(o => o.value === newStatus)?.label}」に変更しました`);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // カード展開時にフォームを初期化
  const toggleExpand = (s: typeof staffList[0]) => {
    if (expandedId === s.staffId) {
      setExpandedId(null);
    } else {
      setExpandedId(s.staffId);
      setDetailForm(prev => ({
        ...prev,
        [s.staffId]: {
          venueId: s.venueId ?? null,
          areaId: s.areaId ?? null,
          workContent: s.workContent ?? "",
        },
      }));
    }
  };

  // 詳細情報を保存
  const handleSaveDetail = async (staffId: string, currentStatus: string) => {
    const form = detailForm[staffId];
    if (!form) return;
    setSavingDetailId(staffId);
    try {
      await utils.client.staff.updateStatus.mutate({
        staffId,
        status: currentStatus as StatusValue,
        venueId: form.venueId,
        areaId: form.areaId,
        workContent: form.workContent,
      });
      utils.staff.list.invalidate();
      toast.success("詳細情報を更新しました");
      setExpandedId(null);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setSavingDetailId(null);
    }
  };

  if (staffQuery.isLoading) {
    return (
      <AppLayout title="スタッフ状況">
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="スタッフ状況">
      <div className="space-y-3 pb-4">
        {staffList.map((s) => {
          const statusOpt = STATUS_OPTIONS.find((o) => o.value === s.status) ?? STATUS_OPTIONS[0];
          const isExpanded = expandedId === s.staffId;
          const isUpdatingStatus = updatingStatusId === s.staffId;
          const form = detailForm[s.staffId];
          const selectedVenue = venueList.find((v) => v.id === form?.venueId);
          const areaOptions = selectedVenue?.areas ?? [];

          return (
            <div
              key={s.staffId}
              className={`rounded-xl border-l-4 bg-white shadow-sm overflow-hidden transition-all duration-200 ${statusOpt.border}`}
            >
              {/* ── メイン行（常時表示） ── */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none active:bg-gray-50"
                onClick={() => toggleExpand(s)}
              >
                {/* アバター */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusOpt.bg}`}>
                  <span className="text-base font-bold text-gray-700">{s.name.slice(0, 1)}</span>
                </div>

                {/* 名前・バッジ・場所 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                    {s.role === "admin" && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">統括</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusOpt.badge}`}>
                      {statusOpt.emoji} {statusOpt.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.venueName ? (
                      <span className="text-xs text-gray-500 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {s.venueName}{s.areaName ? ` › ${s.areaName}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />場所未設定
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{formatRelativeTime(s.updatedAt)}
                    </span>
                  </div>
                  {s.workContent && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3 flex-shrink-0" />{s.workContent}
                    </p>
                  )}
                </div>

                {/* 展開アイコン */}
                <div className="flex-shrink-0 text-gray-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* ── 展開エリア ── */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="expand"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className={`px-4 pb-4 pt-1 border-t border-gray-100 ${statusOpt.bg}`}>

                      {/* ステータス即時変更ボタン */}
                      <p className="text-xs font-semibold text-gray-500 mb-2 mt-2">ステータスを変更</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            disabled={isUpdatingStatus}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (s.status !== opt.value) {
                                handleStatusTap(s.staffId, opt.value, s);
                              }
                            }}
                            className={`
                              py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5
                              ${s.status === opt.value
                                ? "border-gray-800 bg-white text-gray-900 shadow-sm scale-[1.02]"
                                : "border-gray-200 bg-white/70 text-gray-600 active:scale-95"
                              }
                              ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            {isUpdatingStatus && s.status !== opt.value ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span>{opt.emoji}</span>
                            )}
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* 詳細編集（会場・エリア・作業内容） */}
                      <p className="text-xs font-semibold text-gray-500 mb-2">場所・作業内容を編集</p>
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        {/* 会場 */}
                        <Select
                          value={form?.venueId ? String(form.venueId) : "none"}
                          onValueChange={(v) =>
                            setDetailForm(prev => ({
                              ...prev,
                              [s.staffId]: { ...prev[s.staffId], venueId: v === "none" ? null : Number(v), areaId: null },
                            }))
                          }
                        >
                          <SelectTrigger className="bg-white text-sm h-9">
                            <SelectValue placeholder="会場を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">未設定</SelectItem>
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
                              setDetailForm(prev => ({
                                ...prev,
                                [s.staffId]: { ...prev[s.staffId], areaId: v === "none" ? null : Number(v) },
                              }))
                            }
                          >
                            <SelectTrigger className="bg-white text-sm h-9">
                              <SelectValue placeholder="エリアを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">未設定</SelectItem>
                              {areaOptions.map((a) => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* 作業内容 */}
                        <Input
                          className="bg-white text-sm h-9"
                          value={form?.workContent ?? ""}
                          onChange={(e) =>
                            setDetailForm(prev => ({
                              ...prev,
                              [s.staffId]: { ...prev[s.staffId], workContent: e.target.value },
                            }))
                          }
                          placeholder="例：受付対応、パネル設置など"
                          maxLength={100}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <Button
                          size="sm"
                          className="w-full h-9"
                          disabled={savingDetailId === s.staffId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveDetail(s.staffId, s.status);
                          }}
                        >
                          {savingDetailId === s.staffId ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />保存中...</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3 mr-1.5" />場所・作業内容を保存</>
                          )}
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
