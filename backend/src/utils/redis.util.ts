import { createClient, type RedisClientType } from "redis";

export const LOCK_TTL_SECONDS = 10 * 60; // 10-minute payment timeout

let client: RedisClientType | null = null;
let connectPromise: Promise<unknown> | null = null;

const getClient = (): RedisClientType => {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    });
    client.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }
  return client;
};

// Connects lazily and caches the connect promise so a brief Redis outage does
// not trigger a cascade of reconnect attempts.
export const connectRedis = async (): Promise<RedisClientType> => {
  const current = getClient();
  if (!current.isOpen) {
    if (!connectPromise) {
      connectPromise = current.connect();
    }
    await connectPromise;
  }
  return current;
};

export const isRedisAvailable = (): boolean => {
  if (!client) return false;
  return client.isOpen && client.isReady;
};

export const lockSeatKey = (screeningId: string, label: string): string =>
  `cinematrix:seatlock:${screeningId}:${label}`;

// Atomically acquires 10-minute locks for every requested seat. Fails fast on
// the first seat already held by someone else and releases partial locks.
export const acquireSeatLocks = async (
  screeningId: string,
  labels: string[],
  ownerId: string,
): Promise<{ ok: true } | { ok: false; conflictingLabel: string }> => {
  if (labels.length === 0) return { ok: true };
  const c = await connectRedis();
  const acquired: string[] = [];
  try {
    for (const label of labels) {
      const key = lockSeatKey(screeningId, label);
      const result = await c.set(key, ownerId, { NX: true, EX: LOCK_TTL_SECONDS });
      if (result === "OK") {
        acquired.push(key);
        continue;
      }
      const holder = await c.get(key);
      if (holder === ownerId) {
        // Same user re-locking an already-held seat: refresh the timeout.
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
        // best effort rollback
      }
    }
    throw error;
  }
};

// Removes locks. When ownerId is given, only locks owned by that user are
// released (prevents releasing another customer's hold).
export const releaseSeatLocks = async (
  screeningId: string,
  labels: string[],
  ownerId?: string,
): Promise<void> => {
  if (labels.length === 0) return;
  const c = await connectRedis();
  for (const label of labels) {
    const key = lockSeatKey(screeningId, label);
    if (ownerId) {
      const holder = await c.get(key);
      if (holder !== ownerId) continue;
    }
    await c.del(key);
  }
};

// Returns true when a live lock exists for the seat that belongs to another user.
export const isSeatLockedByOther = async (
  screeningId: string,
  label: string,
  ownerId: string,
): Promise<boolean> => {
  const c = await connectRedis();
  const holder = await c.get(lockSeatKey(screeningId, label));
  return holder !== null && holder !== ownerId;
};

// Returns the owner id currently holding a seat lock, or null when not locked.
export const getSeatLockHolder = async (
  screeningId: string,
  label: string,
): Promise<string | null> => {
  const c = await connectRedis();
  return c.get(lockSeatKey(screeningId, label));
};
