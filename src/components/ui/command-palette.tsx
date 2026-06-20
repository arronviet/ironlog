"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useWorkoutStore } from "@/lib/store/workout";
import {
  LayoutDashboard,
  Plus,
  Calendar,
  BarChart2,
  ClipboardList,
  Search,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useWorkoutStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen, setCommandOpen]);

  const go = (path: string) => {
    router.push(path);
    setCommandOpen(false);
  };

  if (!commandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 animate-in"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Jump to..."
              className="w-full bg-transparent py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none"
            />
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="text-sm text-muted-foreground text-center py-6">
              No results found
            </Command.Empty>

            <Command.Group
              heading="Navigate"
              className="text-[11px] text-muted-foreground uppercase tracking-wide px-2 py-1.5"
            >
              <PaletteItem
                icon={<Plus className="w-4 h-4" />}
                label="Log workout"
                onSelect={() => go("/workout/new")}
              />
              <PaletteItem
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Dashboard"
                onSelect={() => go("/dashboard")}
              />
              <PaletteItem
                icon={<ClipboardList className="w-4 h-4" />}
                label="History"
                onSelect={() => go("/history")}
              />
              <PaletteItem
                icon={<Calendar className="w-4 h-4" />}
                label="Calendar"
                onSelect={() => go("/calendar")}
              />
              <PaletteItem
                icon={<BarChart2 className="w-4 h-4" />}
                label="Stats"
                onSelect={() => go("/stats")}
              />
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function PaletteItem({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-foreground cursor-pointer data-[selected=true]:bg-accent transition-colors"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </Command.Item>
  );
}
