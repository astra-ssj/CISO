"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Brain,
    Loader2,
    Sparkles,
    Key,
    Eye,
    EyeOff,
    RefreshCw,
    Moon,
    Sun,
    Bell,
    Settings as SettingsIcon
} from "lucide-react";
import { useTheme } from "next-themes";

// AI Provider Configuration Component
function AIProviderConfig() {
    const [providers, setProviders] = useState<string[]>([]);
    const [activeProvider, setActiveProvider] = useState<string>('MOCK');
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const [apiKeys, setApiKeys] = useState({
        OPENAI: '',
        ANTHROPIC: '',
        GOOGLE: ''
    });

    useEffect(() => {
        fetch('/api/agent/analyze')
            .then(res => res.json())
            .then(data => {
                const providerList = Array.isArray(data.providers)
                    ? data.providers.map((p: string | { name?: string }) => typeof p === 'string' ? p : (p.name ?? 'Unknown'))
                    : ['MOCK', 'OPENAI', 'ANTHROPIC', 'GOOGLE'];
                setProviders(providerList);
                setActiveProvider(data.active || 'MOCK');
                setIsLoading(false);
            })
            .catch(() => {
                setProviders(['MOCK', 'OPENAI', 'ANTHROPIC', 'GOOGLE']);
                setIsLoading(false);
            });
    }, []);

    const testConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/agent/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: 'Connection test',
                    context: 'test'
                })
            });

            if (response.ok) {
                setTestResult('success');
            } else {
                setTestResult('error');
            }
        } catch {
            setTestResult('error');
        } finally {
            setIsTesting(false);
        }
    };

    const providerInfo = {
        MOCK: {
            name: 'Mock Provider',
            description: 'Simulated responses for testing. No API key required.',
            icon: '🧪',
            color: 'bg-gray-500'
        },
        OPENAI: {
            name: 'OpenAI GPT-4',
            description: 'Powered by GPT-4o for advanced reasoning.',
            icon: '🟢',
            color: 'bg-emerald-500'
        },
        ANTHROPIC: {
            name: 'Anthropic Claude',
            description: 'Claude 3.5 Sonnet for nuanced analysis.',
            icon: '🟠',
            color: 'bg-orange-500'
        },
        GOOGLE: {
            name: 'Google Gemini',
            description: 'Gemini 2.0 Flash for fast responses.',
            icon: '🔵',
            color: 'bg-blue-500'
        },
        OLLAMA: {
            name: 'Ollama (Local)',
            description: 'Local inference running on your machine.',
            icon: '🦙',
            color: 'bg-zinc-500'
        }
    };

    if (isLoading) {
        return (
            <Card className="border-primary/10">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>AI Intelligence Provider</CardTitle>
                        <CardDescription className="mt-1">
                            Configure which LLM powers Astra&apos;s analysis capabilities.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-3">
                    <Label>Active Provider</Label>
                    <Select value={activeProvider} onValueChange={setActiveProvider}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map(provider => (
                                <SelectItem key={provider} value={provider}>
                                    <div className="flex items-center gap-2">
                                        <span>{providerInfo[provider as keyof typeof providerInfo]?.icon || '⚙️'}</span>
                                        <span>{providerInfo[provider as keyof typeof providerInfo]?.name || provider}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        {providerInfo[activeProvider as keyof typeof providerInfo]?.description}
                    </p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${activeProvider === 'MOCK' ? 'bg-gray-500' :
                            testResult === 'success' ? 'bg-emerald-500 animate-pulse' :
                                testResult === 'error' ? 'bg-red-500' :
                                    'bg-amber-500'
                            }`} />
                        <div>
                            <div className="font-medium text-sm">
                                {activeProvider === 'MOCK' ? 'Simulation Mode' :
                                    testResult === 'success' ? 'Connected' :
                                        testResult === 'error' ? 'Connection Failed' :
                                            'Not Tested'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {activeProvider === 'MOCK'
                                    ? 'Using mock responses for demo'
                                    : 'Run a test to verify connection'}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={testConnection}
                        disabled={isTesting || activeProvider === 'MOCK'}
                    >
                        {isTesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Test
                            </>
                        )}
                    </Button>
                </div>

                {/* API Key Input (for non-mock providers) */}
                {activeProvider !== 'MOCK' && (
                    <div className="space-y-3 p-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Key className="h-4 w-4" />
                            <Label className="text-amber-600 dark:text-amber-400">API Key Configuration</Label>
                        </div>
                        <div className="relative">
                            <Input
                                type={showApiKey ? 'text' : 'password'}
                                placeholder={`Enter your ${activeProvider} API key...`}
                                value={apiKeys[activeProvider as keyof typeof apiKeys] || ''}
                                onChange={(e) => setApiKeys(prev => ({
                                    ...prev,
                                    [activeProvider]: e.target.value
                                }))}
                                className="pr-10 font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            ⚠️ For production, set <code className="bg-secondary px-1 rounded">AI_PROVIDER</code> and API keys in your <code className="bg-secondary px-1 rounded">.env.local</code> file.
                        </p>
                    </div>
                )}

                {/* Provider Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(providerInfo).map(([key, info]) => (
                        <button
                            key={key}
                            onClick={() => setActiveProvider(key)}
                            className={`p-3 rounded-lg border text-left transition-all ${activeProvider === key
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/30 hover:bg-secondary/30'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{info.icon}</span>
                                <span className="font-medium text-sm">{info.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {info.description}
                            </p>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// Appearance Settings Component
function AppearanceSettings() {
    const { theme, setTheme } = useTheme();

    return (
        <Card className="border-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sun className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription className="mt-1">
                            Customize the look and feel of Astra.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg">
                        <Button
                            variant={theme === 'light' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('light')}
                            className="h-8"
                        >
                            <Sun className="h-4 w-4 mr-1.5" />
                            Light
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('dark')}
                            className="h-8"
                        >
                            <Moon className="h-4 w-4 mr-1.5" />
                            Dark
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Notification Settings Component
function NotificationSettings() {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [criticalOnly, setCriticalOnly] = useState(false);

    return (
        <Card className="border-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription className="mt-1">
                            Configure alert preferences and notification channels.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Email Alerts</Label>
                        <p className="text-sm text-muted-foreground">Receive security alerts via email</p>
                    </div>
                    <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Critical Only</Label>
                        <p className="text-sm text-muted-foreground">Only notify for critical severity issues</p>
                    </div>
                    <Switch checked={criticalOnly} onCheckedChange={setCriticalOnly} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage AI providers, appearance, and system preferences.</p>
            </div>

            {/* AI Provider Section */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Intelligence
                </h2>
                <AIProviderConfig />
            </section>

            {/* Appearance Section */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                    Preferences
                </h2>
                <div className="space-y-4">
                    <AppearanceSettings />
                    <NotificationSettings />
                </div>
            </section>
        </div>
    );
}
