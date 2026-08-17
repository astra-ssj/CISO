"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
    HELP_SECTIONS,
    ALL_ARTICLES,
    type SearchableArticle,
} from "@/lib/help/help-content";

// ─── Dark theme tokens (as requested by USER) ─────────────
const bgMain = '#050508';
const bgSidebar = '#080c18';
const bgSurface = 'rgba(8,12,24,0.85)';
const bgHover = 'rgba(56,189,248,0.1)';
const bgActive = 'rgba(56,189,248,0.15)';

const borderDefault = 'rgba(56,189,248,0.12)';
const borderHover = 'rgba(56,189,248,0.25)';

const textPrimary = '#f8fafc';
const textSecondary = '#94a3b8';
const textMuted = '#64748b';

const accentBlue = '#38bdf8';

// ─── Section Colors ────────────────────────────────────────
const SECTION_COLORS = [
    '#38bdf8', // Blue/Cyan
    '#818cf8', // Indigo
    '#c084fc', // Purple
    '#fb7185', // Rose
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#f472b6', // Pink
    '#60a5fa', // Blue
];

function getSectionColor(sectionId: string): string {
    const index = HELP_SECTIONS.findIndex(s => s.id === sectionId);
    if (index === -1) return accentBlue;
    return SECTION_COLORS[index % SECTION_COLORS.length];
}

// ─── Types ─────────────────────────────────────────────────
interface ExpandedMap { [articleId: string]: boolean }

// ─── Keyboard shortcut data ────────────────────────────────
const SHORTCUTS = [
    { keys: 'Ctrl+K', label: 'Global search' },
    { keys: 'Ctrl+N', label: 'New incident' },
    { keys: 'Ctrl+Shift+E', label: 'Export current view' },
    { keys: '?', label: 'Open help' },
] as const;

// ─── Helpers ───────────────────────────────────────────────
function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function matchesSearch(article: SearchableArticle, q: string): boolean {
    return (
        article.title.toLowerCase().includes(q) ||
        article.content.toLowerCase().includes(q) ||
        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(q)))
    );
}

// ─── Content renderer ──────────────────────────────────────
function ArticleContent({
    article,
    color,
    onNavigateToRelated,
}: {
    article: SearchableArticle;
    color: string;
    onNavigateToRelated: (id: string, sectionId: string) => void;
}) {
    const lines = article.content.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let isCodeBlock = false;
    let codeBuffer: string[] = [];

    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ color: textPrimary, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} style={{ background: bgActive, color: accentBlue, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const flushTable = (key: number) => {
        if (tableBuffer.length === 0) return null;
        const rows = tableBuffer
            .filter(l => l.includes('|'))
            .map(l => l.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()));

        // Skip separator row
        const dataRows = rows.filter(r => !r.every(c => c.match(/^-+$/)));
        if (dataRows.length === 0) return null;

        const header = dataRows[0];
        const body = dataRows.slice(1);
        tableBuffer = [];

        return (
            <div key={`table-${key}`} style={{ overflowX: 'auto', marginBottom: 20, marginTop: 12, borderRadius: 8, border: `1px solid ${borderDefault}`, background: 'rgba(56,189,248,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${borderDefault}`, background: 'rgba(56,189,248,0.05)' }}>
                            {header.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '12px', color: textPrimary, fontWeight: 600 }}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {body.map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${borderDefault}40` }}>
                                {row.map((c, j) => <td key={j} style={{ padding: '12px', color: textSecondary }}>{parseInline(c)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    lines.forEach((line, i) => {
        const trimmed = line.trim();

        // Code blocks
        if (trimmed.startsWith('```')) {
            if (isCodeBlock) {
                const code = codeBuffer.join('\n');
                elements.push(
                    <pre key={`code-${i}`} style={{ background: '#0d1117', padding: 16, borderRadius: 8, overflowX: 'auto', marginBottom: 16, border: `1px solid ${borderDefault}` }}>
                        <code style={{ color: '#e6edf3', fontSize: 12, fontFamily: 'monospace' }}>{code}</code>
                    </pre>
                );
                codeBuffer = [];
                isCodeBlock = false;
            } else {
                isCodeBlock = true;
            }
            return;
        }
        if (isCodeBlock) {
            codeBuffer.push(line);
            return;
        }

        // Tables
        if (trimmed.startsWith('|')) {
            tableBuffer.push(line);
            return;
        } else if (tableBuffer.length > 0) {
            elements.push(flushTable(i));
        }

        // Headings
        if (trimmed.startsWith('# ')) {
            elements.push(<h1 key={i} style={{ color: textPrimary, fontSize: 24, fontWeight: 800, marginBottom: 16, marginTop: 24 }}>{trimmed.slice(2)}</h1>);
        } else if (trimmed.startsWith('## ')) {
            elements.push(<h2 key={i} style={{ color: textPrimary, fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32, borderBottom: `1px solid ${borderDefault}`, paddingBottom: 8 }}>{trimmed.slice(3)}</h2>);
        } else if (trimmed.startsWith('### ')) {
            elements.push(<h3 key={i} style={{ color: textPrimary, fontSize: 17, fontWeight: 600, marginBottom: 10, marginTop: 24 }}>{trimmed.slice(4)}</h3>);
        }
        // Lists
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 8 }} />
                    <span style={{ color: textSecondary, fontSize: 14, lineHeight: 1.6 }}>{parseInline(trimmed.slice(2))}</span>
                </div>
            );
        } else if (trimmed === '') {
            elements.push(<div key={i} style={{ height: 16 }} />);
        } else {
            elements.push(<p key={i} style={{ color: textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{parseInline(trimmed)}</p>);
        }
    });

    // Final flush
    if (tableBuffer.length > 0) elements.push(flushTable(9999));

    return (
        <div
            style={{
                background: bgSidebar,
                borderRadius: 12,
                padding: '24px 32px',
                border: `1px solid ${borderDefault}`,
                animation: 'helpFadeIn 300ms ease-out',
            }}
        >
            {elements}

            {/* Related Articles UI */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${borderDefault}` }}>
                    <h4 style={{ color: textPrimary, fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Related Articles
                    </h4>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {article.relatedArticles.map((relId) => {
                            const relArticle = ALL_ARTICLES.find(a => a.id === relId);
                            if (!relArticle) return null;
                            const relColor = getSectionColor(relArticle.sectionId);
                            return (
                                <button
                                    key={relId}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigateToRelated(relArticle.id, relArticle.sectionId); }}
                                    style={{
                                        padding: '6px 12px',
                                        background: bgMain,
                                        border: `1px solid ${borderDefault}`,
                                        borderRadius: 6,
                                        fontSize: 12,
                                        color: textSecondary,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        el.style.borderColor = relColor + '60';
                                        el.style.color = textPrimary;
                                        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget;
                                        el.style.borderColor = borderDefault;
                                        el.style.color = textSecondary;
                                        el.style.boxShadow = 'none';
                                    }}
                                >
                                    {relArticle.sectionIcon} {relArticle.title}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Article Card ──────────────────────────────────────────
function ArticleCard({
    article,
    index,
    color,
    isExpanded,
    onToggle,
    onNavigateToRelated,
}: {
    article: SearchableArticle;
    index: number;
    color: string;
    isExpanded: boolean;
    onToggle: () => void;
    onNavigateToRelated: (id: string, sectionId: string) => void;
}) {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div
            style={{
                background: bgMain,
                border: `1px solid ${isExpanded ? color + '60' : borderDefault}`,
                borderRadius: 10,
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                overflow: 'hidden',
                boxShadow: isExpanded
                    ? `0 2px 8px ${color}15`
                    : '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
                if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.borderColor = borderHover;
            }}
            onMouseLeave={(e) => {
                if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.borderColor = borderDefault;
            }}
        >
            {/* Header */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                {/* Numbered badge */}
                <span
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color,
                        background: `${color}12`,
                        borderRadius: 6,
                        padding: '4px 8px',
                        minWidth: 32,
                        textAlign: 'center',
                        flexShrink: 0,
                    }}
                >
                    {pad(index + 1)}
                </span>

                {/* Title + Tags */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: textPrimary, fontWeight: 600, fontSize: 14 }}>
                        {article.title}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: 6,
                                marginTop: 6,
                                flexWrap: 'wrap',
                            }}
                        >
                            {article.tags.slice(0, 3).map(tag => (
                                <span
                                    key={tag}
                                    style={{
                                        color: textMuted,
                                        fontSize: 10,
                                        background: bgSurface,
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        border: `1px solid ${borderDefault}`,
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Expand arrow */}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                    }}
                >
                    <path
                        d="M6 4l4 4-4 4"
                        stroke={textMuted}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* Expandable content */}
            <div
                ref={contentRef}
                style={{
                    maxHeight: isExpanded ? 5000 : 0,
                    opacity: isExpanded ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.2s ease',
                    padding: isExpanded ? '0 18px 18px' : '0 18px 0',
                }}
            >
                {isExpanded && (
                    <ArticleContent article={article} color={color} onNavigateToRelated={onNavigateToRelated} />
                )}
            </div>
        </div>
    );
}

// ─── Search result item ────────────────────────────────────
function SearchResult({
    article,
    onClick,
}: {
    article: SearchableArticle;
    onClick: () => void;
}) {
    const sectionColor = getSectionColor(article.sectionId);

    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: bgMain,
                border: `1px solid ${borderDefault}`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = sectionColor + '60';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = borderDefault;
                el.style.boxShadow = 'none';
            }}
        >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{article.sectionIcon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: textMuted, fontSize: 11, marginBottom: 2 }}>
                    {article.sectionTitle}
                </div>
                <div style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>
                    {article.title}
                </div>
                {article.tags && article.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {article.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={{ color: textMuted, fontSize: 10 }}>#{tag}</span>
                        ))}
                    </div>
                )}
            </div>
            <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
            >
                <path
                    d="M6 4l4 4-4 4"
                    stroke={textMuted}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function HelpPage() {
    const [activeSection, setActiveSection] = useState(HELP_SECTIONS[0].id);
    const [expanded, setExpanded] = useState<ExpandedMap>({});
    const [search, setSearch] = useState('');
    const mainRef = useRef<HTMLDivElement>(null);

    // Scroll to top of main panel when section changes
    useEffect(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection]);

    const toggleArticle = useCallback((id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const isSearching = search.trim().length >= 3;

    // Search results
    const searchResults = useMemo(() => {
        if (!isSearching) return [];
        const q = search.toLowerCase();
        return ALL_ARTICLES.filter((a) => matchesSearch(a, q));
    }, [search, isSearching]);

    // Navigate to section + expand article from search result
    const goToArticle = useCallback((article: SearchableArticle) => {
        setActiveSection(article.sectionId);
        setExpanded((prev) => ({ ...prev, [article.id]: true }));
        setSearch('');
        setTimeout(() => {
            document
                .getElementById(`article-${article.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);

    // Navigate to related article directly
    const navigateToRelated = useCallback((articleId: string, sectionId: string) => {
        setActiveSection(sectionId);
        setExpanded((prev) => ({ ...prev, [articleId]: true }));
        setSearch('');
        setTimeout(() => {
            document
                .getElementById(`article-${articleId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);

    const currentSection = HELP_SECTIONS.find((s) => s.id === activeSection)!;
    const currentSectionColor = getSectionColor(currentSection.id);

    return (
        <>
            {/* Inject keyframe for fade-in + custom scrollbar */}
            <style>{`
                @keyframes helpFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .help-scrollbar::-webkit-scrollbar { width: 5px; }
                .help-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .help-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(56,189,248,0.15);
                    border-radius: 10px;
                }
                .help-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(56,189,248,0.3);
                }
            `}</style>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    background: bgMain,
                    color: textPrimary,
                }}
            >
                {/* ─── TOP HEADER (Search) ────────────────────────── */}
                <header
                    style={{
                        padding: '16px 36px',
                        borderBottom: `1px solid ${borderDefault}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: bgMain,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: 600 }}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={textMuted}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    position: 'absolute',
                                    left: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                }}
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="🔍 Search help articles by title, content, or #tags..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px 10px 42px',
                                    background: bgSurface,
                                    border: `1px solid ${borderDefault}`,
                                    borderRadius: 10,
                                    color: textPrimary,
                                    fontSize: 14,
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                }}
                                onFocus={(e) => {
                                    const el = e.target as HTMLInputElement;
                                    el.style.borderColor = accentBlue;
                                    el.style.boxShadow = `0 0 0 3px ${accentBlue}15`;
                                }}
                                onBlur={(e) => {
                                    const el = e.target as HTMLInputElement;
                                    el.style.borderColor = borderDefault;
                                    el.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: textMuted, fontWeight: 500 }}>Help · 3.0.0-decision.2 · empty is honest</span>
                    </div>
                </header>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* ─── SIDEBAR ───────────────────────────────────── */}
                    <aside
                        style={{
                            width: 260,
                            minWidth: 260,
                            background: bgSidebar,
                            borderRight: `1px solid ${borderDefault}`,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            className="help-scrollbar"
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px 12px',
                            }}
                        >
                            <label style={{ fontSize: 10, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 12px 12px' }}>
                                Knowledge Domains
                            </label>
                            {HELP_SECTIONS.map((section) => {
                                const isActive = activeSection === section.id && !isSearching;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            setActiveSection(section.id);
                                            setSearch('');
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '10px 14px',
                                            marginBottom: 4,
                                            background: isActive ? bgHover : 'transparent',
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: 18, filter: isActive ? 'none' : 'grayscale(1)' }}>{section.icon}</span>
                                        <span style={{ flex: 1, fontSize: 13, color: isActive ? textPrimary : textSecondary, fontWeight: isActive ? 600 : 500 }}>
                                            {section.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Shortcuts footer */}
                        <div style={{ padding: '20px 16px', borderTop: `1px solid ${borderDefault}`, background: 'rgba(56,189,248,0.02)' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: textMuted, marginBottom: 12 }}>QUICK COMMANDS</div>
                            <div className="space-y-2">
                                {SHORTCUTS.map(s => (
                                    <div key={s.keys} className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500">{s.label}</span>
                                        <kbd className="px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-400 font-mono">{s.keys}</kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ─── MAIN AREA ─────────────────────────────────── */}
                    <main
                        ref={mainRef}
                        className="help-scrollbar"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '36px 48px',
                            background: bgMain,
                        }}
                    >
                        {/* BREADCRUMBS */}
                        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12, color: textMuted }}>
                            <span>Help Center</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            <span style={{ color: isSearching ? textPrimary : textMuted }}>{isSearching ? 'Search Results' : currentSection.title}</span>
                            {!isSearching && Object.values(expanded).some(v => v) && (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                    <span style={{ color: textPrimary }}>Article View</span>
                                </>
                            )}
                        </nav>

                        {isSearching ? (
                            <div>
                                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Results for &quot;{search}&quot;</h1>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {searchResults.map(article => (
                                        <SearchResult
                                            key={article.id}
                                            article={article}
                                            onClick={() => goToArticle(article)}
                                        />
                                    ))}
                                    {searchResults.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                                            <div style={{ fontSize: 48, marginBottom: 20 }}>🛸</div>
                                            <p>No knowledge entries found for this query.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: 40 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                                        <span style={{ fontSize: 42 }}>{currentSection.icon}</span>
                                        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{currentSection.title}</h1>
                                    </div>
                                    <p style={{ color: textSecondary, fontSize: 16 }}>{currentSection.description}</p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {currentSection.articles.map((article, i) => (
                                        <div key={article.id} id={`article-${article.id}`}>
                                            <ArticleCard
                                                article={{ ...article, sectionId: currentSection.id, sectionTitle: currentSection.title, sectionIcon: currentSection.icon }}
                                                index={i}
                                                color={currentSectionColor}
                                                isExpanded={!!expanded[article.id]}
                                                onToggle={() => toggleArticle(article.id)}
                                                onNavigateToRelated={navigateToRelated}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
