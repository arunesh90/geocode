import { Pool } from "pg";

/**
 * Small wrapper around node-postgres
 * With unsafe Typescript casts
 */
class PG {
  private pool: Pool | undefined = undefined;

  private checkPool() {
    if (this.pool === undefined) {
      this.connect();
    }
  }

  connect() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
      max: 15,
    });
  }

  async query<T = any>(query: string, opts?: any[]): Promise<T[]> {
    this.checkPool();

    const result = await this.pool!.query(query, opts);

    return result.rows;
  }

  async queryFirst<T = any>(query: string, opts?: any[]): Promise<T | undefined> {
    this.checkPool();

    const result = await this.query<T>(query, opts);

    return result[0];
  }

  async cleanup() {
    if (this.pool !== undefined) {
      return this.pool.end();
    }
  }
}

export const db = new PG();
