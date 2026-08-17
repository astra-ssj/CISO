"use client";

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

/** Empty until a real contract is uploaded. No sample MSA is shown as yours. */
export function ContractAnalysis() {
    const [hasUpload] = useState(false);

    return (
        <Card className="relative w-full h-[400px] bg-black/95 border-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="text-center space-y-3 px-8">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
                <h2 className="text-xl font-bold tracking-tight text-white">Contract mindmap</h2>
                <p className="text-sm text-zinc-500 max-w-md">
                    {hasUpload
                        ? 'Parsed clauses will appear here.'
                        : 'No contract uploaded. Astra will not display a sample MSA as if it were yours.'}
                </p>
            </div>
        </Card>
    );
}
