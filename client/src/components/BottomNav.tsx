import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, CheckSquare, Map, Calendar } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "ホーム", icon: LayoutDashboard },
  { path: "/staff", label: "スタッフ", icon: Users },
  { path: "/tasks", label: "タスク", icon: CheckSquare },
  { path: "/map", label: "マップ", icon: Map },
  { path: "/tetris", label: "テトリス", icon: Calendar },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} className="flex-1">
              <div className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
