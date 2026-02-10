"use strict";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentHeatmap } from "@/components/executive/investment-heatmap";
import { RevenueVelocityGauge, VelocityMetric } from "@/components/executive/revenue-velocity-gauge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight } from "lucide-react";

// Mock Data
const INVESTMENT_DATA = [
    { id: "1", category: "Endpoint Protection", spend: 85, riskReduction: 90, actualSpend: "$450k" },
    { id: "2", category: "Cloud Security", spend: 70, riskReduction: 85, actualSpend: "$320k" },
    { id: "3", category: "Identity (IAM)", spend: 60, riskReduction: 80, actualSpend: "$280k" },
    { id: "4", category: "Legacy Firewall", spend: 80, riskReduction: 30, actualSpend: "$400k" }, // Waste
    { id: "5", category: "Security Training", spend: 20, riskReduction: 60, actualSpend: "$50k" }, // Efficient
    { id: "6", category: "AppSec Testing", spend: 40, riskReduction: 75, actualSpend: "$150k" },
];

const VELOCITY_DATA: VelocityMetric[] = [
    { id: "1", processName: "Vendor Onboarding", delay: "+3 Weeks", impact: "high", status: "blocked" },
    { id: "2", processName: "Access Provisioning", delay: "+2 Days", impact: "medium", status: "slow" },
    { id: "3", processName: "Incident Response", delay: "-15 Mins", impact: "low", status: "optimized" },
    { id: "4", processName: "Policy Approval", delay: "+5 Days", impact: "medium", status: "slow" },
];

const VENDOR_DATA = [
    { name: "CrowdStrike", service: "EDR/XDR", cost: "$450,000", renewal: "Oct 2026", status: "active" },
    { name: "Wiz.io", service: "CNAPP", cost: "$320,000", renewal: "Jan 2027", status: "active" },
    { name: "Okta", service: "IAM", cost: "$280,000", renewal: "Jun 2026", status: "review" },
    { name: "Palo Alto Networks", service: "Firewall", cost: "$400,000", renewal: "Dec 2026", status: "churn" },
    { name: "Snyk", service: "AppSec", cost: "$150,000", renewal: "Mar 2027", status: "active" },
];

export default function BudgetPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Security Investment & ROI</h1>
                <p className="text-muted-foreground">Financial performance, vendor efficacy, and capital efficiency tracking.</p>
            </div>

            {/* Top Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Budget"
                    value="$4.2M"
                    icon={Wallet}
                    trend="+12% YoY"
                    trendUp={true}
                />
                <MetricCard
                    title="Burn Rate"
                    value="$350k/mo"
                    icon={DollarSign}
                    trend="On Track"
                    trendUp={true}
                    neutral
                />
                <MetricCard
                    title="Forecast Variance"
                    value="-2.5%"
                    icon={PieChart}
                    trend="Under Budget"
                    trendUp={true}
                />
                <MetricCard
                    title="Cost Per Risk Unit"
                    value="$1,200"
                    icon={TrendingUp}
                    trend="-5% Efficiency"
                    trendUp={true}
                />
            </div>

            {/* Main Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Investment Heatmap (4 cols) */}
                <Card className="col-span-4 h-[400px]">
                    <CardHeader>
                        <CardTitle>Investment Efficiency Map</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <InvestmentHeatmap items={INVESTMENT_DATA} />
                    </CardContent>
                </Card>

                {/* ROI Velocity (3 cols) */}
                <Card className="col-span-3 h-[400px]">
                    <CardHeader>
                        <CardTitle>Operational Velocity</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                        <RevenueVelocityGauge metrics={VELOCITY_DATA} />
                    </CardContent>
                </Card>
            </div>

            {/* Vendor Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Vendor Spend</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Annual Cost</TableHead>
                                <TableHead>Renewal</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {VENDOR_DATA.map((vendor) => (
                                <TableRow key={vendor.name}>
                                    <TableCell className="font-medium">{vendor.name}</TableCell>
                                    <TableCell>{vendor.service}</TableCell>
                                    <TableCell>{vendor.cost}</TableCell>
                                    <TableCell>{vendor.renewal}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            vendor.status === 'active' ? 'default' :
                                                vendor.status === 'review' ? 'secondary' : 'destructive'
                                        }>
                                            {vendor.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, trend, trendUp, neutral }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className={`text-xs flex items-center mt-1 ${neutral ? 'text-muted-foreground' :
                        trendUp ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {trend}
                </p>
            </CardContent>
        </Card>
    )
}
