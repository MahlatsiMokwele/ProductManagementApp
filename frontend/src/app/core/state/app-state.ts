import { BehaviorSubject, Observable } from "rxjs";

export class AppState {
  private static readonly store = new Map<string, unknown>();
  private static readonly subjects = new Map<
    string,
    BehaviorSubject<unknown>
  >();
  private static readonly persistentKeys = new Set<string>();

  // key should also be persisted to `localStorage`
  static enablePersistence(key: string): void {
    this.persistentKeys.add(key);
    // Eagerly hydrate so the first `get` returns the persisted value.
    if (!this.store.has(key)) {
      const restored = this.readFromStorage(key);
      if (restored !== undefined) this.store.set(key, restored);
    }
  }

  static set<T>(key: string, value: T): void {
    this.store.set(key, value);
    if (this.persistentKeys.has(key)) {
      this.writeToStorage(key, value);
    }
    const subject = this.subjects.get(key);
    if (subject) subject.next(value);
  }

  // Read the latest value synchronously.
  static get<T>(key: string): T | undefined {
    if (!this.store.has(key) && this.persistentKeys.has(key)) {
      const restored = this.readFromStorage(key);
      if (restored !== undefined) this.store.set(key, restored);
    }
    return this.store.get(key) as T | undefined;
  }

  static observe<T>(key: string): Observable<T | undefined> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new BehaviorSubject<unknown>(this.get<T>(key)));
    }
    return this.subjects.get(key)!.asObservable() as Observable<T | undefined>;
  }

  static clear(key?: string): void {
    if (key === undefined) {
      // Clear all in-memory state.
      for (const k of Array.from(this.store.keys())) {
        this.clearOne(k);
      }
      return;
    }
    this.clearOne(key);
  }

  private static clearOne(key: string): void {
    this.store.delete(key);
    if (this.persistentKeys.has(key)) {
      try {
        localStorage.removeItem(this.storageKey(key));
      } catch {
        /* ignore */
      }
    }
    const subject = this.subjects.get(key);
    if (subject) subject.next(undefined);
  }

  private static storageKey(key: string): string {
    return `appstate:${key}`;
  }

  private static readFromStorage(key: string): unknown {
    try {
      const raw = localStorage.getItem(this.storageKey(key));
      return raw === null ? undefined : JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  private static writeToStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(this.storageKey(key), JSON.stringify(value));
    } catch {}
  }
}

// Canonical state keys
export const STATE_KEYS = {
  // AuthenticatedUser. Persistent (survives refresh).
  AUTH_USER: "auth.user",
  // Last product list filter (search + categoryId). Persistent so users keep their view.
  PRODUCT_FILTER: "products.filter",
  // Categories cache to avoid refetching on every navigation.
  CATEGORIES: "categories.flat",
} as const;
