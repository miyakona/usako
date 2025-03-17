import { D1Database } from './d1';

export interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_CHANNEL_SECRET: string;
  DB: D1Database;
} 