import { NextRequest, NextResponse } from "next/server";
import { generateThreatBrief } from "@/lib/ai/osint-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { industry, region, focusAreas } = body;

        if (!industry) {
            return NextResponse.json(
                { error: "Industry is required" },
                { status: 400 }
            );
        }

        const brief = await generateThreatBrief(
            industry,
            region || "Global",
            focusAreas || ""
        );

        return NextResponse.json(brief);
    } catch (error) {
        console.error("[OSINT API] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate threat brief" },
            { status: 500 }
        );
    }
}
