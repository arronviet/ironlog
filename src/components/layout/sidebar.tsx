"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/lib/store/workout";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Plus,
  Calendar,
  BarChart2,
  ClipboardList,
  LogOut,
  Dumbbell,
  Search,
  Trophy,
} from "lucide-react";

interface SidebarProps {
  user: User;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workout/new", label: "New workout", icon: Plus },
  { href: "/history", label: "History", icon: ClipboardList },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/dashboard/prs", label: "PRs", icon: Trophy }, 
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const setCommandOpen = useWorkoutStore((s) => s.setCommandOpen);

  const displayName =
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "Athlete";

  return (
    <aside className="w-56 border-r border-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
            <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">IronLog</span>
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-2 pt-3">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full text-left border border-border"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">Search</span>
          <kbd className="text-[10px] border border-border rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {href === "/workout/new" && (
                <span className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Log
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-2 pb-4 border-t border-border pt-4">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-primary uppercase">
              {displayName[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
} 
