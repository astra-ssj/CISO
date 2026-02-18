import { NextResponse } from 'next/server';
import { scanProject } from '@/lib/trivy/scanner';

export async function POST() {
    try {
        // Trigger generic project scan
        const report = await scanProject('.');

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
