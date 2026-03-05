"use client";

import { cn } from "@/lib/utils";
import { getRoleById, type RoleId } from "@/lib/exercises/types";

interface RoleBadgeProps {
    role: RoleId;
    size?: "sm" | "md" | "lg";
    showFocus?: boolean;
}

export function RoleBadge({ role, size = "md", showFocus = false }: RoleBadgeProps) {
    const r = getRoleById(role);
    return (
        <div className={cn("flex items-center gap-1.5", size === "lg" && "gap-2")}>
            <span
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium",
                    size === "sm" && "h-5 px-1.5 text-[10px]",
                    size === "md" && "h-6 px-2 text-xs",
                    size === "lg" && "h-7 px-2.5 text-sm"
                )}
                style={{ backgroundColor: `${r.color}15`, color: r.color, border: `1px solid ${r.color}30` }}
            >
                <span className="mr-1">{r.icon}</span>
                {r.name}
            </span>
            {showFocus && (
                <span className="text-[10px] text-muted-foreground italic">{r.focus}</span>
            )}
        </div>
    );
}
