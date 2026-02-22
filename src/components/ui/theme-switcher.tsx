"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette } from "lucide-react";
import { useThemeStore, THEMES, AppTheme, BackgroundStyle } from "@/lib/theme-store";
import { useEffect } from "react";

export function ThemeSwitcher() {
    const { theme, background, setTheme, setBackground } = useThemeStore();

    // Apply theme class to document body
    useEffect(() => {
        // Remove all old theme classes
        document.documentElement.classList.remove('theme-cosmic', 'theme-professional', 'theme-navy', 'theme-midnight');
        // Add new theme class
        document.documentElement.classList.add(`theme-${theme}`);

        // Handle background style via data attribute on body
        document.body.setAttribute('data-bg', background);
    }, [theme, background]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Change Theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(v: string) => setTheme(v as AppTheme)}>
                    {Object.entries(THEMES).map(([key, value]) => (
                        <DropdownMenuRadioItem key={key} value={key} className="cursor-pointer">
                            <div className={`w-3 h-3 rounded-full mr-2 ${value.color}`} />
                            {value.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Background Style</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={background} onValueChange={(v: string) => setBackground(v as BackgroundStyle)}>
                    <DropdownMenuRadioItem value="mesh">Cosmic Mesh</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="gradient">Linear Gradient</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="grid">Cyber Grid</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="solid">Clean Solid</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
