import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { VENUE_MAPS } from "../../../shared/maps";
import { X, Maximize2 } from "lucide-react";

export default function VenueMap() {
  const [activeId, setActiveId] = useState<string>(VENUE_MAPS[0].id);
  const [fullscreen, setFullscreen] = useState(false);

  const activeMap = VENUE_MAPS.find((m) => m.id === activeId) ?? VENUE_MAPS[0];

  return (
    <AppLayout title="会場マップ" noPadding>
      {/* タブ */}
      <div className="overflow-x-auto px-4 pt-4 pb-2">
        <div className="flex gap-2 w-max">
          {VENUE_MAPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${activeId === m.id
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* マップ表示エリア */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">{activeMap.label}</p>
              <p className="text-xs text-gray-400">{activeMap.description}</p>
            </div>
            <button
              onClick={() => setFullscreen(true)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 画像 */}
          <div className="relative bg-gray-50">
            <img
              src={activeMap.url}
              alt={activeMap.label}
              className="w-full h-auto object-contain"
              style={{ maxHeight: "60vh" }}
            />
          </div>
        </div>

        {/* サムネイル一覧 */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">全フロア一覧</p>
          <div className="grid grid-cols-3 gap-2">
            {VENUE_MAPS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveId(m.id)}
                className={`rounded-lg overflow-hidden border-2 transition-all
                  ${activeId === m.id ? "border-blue-600" : "border-transparent"}`}
              >
                <img src={m.url} alt={m.label} className="w-full h-16 object-cover" />
                <div className={`text-xs py-1 text-center font-medium
                  ${activeId === m.id ? "text-blue-700 bg-blue-50" : "text-gray-500 bg-white"}`}>
                  {m.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* フルスクリーンモーダル */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/80">
            <p className="text-white text-sm font-medium">{activeMap.label}</p>
            <button
              onClick={() => setFullscreen(false)}
              className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            <img
              src={activeMap.url}
              alt={activeMap.label}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          {/* フロア切替 */}
          <div className="overflow-x-auto px-4 py-3 bg-black/80">
            <div className="flex gap-2 w-max">
              {VENUE_MAPS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                    ${activeId === m.id ? "bg-white text-gray-900" : "bg-white/20 text-white"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
