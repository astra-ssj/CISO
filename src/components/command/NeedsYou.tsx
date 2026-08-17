'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CARD_BG = 'rgba(8, 12, 24, 0.85)';
const CARD_BD = 'rgba(56, 189, 248, 0.06)';

interface QueueItem {
    id: string;
    title: string;
    detail: string;
    href: string;
    urgency: string;
    kind: string;
}

export function NeedsYou() {
    const [items, setItems] = useState<QueueItem[]>([]);
    const [openNekoUrl, setOpenNekoUrl] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/decision-queue')
            .then(async (res) => {
                if (!res.ok) return { items: [] as QueueItem[], openNekoUrl: null };
                return res.json() as Promise<{ items: QueueItem[]; openNekoUrl: string | null }>;
            })
            .then((data) => {
                setItems((data.items ?? []).filter((i) => i.kind !== 'skill_run').slice(0, 6));
                setOpenNekoUrl(data.openNekoUrl);
            })
            .catch(() => setItems([]))
            .finally(() => setLoaded(true));
    }, []);

    return (
        <div className="rounded-xl border flex flex-col h-full" style={{ background: CARD_BG, borderColor: CARD_BD }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: CARD_BD }}>
                <span className="text-xs font-semibold uppercase tracking-wider text-white">Needs you</span>
                <Link href="/decisions" className="text-[10px] text-cyan-400">Decision Center</Link>
            </div>
            <div className="flex-1 px-3 py-2 overflow-y-auto" style={{ maxHeight: '280px' }}>
                {loaded && items.length === 0 && (
                    <p className="text-[11px] text-slate-500 py-6 text-center">Nothing needs a human. Queue is empty, not demo.</p>
                )}
                {items.map((item) => (
                    <Link key={item.id} href={item.href}>
                        <div className="px-2 py-2 rounded-lg hover:bg-white/[0.02]">
                            <p className="text-[11px] text-slate-200 truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{item.detail}</p>
                        </div>
                    </Link>
                ))}
                {openNekoUrl && (
                    <a href={openNekoUrl} className="block text-[10px] text-cyan-400 px-2 py-2">Open OpenNeko briefing</a>
                )}
            </div>
        </div>
    );
}
