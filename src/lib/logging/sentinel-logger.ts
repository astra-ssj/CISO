export type LogLevel = 'AUDIT' | 'SECURITY' | 'ERROR' | 'INFO';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    environment: string;
    source: 'ASTRA-CISO';
}

export class SentinelLogger {
    private static format(level: LogLevel, message: string, context?: Record<string, any>): string {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            environment: process.env.NODE_ENV || 'development',
            source: 'ASTRA-CISO'
        };
        return JSON.stringify(entry);
    }

    static audit(action: string, actor: string, resource: string, outcome: 'SUCCESS' | 'FAILURE') {
        console.log(this.format('AUDIT', `Action: ${action}`, { actor, resource, outcome }));
    }

    static security(event: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details?: any) {
        console.warn(this.format('SECURITY', event, { severity, ...details }));
    }

    static error(message: string, error?: Error) {
        console.error(this.format('ERROR', message, { stack: error?.stack }));
    }

    static info(message: string, context?: any) {
        console.info(this.format('INFO', message, context));
    }
}
