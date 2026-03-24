import { useState, useRef, useEffect } from "react";
import { usePinAuth } from "@/contexts/PinAuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = usePinAuth();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [trusted, setTrusted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    // 4桁揃ったら自動送信
    if (value && index === 3) {
      const fullPin = [...newPin.slice(0, 3), value.slice(-1)].join("");
      if (fullPin.length === 4) {
        handleSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (pinValue?: string) => {
    const fullPin = pinValue ?? pin.join("");
    if (fullPin.length !== 4) {
      setError("4桁のPINを入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(fullPin, trusted);
    } catch (e: any) {
      setError("PINが正しくありません");
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700 px-4">
      {/* ロゴ・タイトル */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">ICC Support</h1>
        <p className="text-blue-200 text-sm mt-1">スタッフ管理画面</p>
      </div>

      {/* PINカード */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-lg font-semibold text-gray-800 text-center mb-6">
          PINコードを入力
        </h2>

        {/* PIN入力ボックス */}
        <div className="flex gap-3 justify-center mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl
                focus:border-blue-600 focus:outline-none transition-colors
                bg-gray-50 text-gray-900
                border-gray-200"
              style={{ caretColor: "transparent" }}
            />
          ))}
        </div>

        {/* エラー */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* この端末を信頼する */}
        <div className="flex items-center gap-2 mb-6">
          <Checkbox
            id="trusted"
            checked={trusted}
            onCheckedChange={(v) => setTrusted(v === true)}
          />
          <Label htmlFor="trusted" className="text-sm text-gray-600 cursor-pointer">
            この端末を信頼する（30日間ログイン維持）
          </Label>
        </div>

        {/* ログインボタン */}
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => handleSubmit()}
          disabled={loading || pin.join("").length !== 4}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />確認中...</>
          ) : (
            "ログイン"
          )}
        </Button>

        {/* テンキー（スマホ補助） */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((key, i) => {
            if (key === "") return <div key={i} />;
            return (
              <button
                key={i}
                className="h-12 rounded-xl text-lg font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-800"
                onClick={() => {
                  if (key === "⌫") {
                    const lastFilled = pin.map((d, idx) => d ? idx : -1).filter(x => x >= 0).pop();
                    if (lastFilled !== undefined) {
                      const newPin = [...pin];
                      newPin[lastFilled] = "";
                      setPin(newPin);
                      inputRefs.current[lastFilled]?.focus();
                    }
                  } else {
                    const emptyIdx = pin.findIndex(d => !d);
                    if (emptyIdx >= 0) handleInput(emptyIdx, String(key));
                  }
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-blue-200 text-xs">
        ICC Summit FUKUOKA 2026 スタッフ専用
      </p>
    </div>
  );
}
