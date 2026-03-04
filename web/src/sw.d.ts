interface ServiceWorkerGlobalScope {
  skipWaiting: () => void
  clients: Clients
  registration: ServiceWorkerRegistration
}

interface Clients {
  matchAll(options?: { type?: string }): Promise<WindowClient[]>
  openWindow(url: string): Promise<WindowClient | null>
  claim(): Promise<void>
}

interface WindowClient extends Client {
  focus(): Promise<WindowClient>
}
