import { AppState } from "./app-state";
import { firstValueFrom } from "rxjs";

// Tests for the static AppState wrapper

describe("AppState", () => {
  beforeEach(() => {
    AppState.clear();
    localStorage.clear();
  });

  it("round-trips a value through set/get", () => {
    AppState.set("counter", 42);
    expect(AppState.get<number>("counter")).toBe(42);
  });

  it("returns undefined for unknown keys", () => {
    expect(AppState.get<string>("nope")).toBeUndefined();
  });

  it("emits the current value when subscribed via observe()", async () => {
    AppState.set("greeting", "hi");
    const first = await firstValueFrom(AppState.observe<string>("greeting"));
    expect(first).toBe("hi");
  });

  it("notifies observers when a value changes", () => {
    const emitted: (number | undefined)[] = [];
    AppState.observe<number>("n").subscribe((v) => emitted.push(v));

    AppState.set("n", 1);
    AppState.set("n", 2);

    // The BehaviorSubject emits the initial undefined, then each set value.
    expect(emitted).toEqual([undefined, 1, 2]);
  });

  it("clear(key) removes a single key", () => {
    AppState.set("a", 1);
    AppState.set("b", 2);
    AppState.clear("a");
    expect(AppState.get("a")).toBeUndefined();
    expect(AppState.get("b")).toBe(2);
  });

  it("clear() with no args wipes everything", () => {
    AppState.set("a", 1);
    AppState.set("b", 2);
    AppState.clear();
    expect(AppState.get("a")).toBeUndefined();
    expect(AppState.get("b")).toBeUndefined();
  });

  describe("persistence", () => {
    it("mirrors persistent keys into localStorage", () => {
      AppState.enablePersistence("user");
      AppState.set("user", { name: "Carpe" });

      const raw = localStorage.getItem("appstate:user");
      expect(raw).toBe('{"name":"Carpe"}');
    });

    it("hydrates from localStorage on first read", () => {
      localStorage.setItem("appstate:user", '{"name":"Restored"}');
      // Note: fresh enablePersistence triggers hydration.
      AppState.enablePersistence("user");

      expect(AppState.get<{ name: string }>("user")).toEqual({
        name: "Restored",
      });
    });

    it("clearing a persistent key also removes it from localStorage", () => {
      AppState.enablePersistence("user");
      AppState.set("user", { name: "Carpe" });
      AppState.clear("user");

      expect(localStorage.getItem("appstate:user")).toBeNull();
    });
  });
});
