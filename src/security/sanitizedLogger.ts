/**
 * SanitizedLogger
 * Safe logging utility that strips sensitive fields (tokens, full private boards, secrets).
 */
export class SanitizedLogger {
  private isDevelopment: boolean = process.env.NODE_ENV !== 'production';

  public info(event: string, meta?: Record<string, any>): void {
    const sanitized = this.sanitizeMeta(meta);
    console.log(`[SECURITY INFO] [${new Date().toISOString()}] ${event}`, sanitized ? JSON.stringify(sanitized) : '');
  }

  public warn(event: string, meta?: Record<string, any>): void {
    const sanitized = this.sanitizeMeta(meta);
    console.warn(`[SECURITY WARN] [${new Date().toISOString()}] ${event}`, sanitized ? JSON.stringify(sanitized) : '');
  }

  public error(event: string, meta?: Record<string, any>): void {
    const sanitized = this.sanitizeMeta(meta);
    console.error(`[SECURITY ERROR] [${new Date().toISOString()}] ${event}`, sanitized ? JSON.stringify(sanitized) : '');
  }

  private sanitizeMeta(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta) return undefined;
    const clean: Record<string, any> = {};

    Object.keys(meta).forEach((key) => {
      const lower = key.toLowerCase();
      if (
        lower.includes('token') ||
        lower.includes('password') ||
        lower.includes('secret') ||
        lower.includes('key')
      ) {
        clean[key] = '[REDACTED_SECRET]';
      } else if (lower === 'board' || lower === 'winningboard' || lower === 'playerboards') {
        clean[key] = '[BOARD_PRIVACY_HIDDEN]';
      } else {
        clean[key] = meta[key];
      }
    });

    return clean;
  }
}

export const sanitizedLogger = new SanitizedLogger();
