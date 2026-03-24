export interface PushSubscriptionJSON {
  endpoint: string
  expirationTime: number | null | undefined
  keys: {
    p256dh: string | undefined
    auth: string | undefined
  } | Record<string, string>
}
