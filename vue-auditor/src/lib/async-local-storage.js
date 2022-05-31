
export class AsyncLocalStorage {
  constructor(keys) {
    this.keyList = keys || [];
  }
  async getItem(key) {
    if (!key) return;
    if (!this.keyList.includes(key)) this.keyList.push(key);
    const v = window.localStorage.getItem(key);
    if (!v) return undefined;
    return JSON.parse(v);
  }
  async setItem(key, value) {
    if (!key) return;
    if (!this.keyList.includes(key)) this.keyList.push(key);
    if (!value) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  async getAll() {
    const result = {};
    for (const key of this.keyList) {
      result[key] = await this.getItem(key);
    }
    return result
  }
  async setAll(group) {
    for (const key of Object.keys(group)) {
      await this.setItem(key, group[key]);
    }
  }
}
