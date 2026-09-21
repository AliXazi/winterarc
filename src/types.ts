export interface Env {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  ADMIN_EMAIL?: string;
  ALLOW_DEV_LOGIN?: string;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  google_sub: string | null;
  created_at: string;
}

export interface WinterArcState {
  id: number;
  user_id: number;
  data_json: string;
  checks_json: string;
  stats_json: string;
  streak: number;
  last_100_date: string | null;
  checks_date: string | null;
  arc_start_date: string | null;
  arc_days: number;
  updated_at: string;
}

export interface SessionPayload {
  user_id: number;
  user_email: string;
  exp?: number;
}
