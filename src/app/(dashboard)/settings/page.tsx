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
    CheckCircle2, Plug,
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

// ─── Team Management Tab ───
type TeamUser = { id: string; name: string | null; email: string; role: string; ssoProvider?: string | null; mfaEnabled?: boolean; lastActiveAt?: string | null; };
type TeamInvite = { id: string; email: string; role: string; status: string; createdAt: string; };

const ROLE_COLORS: Record<string, string> = {
    CISO: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    SEC_ENGINEER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    AUDITOR: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    VIEWER: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const ROLE_PERMISSIONS: { role: string; modules: string[] }[] = [
    { role: 'CISO', modules: ['All modules', 'Settings', 'Team Management', 'AI Config', 'Billing'] },
    { role: 'SEC_ENGINEER', modules: ['Command Center', 'Incidents', 'AppSec', 'Intelligence', 'Vendors', 'Integrations'] },
    { role: 'AUDITOR', modules: ['Governance', 'Evidence', 'Audit Logs', 'Compliance Reports'] },
    { role: 'VIEWER', modules: ['Command Center (read-only)', 'Dashboards', 'Reports'] },
];

function TeamManagementTab() {
    const [users, setUsers] = useState<TeamUser[]>([]);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('VIEWER');
    const [isSending, setIsSending] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    useEffect(() => {
        fetch('/api/team/users').then(r => r.json()).then((d: { users: TeamUser[]; invites: TeamInvite[] }) => {
            setUsers(d.users ?? []);
            setInvites(d.invites ?? []);
        }).catch(() => { }).finally(() => setIsLoading(false));
    }, []);

    const sendInvite = async () => {
        setIsSending(true);
        try {
            const res = await fetch('/api/team/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) });
            if (res.ok) { setInviteSuccess(true); setInviteEmail(''); setTimeout(() => { setInviteSuccess(false); setShowInviteModal(false); }, 2000); }
        } finally { setIsSending(false); }
    };

    const updateRole = async (userId: string, role: string) => {
        await fetch('/api/team/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    };

    const ssoCount = users.filter(u => u.ssoProvider).length;
    const mfaCount = users.filter(u => u.mfaEnabled).length;

    if (isLoading) return <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: users.length, icon: '👥' },
                    { label: 'SSO Users', value: ssoCount, icon: '🔐' },
                    { label: 'MFA Enabled', value: mfaCount, icon: '🛡️' },
                    { label: 'Pending Invites', value: invites.length, icon: '📨' },
                ].map(s => (
                    <Card key={s.label} className="border-primary/10">
                        <CardContent className="pt-4 pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{s.icon} {s.label}</div>
                            <div className="text-2xl font-bold">{s.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Team Table */}
            <Card className="border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div><CardTitle>Team Members</CardTitle><CardDescription className="mt-0.5">Manage roles and access</CardDescription></div>
                    <Button size="sm" className="gap-2" onClick={() => setShowInviteModal(true)}><Users className="h-4 w-4" />Invite Member</Button>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No team members found.</p>
                    ) : (
                        <div className="space-y-2">
                            {users.map(user => {
                                const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
                                return (
                                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">{initials}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{user.name ?? 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {user.ssoProvider && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">SSO</span>}
                                            {user.mfaEnabled && <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">MFA</span>}
                                        </div>
                                        <Select value={user.role} onValueChange={(r) => void updateRole(user.id, r)}>
                                            <SelectTrigger className={`w-36 h-7 text-xs border ${ROLE_COLORS[user.role] ?? ''}`}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'].map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <Card className="border-primary/10">
                    <CardHeader><CardTitle className="text-base">Pending Invites</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {invites.map(inv => (
                                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">{inv.email}</span>
                                        <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[inv.role] ?? ''}`}>{inv.role}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Sent {new Date(inv.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Role Permissions Matrix */}
            <Card className="border-primary/10">
                <CardHeader><CardTitle className="text-base">Role Permissions</CardTitle><CardDescription>Access by role across platform modules</CardDescription></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {ROLE_PERMISSIONS.map(rp => (
                            <div key={rp.role} className="flex items-start gap-3">
                                <span className={`text-xs px-2 py-1 rounded border font-mono w-28 shrink-0 text-center ${ROLE_COLORS[rp.role] ?? ''}`}>{rp.role}</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {rp.modules.map(m => <span key={m} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Invite Team Member</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input id="invite-email" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="mt-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="invite-role">Role</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger id="invite-role" className="mt-1.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                                <strong className="text-foreground">{inviteRole}</strong> permissions: {ROLE_PERMISSIONS.find(r => r.role === inviteRole)?.modules.join(', ')}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                            <Button className="flex-1 gap-2" onClick={() => void sendInvite()} disabled={isSending || !inviteEmail}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : inviteSuccess ? <CheckCircle2 className="h-4 w-4" /> : null}
                                {inviteSuccess ? 'Sent!' : 'Send Invite'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Security Policies Tab ───
function SecurityPoliciesTab() {
    const [enforceSSO, setEnforceSSO] = useState(false);
    const [requireMFA, setRequireMFA] = useState(false);
    const [autoProvision, setAutoProvision] = useState(true);
    const [defaultRole, setDefaultRole] = useState('VIEWER');
    const [sessionTimeout, setSessionTimeout] = useState('24');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-5">
            <Card className="border-primary/10">
                <CardHeader><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><ShieldAlert className="h-5 w-5 text-primary" /></div><div><CardTitle>Authentication Policies</CardTitle><CardDescription className="mt-1">Control how users sign in.</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between"><div><Label>Enforce SSO</Label><p className="text-sm text-muted-foreground">Hide password login when SSO is connected</p></div><Switch checked={enforceSSO} onCheckedChange={setEnforceSSO} /></div>
                    <div className="flex items-center justify-between"><div><Label>Require MFA</Label><p className="text-sm text-muted-foreground">Enforce multi-factor authentication for all users</p></div><Switch checked={requireMFA} onCheckedChange={setRequireMFA} /></div>
                    <div className="space-y-1.5"><Label>Session Timeout (hours)</Label><Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="w-32" min="1" max="168" /><p className="text-xs text-muted-foreground">Sessions expire after this period of inactivity</p></div>
                </CardContent>
            </Card>
            <Card className="border-primary/10">
                <CardHeader><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div><div><CardTitle>User Provisioning</CardTitle><CardDescription className="mt-1">Control auto-provisioning for SSO users.</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between"><div><Label>Auto-provision SSO Users</Label><p className="text-sm text-muted-foreground">Create accounts automatically on first SSO login</p></div><Switch checked={autoProvision} onCheckedChange={setAutoProvision} /></div>
                    {autoProvision && (
                        <div className="space-y-1.5"><Label>Default Role for Provisioned Users</Label>
                            <Select value={defaultRole} onValueChange={setDefaultRole}>
                                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                <SelectContent>{['CISO', 'SEC_ENGINEER', 'AUDITOR', 'VIEWER'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Button onClick={handleSave} className="gap-2">{saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : 'Save Policies'}</Button>
        </div>
    );
}

// ─── Shodan / Integrations Config ───
function IntegrationsTab() {
    const [shodanKey, setShodanKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<{ connected: boolean; plan?: string; credits?: number; error?: string } | null>(null);

    const testShodan = async () => {
        setTesting(true); setStatus(null);
        try {
            const res = await fetch('/api/intelligence/shodan/health');
            const data = await res.json();
            setStatus(data);
        } catch { setStatus({ connected: false, error: 'Network error' }); }
        finally { setTesting(false); }
    };

    return (
        <div className="space-y-6">
            <Card className="border-primary/10">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyan-500/10 rounded-lg"><Plug className="h-6 w-6 text-cyan-400" /></div>
                        <div>
                            <CardTitle>Shodan</CardTitle>
                            <CardDescription className="mt-1">Attack surface intelligence and internet-facing asset discovery.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="relative">
                            <Input
                                type={showKey ? 'text' : 'password'}
                                placeholder="Enter your Shodan API key..."
                                value={shodanKey}
                                onChange={e => setShodanKey(e.target.value)}
                                className="pr-10"
                            />
                            <button className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" onClick={() => setShowKey(!showKey)}>
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Get your key at <a href="https://account.shodan.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">account.shodan.io</a>. Set <code className="text-cyan-300 bg-cyan-500/10 px-1 rounded">SHODAN_API_KEY</code> in your <code className="text-cyan-300 bg-cyan-500/10 px-1 rounded">.env</code> file.</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${status?.connected ? 'bg-emerald-500 animate-pulse' : status?.error ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <div>
                                <div className="font-medium text-sm">
                                    {status?.connected ? `Connected — ${status.plan}` : status?.error ? 'Connection Failed' : 'Not Tested'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {status?.connected
                                        ? `${status.credits} query credits remaining`
                                        : status?.error ?? 'Click Test Connection to verify'}
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={testShodan} disabled={testing}>
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 mr-2" />Test Connection</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Tabs defaultValue="ai" className="space-y-6">
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" />AI Provider</TabsTrigger>
                    <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" />Team</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2"><ShieldAlert className="h-4 w-4" />Security Policies</TabsTrigger>
                    <TabsTrigger value="preferences" className="gap-2"><SettingsIcon className="h-4 w-4" />Preferences</TabsTrigger>
                    <TabsTrigger value="economics" className="gap-2"><Coins className="h-4 w-4" />AI Economics</TabsTrigger>
                    <TabsTrigger value="companies" className="gap-2"><Building2 className="h-4 w-4" />Companies & Products</TabsTrigger>
                    <TabsTrigger value="integrations" className="gap-2"><Plug className="h-4 w-4" />Integrations</TabsTrigger>
                </TabsList>

                <TabsContent value="ai"><AIProviderConfig /></TabsContent>
                <TabsContent value="team"><TeamManagementTab /></TabsContent>
                <TabsContent value="security"><SecurityPoliciesTab /></TabsContent>
                <TabsContent value="preferences"><div className="space-y-4"><NotificationSettings /></div></TabsContent>
                <TabsContent value="economics"><AIEconomicsTab /></TabsContent>
                <TabsContent value="companies"><CompaniesProductsTab /></TabsContent>
                <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
            </Tabs>
        </div>
    );
}
