'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rss, Video, RefreshCw, Loader2, ExternalLink, Clock } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    source: string;
    category: string;
    url: string;
    published: string;
    summary?: string;
}

interface VideoStream {
    id: string;
    name: string;
    url: string;
    category: string;
    region: string;
    active: boolean;
}

export function LiveFeedsTab() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [streams, setStreams] = useState<VideoStream[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [streamsLoading, setStreamsLoading] = useState(false);
    const [activeView, setActiveView] = useState<'news' | 'video'>('news');

    const fetchNews = async () => {
        setNewsLoading(true);
        try {
            const res = await fetch('/api/intelligence/news');
            if (res.ok) setNews((await res.json()).articles || []);
        } catch (e) { console.error(e); } finally { setNewsLoading(false); }
    };

    const fetchStreams = async () => {
        setStreamsLoading(true);
        try {
            const res = await fetch('/api/intelligence/video-streams');
            if (res.ok) setStreams((await res.json()).streams || []);
        } catch (e) { console.error(e); } finally { setStreamsLoading(false); }
    };

    useEffect(() => { fetchNews(); fetchStreams(); }, []);

    const categoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'geopolitics': 'bg-red-500/10 text-red-400 border-red-500/30',
            'cyber': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            'military': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
            'infrastructure': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
            'general': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        };
        return colors[cat.toLowerCase()] || colors.general;
    };

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                <button onClick={() => setActiveView('news')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'news' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-card/40 border border-transparent'}`}>
                    <Rss className="h-4 w-4" /> News Feeds
                    <Badge variant="outline" className="text-[10px] ml-1">{news.length}</Badge>
                </button>
                <button onClick={() => setActiveView('video')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'video' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:bg-card/40 border border-transparent'}`}>
                    <Video className="h-4 w-4" /> Live Streams
                    <Badge variant="outline" className="text-[10px] ml-1">{streams.length}</Badge>
                </button>
            </div>

            {activeView === 'news' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg"><Rss className="h-5 w-5 text-cyan-400" /></div>
                            <div><h3 className="text-sm font-semibold">Intelligence News Aggregator</h3><p className="text-[10px] text-muted-foreground">Curated RSS feeds from 20+ OSINT sources</p></div>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchNews} disabled={newsLoading}>{newsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                    </div>
                    <ScrollArea className="h-[600px] rounded-lg border border-border/30">
                        <div className="p-3 space-y-2">
                            {news.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Rss className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">Loading news feeds...</p><p className="text-xs">Aggregating from multiple OSINT sources</p></div>
                            ) : news.map((item) => (
                                <Card key={item.id} className="bg-card/20 hover:bg-card/30 transition-colors">
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className={`text-[9px] shrink-0 ${categoryColor(item.category)}`}>{item.category}</Badge>
                                                    <span className="text-[10px] text-muted-foreground truncate">{item.source}</span>
                                                </div>
                                                <h4 className="text-sm font-medium leading-tight mb-1">{item.title}</h4>
                                                {item.summary && <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>}
                                                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />{new Date(item.published).toLocaleString()}
                                                </div>
                                            </div>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {activeView === 'video' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg"><Video className="h-5 w-5 text-red-400" /></div>
                            <div><h3 className="text-sm font-semibold">Live Video Streams</h3><p className="text-[10px] text-muted-foreground">News, infrastructure, and monitoring feeds</p></div>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchStreams} disabled={streamsLoading}>{streamsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {streams.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground"><Video className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">No live streams configured</p></div>
                        ) : streams.map((s) => (
                            <Card key={s.id} className="bg-card/20 hover:bg-card/30 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold">{s.name}</span>
                                        {s.active && <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /><span className="text-[9px] text-red-400 font-bold">LIVE</span></div>}
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="text-[9px]">{s.category}</Badge>
                                        <span className="text-[10px] text-muted-foreground">{s.region}</span>
                                    </div>
                                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                                        <ExternalLink className="h-3 w-3" /> Open Stream
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
