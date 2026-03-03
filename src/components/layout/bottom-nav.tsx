"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Dumbbell, User, Plus, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveWorkout } from "@/contexts/active-workout-context";
import { formatDuration } from "@/lib/calculations";
import { usePendingRequests } from "@/hooks/use-pending-requests";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/history", icon: Clock, label: "Verlauf" },
  { href: "/exercises", icon: Dumbbell, label: "Übungen" },
  { href: "/workout", icon: Plus, label: "Workout", isCenter: true },
  { href: "/community", icon: Globe, label: "Community" },
  { href: "/friends", icon: Users, label: "Freunde" },
  { href: "/settings", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { activeWorkout, elapsedSeconds } = useActiveWorkout();
  const pendingRequests = usePendingRequests();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-end justify-around px-1 pt-1 pb-1">
        {tabs.map(tab => {
          const isActive = tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center -mt-4"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
                    activeWorkout
                      ? "bg-green-500 text-white animate-pulse"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                {activeWorkout ? (
                  <span className="mt-0.5 text-[10px] font-medium text-green-600">
                    {formatDuration(elapsedSeconds)}
                  </span>
                ) : (
                  <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    {tab.label}
                  </span>
                )}
              </Link>
            );
          }

          const showBadge = tab.href === "/friends" && pendingRequests > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1.5 py-2 transition-colors min-w-[40px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
                    {pendingRequests > 9 ? "9+" : pendingRequests}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
