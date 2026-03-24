declare module 'idb-keyval' {
  export function set<T = any>(key: string, value: T): Promise<void>
  export function get<T = any>(key: string): Promise<T | undefined>
  export function del(key: string): Promise<void>
  export function keys(): Promise<IDBValidKey[]>
}
