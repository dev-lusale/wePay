// Web build is only used for previews/tests. The token is kept in sessionStorage
// (cleared when the tab closes) so a page reload doesn't sign the tester out.
const store = typeof sessionStorage !== "undefined" ? sessionStorage : null;
const mem = new Map<string, string>();
export const secureStorage = {
  get: async (key: string) => (store ? store.getItem(key) : mem.get(key) ?? null),
  set: async (key: string, value: string) => void (store ? store.setItem(key, value) : mem.set(key, value)),
  remove: async (key: string) => void (store ? store.removeItem(key) : mem.delete(key)),
};
