import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

export const LOCK_TTL_SECONDS = 10 * 60; // 10-minute payment timeout

const RECONNECT_ATTEMPTS = 5;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClientType | null = null;
  private connectPromise: Promise<unknown> | null = null;

  private getClient(): RedisClientType {
    if (!this.client) {
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
        socket: {
          connectTimeout: 3_000,
          reconnectStrategy: (retries) =>
            retries >= RECONNECT_ATTEMPTS
              ? new Error("Redis unavailable")
              : Math.min(retries * 200, 1_000),
        },
      });
      this.client.on("error", (err) => {
        console.error("Redis error:", err.message);
      });
    }
    return this.client;
  }

  async connectRedis(): Promise<RedisClientType> {
    const current = this.getClient();
    if (!current.isOpen) {
      if (!this.connectPromise) {
        this.connectPromise = current.connect().catch((error) => {
          this.connectPromise = null;
          throw error;
        });
      }
      await this.connectPromise;
    }
    return current;
  }

  isRedisAvailable(): boolean {
    if (!this.client) return false;
    return this.client.isOpen && this.client.isReady;
  }

  lockSeatKey(screeningId: string, label: string): string {
    return `cinematrix:seatlock:${screeningId}:${label}`;
  }

  async acquireSeatLocks(
    screeningId: string,
    labels: string[],
    ownerId: string,
  ): Promise<{ ok: true } | { ok: false; conflictingLabel: string }> {
    if (labels.length === 0) return { ok: true };
    const c = await this.connectRedis();
    const acquired: string[] = [];
    try {
      for (const label of labels) {
        const key = this.lockSeatKey(screeningId, label);
        const result = await c.set(key, ownerId, {
          NX: true,
          EX: LOCK_TTL_SECONDS,
        });
        if (result === "OK") {
          acquired.push(key);
          continue;
        }
        const holder = await c.get(key);
        if (holder === ownerId) {
          await c.expire(key, LOCK_TTL_SECONDS);
          acquired.push(key);
          continue;
        }
        if (acquired.length > 0) await c.del(acquired);
        return { ok: false, conflictingLabel: label };
      }
      return { ok: true };
    } catch (error) {
      if (acquired.length > 0) {
        try {
          await c.del(acquired);
        } catch {
          // Best-effort rollback; the lock expires on its own if this fails.
        }
      }
      throw error;
    }
  }

  async releaseSeatLocks(
    screeningId: string,
    labels: string[],
    ownerId?: string,
  ): Promise<void> {
    if (labels.length === 0) return;
    const c = await this.connectRedis();
    for (const label of labels) {
      const key = this.lockSeatKey(screeningId, label);
      if (ownerId) {
        const holder = await c.get(key);
        if (holder !== ownerId) continue;
      }
      await c.del(key);
    }
  }

  async isSeatLockedByOther(
    screeningId: string,
    label: string,
    ownerId: string,
  ): Promise<boolean> {
    const c = await this.connectRedis();
    const holder = await c.get(this.lockSeatKey(screeningId, label));
    return holder !== null && holder !== ownerId;
  }

  async getSeatLockHolder(
    screeningId: string,
    label: string,
  ): Promise<string | null> {
    const c = await this.connectRedis();
    const holder = await c.get(this.lockSeatKey(screeningId, label));
    return holder as string | null;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      try {
        await this.client.quit();
      } catch {
        // Shutdown should never be blocked by a Redis failure.
      }
    }
  }
}
