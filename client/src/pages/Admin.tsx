import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Key, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [revokeAll, setRevokeAll] = useState(true);
  const [showPins, setShowPins] = useState(false);

  const changePinMutation = trpc.admin.changePin.useMutation({
    onSuccess: () => {
      toast.success("PINを変更しました。再ログインが必要です。");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    },
    onError: (e) => toast.error(e.message ?? "PIN変更に失敗しました"),
  });

  const handleChangePin = () => {
    if (!currentPin || !newPin || !confirmPin) {
      toast.error("全ての項目を入力してください");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("新しいPINが一致しません");
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      toast.error("PINは4〜6桁で入力してください");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      toast.error("PINは数字のみで入力してください");
      return;
    }
    if (confirm(`PINを変更します。${revokeAll ? "全ての既存セッションが失効します。" : ""}よろしいですか？`)) {
      changePinMutation.mutate({ adminPin: currentPin, newPin, revokeAll });
    }
  };

  return (
    <AppLayout title="管理者設定">
      <div className="space-y-4">
        {/* 管理者情報 */}
        <Card className="shadow-none border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">管理者専用ページ</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                このページはゆうゆ（統括）のみが操作してください。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PIN変更 */}
        <Card className="shadow-none border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4" />PINコード変更
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">現在のPIN</label>
              <Input
                type={showPins ? "text" : "password"}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="現在のPINを入力"
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">新しいPIN（4〜6桁）</label>
              <Input
                type={showPins ? "text" : "password"}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="新しいPINを入力"
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">新しいPIN（確認）</label>
              <Input
                type={showPins ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="新しいPINを再入力"
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="showPins"
                checked={showPins}
                onCheckedChange={(v) => setShowPins(v === true)}
              />
              <Label htmlFor="showPins" className="text-sm text-gray-600 cursor-pointer">
                PINを表示する
              </Label>
            </div>

            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="revokeAll"
                  checked={revokeAll}
                  onCheckedChange={(v) => setRevokeAll(v === true)}
                />
                <Label htmlFor="revokeAll" className="text-sm text-orange-700 cursor-pointer">
                  PIN変更時に全端末のセッションを失効させる（推奨）
                </Label>
              </div>
            </div>

            <Button
              className="w-full h-11"
              onClick={handleChangePin}
              disabled={changePinMutation.isPending}
            >
              {changePinMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />変更中...</>
              ) : (
                "PINを変更する"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 運用メモ */}
        <Card className="shadow-none border border-gray-100">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">運用メモ</p>
            <ul className="text-xs text-gray-500 space-y-1.5">
              <li>・初期PINは <strong className="text-gray-700">1234</strong> です</li>
              <li>・「この端末を信頼する」を選択した端末は30日間ログイン不要</li>
              <li>・PIN変更時に「セッション失効」を選択すると全端末で再ログインが必要になります</li>
              <li>・会期終了後はPINを変更してアクセスを無効化してください</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
