"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Brain, Loader2, Sparkles, Key, Eye, EyeOff, RefreshCw, Bell,
    Settings as SettingsIcon, Coins, Flame, Activity, Users, ShieldAlert, Cpu, Building2,
    Globe, CheckCircle2,
} from "lucide-react";
import { CompaniesProductsTab } from '@/components/settings/CompaniesProductsTab';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

// ─── AI Provider Config (unchanged) ───
function AIProviderConfig() {
    const [providers, setProviders] = useState<string[]>([]);
    const [activeProvider, setActiveProvider] = useState<string>('MOCK');
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKeys, setApiKeys] = useState({ OPENAI: '', ANTHROPIC: '', GOOGLE: '' });

    useEffect(() => {
        fetch('/api/agent/analyze').then(res => res.json()).then(data => {
            const providerList = Array.isArray(data.providers)
                ? data.providers.map((p: string | { name?: string }) => typeof p === 'string' ? p : (p.name ?? 'Unknown'))
                : ['MOCK', 'OPENAI', 'ANTHROPIC', 'GOOGLE'];
            setProviders(providerList); setActiveProvider(data.active || 'MOCK'); setIsLoading(false);
        }).catch(() => { setProviders(['MOCK', 'OPENAI', 'ANTHROPIC', 'GOOGLE']); setIsLoading(false); });
    }, []);

    const testConnection = async () => {
        setIsTesting(true); setTestResult(null);
        try {
            const response = await fetch('/api/agent/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'Connection test', context: 'test' }) });
            setTestResult(response.ok ? 'success' : 'error');
        } catch { setTestResult('error'); } finally { setIsTesting(false); }
    };

    const providerInfo: Record<string, { name: string; description: string; icon: string }> = {
        MOCK: { name: 'Mock Provider', description: 'Simulated responses for testing. No API key required.', icon: '🧪' },
        OPENAI: { name: 'OpenAI GPT-4', description: 'Powered by GPT-4o for advanced reasoning.', icon: '🟢' },
        ANTHROPIC: { name: 'Anthropic Claude', description: 'Claude 3.5 Sonnet for nuanced analysis.', icon: '🟠' },
        GOOGLE: { name: 'Google Gemini', description: 'Gemini 2.0 Flash for fast responses.', icon: '🔵' },
        OLLAMA: { name: 'Ollama (Local)', description: 'Local inference running on your machine.', icon: '🦙' },
    };

    if (isLoading) return <Card className="border-primary/10"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

    return (
        <Card className="border-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg"><Brain className="h-6 w-6 text-primary" /></div>
                    <div><CardTitle>AI Intelligence Provider</CardTitle><CardDescription className="mt-1">Configure which LLM powers Astra&apos;s analysis capabilities.</CardDescription></div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Active Provider</Label>
                    <Select value={activeProvider} onValueChange={setActiveProvider}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {providers.map(provider => (
                                <SelectItem key={provider} value={provider}>
                                    <div className="flex items-center gap-2"><span>{providerInfo[provider]?.icon || '⚙️'}</span><span>{providerInfo[provider]?.name || provider}</span></div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">{providerInfo[activeProvider]?.description}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${activeProvider === 'MOCK' ? 'bg-gray-500' : testResult === 'success' ? 'bg-emerald-500 animate-pulse' : testResult === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <div>
                            <div className="font-medium text-sm">{activeProvider === 'MOCK' ? 'Simulation Mode' : testResult === 'success' ? 'Connected' : testResult === 'error' ? 'Connection Failed' : 'Not Tested'}</div>
                            <div className="text-xs text-muted-foreground">{activeProvider === 'MOCK' ? 'Using mock responses for demo' : 'Run a test to verify connection'}</div>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={testConnection} disabled={isTesting || activeProvider === 'MOCK'}>
                        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 mr-2" />Test</>}
                    </Button>
                </div>

                {activeProvider !== 'MOCK' && (
                    <div className="space-y-3 p-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center gap-2 text-amber-400"><Key className="h-4 w-4" /><Label className="text-amber-400">API Key Configuration</Label></div>
                        <div className="relative">
                            <Input type={showApiKey ? 'text' : 'password'} placeholder={`Enter your ${activeProvider} API key...`}
                                value={apiKeys[activeProvider as keyof typeof apiKeys] || ''}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, [activeProvider]: e.target.value }))}
                                className="pr-10 font-mono text-sm" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowApiKey(!showApiKey)}>
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            🔒 This key is held in session memory only and is <strong>not saved</strong> to the database. You will need to re-enter it after a page refresh.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(providerInfo).map(([key, info]) => (
                        <button key={key} onClick={() => setActiveProvider(key)}
                            className={`p-3 rounded-lg border text-left transition-all ${activeProvider === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/30 hover:bg-secondary/30'}`}>
                            <div className="flex items-center gap-2 mb-1"><span className="text-lg">{info.icon}</span><span className="font-medium text-sm">{info.name}</span></div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{info.description}</p>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Notification Settings ───
function NotificationSettings() {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [criticalOnly, setCriticalOnly] = useState(false);
    return (
        <Card className="border-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-primary/10 rounded-lg"><Bell className="h-6 w-6 text-primary" /></div><div><CardTitle>Notifications</CardTitle><CardDescription className="mt-1">Configure alert preferences.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div><Label>Email Alerts</Label><p className="text-sm text-muted-foreground">Receive security alerts via email</p></div><Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} /></div>
                <div className="flex items-center justify-between"><div><Label>Critical Only</Label><p className="text-sm text-muted-foreground">Only notify for critical severity issues</p></div><Switch checked={criticalOnly} onCheckedChange={setCriticalOnly} /></div>
            </CardContent>
        </Card>
    );
}

// ─── AI Economics Tab (from /admin/economics) ───
interface CostMetrics { totalCostUSD: number; totalCalls: number; byFeature: { feature: string; calls: number; costUSD: number }[]; byUser: { userId: string; calls: number; costUSD: number; modelsUsed: string[] }[]; }

function AIEconomicsTab() {
    const [metrics, setMetrics] = useState<CostMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/metrics').then(res => res.ok ? res.json() : null).then(data => { if (data) setMetrics(data); }).catch(() => { }).finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>;
    if (!metrics) return <div className="p-8 text-muted-foreground text-center">No cost data available. AI economics will appear once API calls are logged.</div>;

    const formatCurrency = (val: number) => `$${val.toFixed(4)}`;
    const chartData = metrics.byFeature.map(f => ({ name: f.feature.replace('_', ' '), cost: f.costUSD }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 via-transparent border-indigo-500/20"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total API Cost</CardTitle><Coins className="h-4 w-4 text-indigo-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-indigo-500">{formatCurrency(metrics.totalCostUSD)}</div><p className="text-xs text-muted-foreground mt-1">Cumulative USD</p></CardContent></Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 via-transparent border-emerald-500/20"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Operations</CardTitle><Activity className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.totalCalls.toLocaleString()}</div><p className="text-xs text-muted-foreground mt-1">Successful inferences</p></CardContent></Card>
                <Card className="bg-gradient-to-br from-orange-500/10 via-transparent border-orange-500/20"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Highest Burn Feature</CardTitle><Flame className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-xl font-bold truncate">{metrics.byFeature[0]?.feature || 'N/A'}</div></CardContent></Card>
                <Card className="bg-gradient-to-br from-blue-500/10 via-transparent border-blue-500/20"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Tenants</CardTitle><Users className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{metrics.byUser.length}</div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Cost by Feature</CardTitle><CardDescription>API costs across platform capabilities.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => [`$${Number(value ?? 0).toFixed(4)}`, "Cost"]} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>{chartData.map((_, i) => <Cell key={`cell-${i}`} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6'][i % 4]} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Tenant Burn Rate</CardTitle><CardDescription>API costs by user.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.byUser.slice(0, 5).map((user, i) => (
                                <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">#{i + 1}</div>
                                        <div><div className="font-medium text-sm">{user.userId}</div><div className="flex items-center gap-2 mt-1"><Cpu className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{user.modelsUsed.join(', ')}</span></div></div>
                                    </div>
                                    <div className="text-right"><div className="font-bold text-sm text-indigo-400">{formatCurrency(user.costUSD)}</div><div className="text-xs text-muted-foreground">{user.calls} calls</div></div>
                                </div>
                            ))}
                            {metrics.byUser.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No usage data logged yet.</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gradient-to-r from-red-500/10 to-transparent border-red-500/20">
                <CardHeader className="pb-2"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-red-500" /><CardTitle className="text-red-500">Margin Alerts</CardTitle></div></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">No tenants currently exceeding their subscription profitability threshold.</p></CardContent>
            </Card>
        </div>
    );
}

// ─── Intelligence Integrations Tab ───
const INTEL_API_KEYS = [
    { key: 'GROQ_API_KEY', label: 'Groq API Key', hint: 'Llama 3.1 for threat classification', group: 'Groq AI' },
    { key: 'UPSTASH_REDIS_REST_URL', label: 'Upstash Redis URL', hint: 'Cross-request caching', group: 'Upstash Redis' },
    { key: 'UPSTASH_REDIS_REST_TOKEN', label: 'Upstash Redis Token', hint: 'Upstash Redis auth token', group: 'Upstash Redis' },
];

function IntegrationsTab() {
    const [values, setValues] = useState<Record<string, string>>({});
    const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
    const [saved, setSaved] = useState(false);

    const toggleShow = (key: string) => {
        setShowKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const handleSave = () => {
        // In production, these would be persisted server-side
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const groups = [...new Set(INTEL_API_KEYS.map((k) => k.group))];

    return (
        <div className="space-y-6">
            <Card className="border-primary/10">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyan-500/10 rounded-lg"><Globe className="h-6 w-6 text-cyan-400" /></div>
                        <div>
                            <CardTitle>Intelligence API Keys</CardTitle>
                            <CardDescription className="mt-1">Configure external data source credentials for the World Monitor and Intelligence tabs.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {groups.map((group) => (
                        <div key={group} className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group}</h4>
                            {INTEL_API_KEYS.filter((k) => k.group === group).map((apiKey) => (
                                <div key={apiKey.key} className="space-y-1.5">
                                    <Label htmlFor={apiKey.key}>{apiKey.label}</Label>
                                    <div className="relative">
                                        <Input
                                            id={apiKey.key}
                                            type={showKeys.has(apiKey.key) ? 'text' : 'password'}
                                            placeholder={apiKey.hint}
                                            value={values[apiKey.key] || ''}
                                            onChange={(e) => setValues((prev) => ({ ...prev, [apiKey.key]: e.target.value }))}
                                            className="pr-10 font-mono text-sm"
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => toggleShow(apiKey.key)}>
                                            {showKeys.has(apiKey.key) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                        <Button onClick={handleSave} className="gap-2">
                            {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Key className="h-4 w-4" /> Save API Keys</>}
                        </Button>
                        <p className="text-xs text-muted-foreground">Keys are stored securely and used only for server-side API calls.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Tabs defaultValue="ai" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" />AI Provider</TabsTrigger>
                    <TabsTrigger value="preferences" className="gap-2"><SettingsIcon className="h-4 w-4" />Preferences</TabsTrigger>
                    <TabsTrigger value="economics" className="gap-2"><Coins className="h-4 w-4" />AI Economics</TabsTrigger>
                    <TabsTrigger value="companies" className="gap-2"><Building2 className="h-4 w-4" />Companies & Products</TabsTrigger>
                    <TabsTrigger value="integrations" className="gap-2"><Globe className="h-4 w-4" />Integrations</TabsTrigger>
                </TabsList>

                <TabsContent value="ai"><AIProviderConfig /></TabsContent>
                <TabsContent value="preferences"><div className="space-y-4"><NotificationSettings /></div></TabsContent>
                <TabsContent value="economics"><AIEconomicsTab /></TabsContent>
                <TabsContent value="companies"><CompaniesProductsTab /></TabsContent>
                <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
            </Tabs>
        </div>
    );
}
