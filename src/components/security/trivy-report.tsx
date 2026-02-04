'use client';

import React, { useState } from 'react';
import { TrivyReport } from '@/lib/trivy/scanner';

export function TrivyReportDashboard() {
    const [report, setReport] = useState<TrivyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runScan = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/security/scan', { method: 'POST' });
            if (!res.ok) throw new Error('Scan failed');
            const data = await res.json();
            setReport(data.report);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary metrics
    const summary = React.useMemo(() => {
        if (!report?.Results) return { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

        let s = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
        report.Results.forEach(r => {
            r.Vulnerabilities?.forEach(v => {
                s.total++;
                if (v.Severity === 'CRITICAL') s.critical++;
                else if (v.Severity === 'HIGH') s.high++;
                else if (v.Severity === 'MEDIUM') s.medium++;
                else s.low++;
            });
        });
        return s;
    }, [report]);

    return (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-cyan-400">Vulnerability Scanner (Trivy)</h2>
                <button
                    onClick={runScan}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded disabled:opacity-50"
                >
                    {loading ? 'Scanning...' : 'Run New Scan'}
                </button>
            </div>

            {error && <div className="text-red-400 p-2 bg-red-900/20 rounded">{error}</div>}

            {report && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-800 p-3 rounded">
                        <div className="text-sm text-slate-400">Total Vulnerabilities</div>
                        <div className="text-2xl font-bold text-white">{summary.total}</div>
                    </div>
                    <div className="bg-red-900/30 p-3 rounded border border-red-900">
                        <div className="text-sm text-red-300">Critical</div>
                        <div className="text-2xl font-bold text-red-500">{summary.critical}</div>
                    </div>
                    <div className="bg-orange-900/30 p-3 rounded border border-orange-900">
                        <div className="text-sm text-orange-300">High</div>
                        <div className="text-2xl font-bold text-orange-500">{summary.high}</div>
                    </div>
                    <div className="bg-yellow-900/30 p-3 rounded border border-yellow-900">
                        <div className="text-sm text-yellow-300">Medium</div>
                        <div className="text-2xl font-bold text-yellow-500">{summary.medium}</div>
                    </div>
                    <div className="bg-blue-900/30 p-3 rounded border border-blue-900">
                        <div className="text-sm text-blue-300">Low</div>
                        <div className="text-2xl font-bold text-blue-500">{summary.low}</div>
                    </div>
                </div>
            )}

            {!report && !loading && (
                <div className="text-center text-slate-500 py-8 italic">
                    Run a scan to see vulnerability report.
                </div>
            )}
        </div>
    );
}
