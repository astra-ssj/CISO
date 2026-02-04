import { NextResponse } from 'next/server';
import { scanProject } from '@/lib/trivy/scanner';

// Feature Flag: Mock Mode for demo
const DEMO_MODE = true;

export async function POST() {
    try {
        // Trigger generic project scan
        const report = await scanProject('.', DEMO_MODE);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            report
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
