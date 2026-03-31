// Minimal type declaration for pg module (used only in admin DDL migration route)
declare module 'pg' {
  export class Client {
    constructor(config: {
      host: string
      port: number
      database: string
      user: string
      password: string
      ssl?: { rejectUnauthorized: boolean }
      connectionTimeoutMillis?: number
    })
    connect(): Promise<void>
    query(sql: string): Promise<{ rows: Record<string, unknown>[] }>
    end(): Promise<void>
  }
}
