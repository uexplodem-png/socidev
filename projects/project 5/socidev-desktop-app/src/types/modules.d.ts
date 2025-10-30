declare module 'user-agents' {
    export default class UserAgent {
        constructor(options?: { deviceCategory?: string });
        toString(): string;
    }
}

declare module 'randomstring' {
    export function generate(options?: { length?: number; charset?: string }): string;
}

declare module 'auto-launch' {
    export default class AutoLaunch {
        constructor(options: { name: string; path: string });
        isEnabled(): Promise<boolean>;
        enable(): Promise<void>;
        disable(): Promise<void>;
    }
}

declare module 'ghost-cursor' {
    import { Page, ElementHandle } from 'puppeteer';

    export interface GhostCursor {
        click(element: ElementHandle): Promise<void>;
        move(x: number, y: number): Promise<void>;
    }

    export function createCursor(page: Page): GhostCursor;
}
