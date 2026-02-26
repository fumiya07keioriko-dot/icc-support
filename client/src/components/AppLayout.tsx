import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  headerRight?: ReactNode;
  noPadding?: boolean;
}

export default function AppLayout({ children, title, headerRight, noPadding }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      {title && (
        <header className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
          <h1 className="text-base font-semibold">{title}</h1>
          {headerRight && <div>{headerRight}</div>}
        </header>
      )}

      {/* コンテンツ */}
      <main className={`flex-1 ${noPadding ? "" : "px-4 py-4"} pb-20`}>
        {children}
      </main>

      {/* ボトムナビ */}
      <BottomNav />
    </div>
  );
}
