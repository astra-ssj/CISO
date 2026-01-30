import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'cosmic' | 'professional' | 'navy' | 'midnight';
export type BackgroundStyle = 'mesh' | 'gradient' | 'solid' | 'grid';

interface ThemeState {
    theme: AppTheme;
    background: BackgroundStyle;
    setTheme: (theme: AppTheme) => void;
    setBackground: (bg: BackgroundStyle) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'cosmic', // Default Astra look
            background: 'mesh',
            setTheme: (theme) => set({ theme }),
            setBackground: (background) => set({ background }),
        }),
        {
            name: 'astra-theme-store',
        }
    )
);

export const THEMES: Record<AppTheme, { label: string; description: string; color: string }> = {
    cosmic: { label: 'Astra Cosmic', description: 'Deep purple and indigo gradient (Default)', color: 'bg-indigo-600' },
    professional: { label: 'Slate Enterprise', description: 'Clean, neutral slate and gray tones', color: 'bg-slate-600' },
    navy: { label: 'Command Navy', description: 'Deep blue and teal accents', color: 'bg-blue-800' },
    midnight: { label: 'Midnight Ops', description: 'High contrast black and neon', color: 'bg-black' },
};
