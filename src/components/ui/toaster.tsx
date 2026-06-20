"use client";

import { useWorkoutStore } from "@/lib/store/workout";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, removeToast } = useWorkoutStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in min-w-[280px] max-w-sm",
            toast.variant === "destructive"
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : toast.variant === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-card border-border text-foreground"
          )}
        >
          <div className="flex-1">
            <p className="font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
