"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { ProductTour } from "@/components/ui/product-tour";
import { useAstraStore } from "@/lib/store";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated } = useAstraStore();

    // Route Protection
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    // Prevent flash of unauthenticated content
    if (!isAuthenticated) return null;

    return (
        <Shell>
            <ProductTour />
            {children}
        </Shell>
    );
}
