/** Keeps the game in localStorage. Storage can be blocked or full, so every access is guarded. */
export class SaveManager {
  constructor(key, storage = browserStorage()) {
    this.key = key;
    this.storage = storage;
    this.enabled = true;
  }

  save(game) {
    if (!this.enabled) return;
    try {
      this.storage?.setItem(this.key, JSON.stringify({ ...game.toSave(), savedAt: Date.now() }));
    } catch (error) {
      console.warn('Could not save the game', error);
    }
  }

  /** Returns the saved data, or null for a new player. A corrupt save is set aside rather than lost. */
  load() {
    let raw;
    try {
      raw = this.storage?.getItem(this.key);
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') return data;
    } catch {
      // fall through and keep the unreadable save for inspection
    }
    try {
      this.storage.setItem(`${this.key}:corrupt`, raw);
    } catch {
      // nothing more we can do
    }
    return null;
  }

  /** Deletes the save and stops saving, so the reload that follows starts fresh. */
  wipe() {
    this.enabled = false;
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // storage unavailable: nothing to delete
    }
  }
}

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined; // access itself throws when site data is blocked
  }
}
