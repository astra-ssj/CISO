'use client';

/**
 * Honest status strip. No invented IOCs, leaderboard, or node counts.
 */
export function GlobalThreatPulse() {
    return (
        <div className="w-full bg-zinc-950/80 border-b border-zinc-800 h-8 flex items-center px-4 gap-3 backdrop-blur-md">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">Astra</span>
            <span className="text-[10px] text-zinc-500 font-mono">supervised · skills compute · empty is honest</span>
        </div>
    );
}
