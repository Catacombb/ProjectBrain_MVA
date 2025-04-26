export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          role: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          role?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          role?: string
        }
      }
    }
  }
}
