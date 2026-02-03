import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Timeframe = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'YTD' | '1Y';
export type BusinessUnit = 'Global' | 'Engineering' | 'Sales' | 'Finance' | 'Legal';
export type Region = 'All' | 'NA' | 'EMEA' | 'APAC';
export type ViewMode = 'Strategic' | 'Operational' | 'Tactical';

interface ViewContext {
    timeframe: Timeframe;
    unit: BusinessUnit;
    region: Region;
    mode: ViewMode;
}

interface ViewEngineState {
    context: ViewContext;

    // Actions
    setDimension: (dimension: keyof ViewContext, value: any) => void;
    resetContext: () => void;
}

export const useViewEngine = create<ViewEngineState>()(
    persist(
        (set) => ({
            context: {
                timeframe: 'Q1',
                unit: 'Global',
                region: 'All',
                mode: 'Strategic'
            },

            setDimension: (dim, value) => set((state) => ({
                context: { ...state.context, [dim]: value }
            })),

            resetContext: () => set({
                context: {
                    timeframe: 'Q1',
                    unit: 'Global',
                    region: 'All',
                    mode: 'Strategic'
                }
            })
        }),
        {
            name: 'astra-view-engine',
        }
    )
);
