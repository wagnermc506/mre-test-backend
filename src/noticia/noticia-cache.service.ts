import { Injectable } from "@nestjs/common";

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

@Injectable()
export class NoticiaCacheService {
    private readonly ttlMs = 30_000;
    private readonly store = new Map<string, CacheEntry<unknown>>();

    get<T>(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) {
            return undefined;
        }
        if (entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value as T;
    }

    set<T>(key: string, value: T): void {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }

    clear(): void {
        this.store.clear();
    }
}
