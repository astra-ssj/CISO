import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { ProductTour } from "@/components/ui/product-tour";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <Shell>
            <ProductTour />
            {children}
        </Shell>
    );
}
