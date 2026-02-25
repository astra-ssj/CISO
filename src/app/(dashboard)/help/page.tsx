"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
    HELP_SECTIONS,
    ALL_ARTICLES,
    type HelpSection,
    type SearchableArticle,
} from "@/lib/help/help-content";

// ─── Theme tokens ──────────────────────────────────────────
const bgDeep = '#0a0e17';
const bgSurface = '#111827';
const borderSubtle = 'rgba(255,255,255,0.07)';
const textMuted = '#64748b';
const textDim = '#94a3b8';
const textBright = '#e2e8f0';

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
        article.description.toLowerCase().includes(q) ||
        article.content.toLowerCase().includes(q)
    );
}

// ─── Content renderer ──────────────────────────────────────
function ArticleContent({
    content,
    color,
}: {
    content: string;
    color: string;
}) {
    const lines = content.split('\n');

    return (
        <div
            style={{
                background: bgSurface,
                borderRadius: 8,
                padding: '20px 24px',
                animation: 'helpFadeIn 200ms ease',
            }}
        >
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (trimmed === '') return <div key={i} style={{ height: 10 }} />;

                // Numbered step:  "1. text" or "2. text"
                const stepMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
                if (stepMatch) {
                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                gap: 10,
                                marginBottom: 6,
                                alignItems: 'baseline',
                            }}
                        >
                            <span
                                style={{
                                    color,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    minWidth: 18,
                                }}
                            >
                                {stepMatch[1]}.
                            </span>
                            <span style={{ color: textDim, fontSize: 13, lineHeight: 1.6 }}>
                                {stepMatch[2]}
                            </span>
                        </div>
                    );
                }

                // Bullet point: "• text" or "- text"
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    const text = trimmed.replace(/^[•\-]\s*/, '');
                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                gap: 10,
                                marginBottom: 4,
                                alignItems: 'baseline',
                            }}
                        >
                            <span
                                style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: '50%',
                                    background: color,
                                    flexShrink: 0,
                                    marginTop: 7,
                                }}
                            />
                            <span style={{ color: textDim, fontSize: 13, lineHeight: 1.6 }}>
                                {text}
                            </span>
                        </div>
                    );
                }

                // Special block headings (ALL CAPS or Title Case lines that end without a period, short)
                const isHeading =
                    trimmed.length < 60 &&
                    !trimmed.endsWith('.') &&
                    !trimmed.endsWith(':') &&
                    /^[A-Z]/.test(trimmed) &&
                    (trimmed === trimmed.toUpperCase() ||
                        /^[A-Z][a-z]+(\s+[A-Za-z(&)]+)*$/.test(trimmed) ||
                        /^[A-Z][a-z]+\s+\(/.test(trimmed));

                if (isHeading) {
                    // Tier / state block header (e.g., "CLOSED (Normal)")
                    const isStateBlock = /\(.+\)/.test(trimmed) || trimmed === trimmed.toUpperCase();
                    if (isStateBlock) {
                        return (
                            <div
                                key={i}
                                style={{
                                    background: `${color}12`,
                                    border: `1px solid ${color}30`,
                                    borderRadius: 6,
                                    padding: '8px 14px',
                                    marginTop: 10,
                                    marginBottom: 4,
                                }}
                            >
                                <span
                                    style={{
                                        color,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {trimmed}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={i}
                            style={{
                                color: textBright,
                                fontWeight: 600,
                                fontSize: 14,
                                marginTop: 14,
                                marginBottom: 4,
                            }}
                        >
                            {trimmed}
                        </div>
                    );
                }

                // Regular paragraph
                return (
                    <p
                        key={i}
                        style={{
                            color: textDim,
                            fontSize: 13,
                            lineHeight: 1.7,
                            marginBottom: 2,
                        }}
                    >
                        {trimmed}
                    </p>
                );
            })}
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
}: {
    article: SearchableArticle;
    index: number;
    color: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div
            style={{
                background: bgDeep,
                border: `1px solid ${isExpanded ? color + '40' : borderSubtle}`,
                borderRadius: 10,
                transition: 'border-color 0.2s ease',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
                if (!isExpanded)
                    (e.currentTarget as HTMLDivElement).style.borderColor = borderSubtle;
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
                        background: `${color}15`,
                        borderRadius: 6,
                        padding: '4px 8px',
                        minWidth: 32,
                        textAlign: 'center',
                        flexShrink: 0,
                    }}
                >
                    {pad(index + 1)}
                </span>

                {/* Title + description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: textBright, fontWeight: 600, fontSize: 14 }}>
                        {article.title}
                    </div>
                    <div
                        style={{
                            color: textMuted,
                            fontSize: 12,
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {article.description}
                    </div>
                </div>

                {/* Route tag */}
                {article.route && (
                    <span
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: textMuted,
                            background: 'rgba(255,255,255,0.05)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            flexShrink: 0,
                        }}
                    >
                        {article.route}
                    </span>
                )}

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
                    maxHeight: isExpanded ? 2000 : 0,
                    opacity: isExpanded ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.2s ease',
                    padding: isExpanded ? '0 18px 18px' : '0 18px 0',
                }}
            >
                {isExpanded && (
                    <ArticleContent content={article.content} color={color} />
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
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: bgDeep,
                border: `1px solid ${borderSubtle}`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                    article.sectionColor + '60';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = borderSubtle;
            }}
        >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{article.sectionIcon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: textMuted, fontSize: 11, marginBottom: 2 }}>
                    {article.sectionTitle}
                </div>
                <div style={{ color: textBright, fontSize: 13, fontWeight: 600 }}>
                    {article.title}
                </div>
                <div
                    style={{
                        color: textMuted,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {article.description}
                </div>
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
        // Give React one tick to render, then scroll into view
        setTimeout(() => {
            document
                .getElementById(`article-${article.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);

    const currentSection = HELP_SECTIONS.find((s) => s.id === activeSection)!;

    return (
        <>
            {/* Inject keyframe for fade-in */}
            <style>{`
        @keyframes helpFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .help-scrollbar::-webkit-scrollbar { width: 6px; }
        .help-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .help-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .help-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>

            <div
                style={{
                    display: 'flex',
                    height: '100%',
                    overflow: 'hidden',
                    fontFamily:
                        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                {/* ─── LEFT SIDEBAR ───────────────────────────────── */}
                <aside
                    style={{
                        width: 280,
                        minWidth: 280,
                        display: 'flex',
                        flexDirection: 'column',
                        background: bgDeep,
                        borderRight: `1px solid ${borderSubtle}`,
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '20px 18px 14px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 14,
                            }}
                        >
                            <span style={{ fontSize: 22 }}>❓</span>
                            <span
                                style={{
                                    color: textBright,
                                    fontSize: 17,
                                    fontWeight: 700,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Help Center
                            </span>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 10,
                                    color: textMuted,
                                    background: 'rgba(255,255,255,0.06)',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    marginLeft: 'auto',
                                }}
                            >
                                v2.1.0
                            </span>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={textMuted}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    position: 'absolute',
                                    left: 10,
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
                                placeholder="Search articles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 32px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${borderSubtle}`,
                                    borderRadius: 6,
                                    color: textBright,
                                    fontSize: 13,
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={(e) =>
                                ((e.target as HTMLInputElement).style.borderColor =
                                    'rgba(255,255,255,0.2)')
                                }
                                onBlur={(e) =>
                                ((e.target as HTMLInputElement).style.borderColor =
                                    borderSubtle)
                                }
                            />
                        </div>
                    </div>

                    {/* Documentation label */}
                    <div
                        style={{
                            padding: '4px 18px 8px',
                            color: textMuted,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                    >
                        Documentation
                    </div>

                    {/* Section buttons */}
                    <div
                        className="help-scrollbar"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '0 10px',
                        }}
                    >
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
                                        gap: 10,
                                        padding: '10px 12px',
                                        marginBottom: 2,
                                        background: isActive ? `${section.color}10` : 'transparent',
                                        border: 'none',
                                        borderLeft: isActive
                                            ? `3px solid ${section.color}`
                                            : '3px solid transparent',
                                        borderRadius: '0 6px 6px 0',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLButtonElement).style.background =
                                                'rgba(255,255,255,0.03)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLButtonElement).style.background =
                                                'transparent';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                                        {section.icon}
                                    </span>
                                    <span
                                        style={{
                                            flex: 1,
                                            color: isActive ? textBright : textDim,
                                            fontSize: 13,
                                            fontWeight: isActive ? 600 : 400,
                                        }}
                                    >
                                        {section.title}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 11,
                                            color: isActive ? section.color : textMuted,
                                            background: isActive
                                                ? `${section.color}20`
                                                : 'rgba(255,255,255,0.04)',
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {section.articles.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Keyboard shortcuts */}
                    <div
                        style={{
                            padding: '14px 18px',
                            borderTop: `1px solid ${borderSubtle}`,
                        }}
                    >
                        <div
                            style={{
                                color: textMuted,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: 8,
                            }}
                        >
                            Keyboard Shortcuts
                        </div>
                        {SHORTCUTS.map((s) => (
                            <div
                                key={s.keys}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 0',
                                }}
                            >
                                <kbd
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 11,
                                        color: textBright,
                                        background: 'rgba(255,255,255,0.06)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        border: `1px solid ${borderSubtle}`,
                                    }}
                                >
                                    {s.keys}
                                </kbd>
                                <span style={{ color: textMuted, fontSize: 11 }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ─── MAIN CONTENT ───────────────────────────────── */}
                <main
                    ref={mainRef}
                    className="help-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '28px 36px',
                        background: 'transparent',
                    }}
                >
                    {isSearching ? (
                        /* Search results */
                        <div>
                            <div
                                style={{
                                    color: textMuted,
                                    fontSize: 13,
                                    marginBottom: 16,
                                }}
                            >
                                {searchResults.length > 0
                                    ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${search}"`
                                    : null}
                            </div>

                            {searchResults.length > 0 ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                    }}
                                >
                                    {searchResults.map((article) => (
                                        <SearchResult
                                            key={article.id}
                                            article={article}
                                            onClick={() => goToArticle(article)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '60px 20px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 40,
                                            marginBottom: 16,
                                            opacity: 0.4,
                                        }}
                                    >
                                        🔍
                                    </div>
                                    <div
                                        style={{
                                            color: textBright,
                                            fontSize: 16,
                                            fontWeight: 600,
                                            marginBottom: 6,
                                        }}
                                    >
                                        No results found
                                    </div>
                                    <div style={{ color: textMuted, fontSize: 13 }}>
                                        Try different keywords or browse the sections in the sidebar
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Section content */
                        <div>
                            {/* Section header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    marginBottom: 28,
                                }}
                            >
                                <span style={{ fontSize: 36 }}>{currentSection.icon}</span>
                                <div>
                                    <h1
                                        style={{
                                            color: textBright,
                                            fontSize: 24,
                                            fontWeight: 700,
                                            letterSpacing: '-0.02em',
                                            margin: 0,
                                        }}
                                    >
                                        {currentSection.title}
                                    </h1>
                                    <span
                                        style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 12,
                                            color: currentSection.color,
                                            background: `${currentSection.color}15`,
                                            padding: '2px 10px',
                                            borderRadius: 10,
                                            marginTop: 4,
                                            display: 'inline-block',
                                        }}
                                    >
                                        {currentSection.articles.length} article
                                        {currentSection.articles.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Article cards */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                {currentSection.articles.map((article, i) => {
                                    const searchable: SearchableArticle = {
                                        ...article,
                                        sectionId: currentSection.id,
                                        sectionTitle: currentSection.title,
                                        sectionIcon: currentSection.icon,
                                        sectionColor: currentSection.color,
                                    };
                                    return (
                                        <div key={article.id} id={`article-${article.id}`}>
                                            <ArticleCard
                                                article={searchable}
                                                index={i}
                                                color={currentSection.color}
                                                isExpanded={!!expanded[article.id]}
                                                onToggle={() => toggleArticle(article.id)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
