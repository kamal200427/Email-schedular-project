
import session from "express-session";
import type { SessionData } from "express-session";

import { redis } from "./redis";
import { env } from "./env";

const SESSION_PREFIX = "email-scheduler:session:";

class RedisSessionStore extends session.Store {
  async get(
    sid: string,
    callback: (
      error: unknown,
      sessionData?: SessionData | null
    ) => void
  ): Promise<void> {
    try {
      const data = await redis.get(`${SESSION_PREFIX}${sid}`);

      if (!data) {
        callback(null, null);
        return;
      }

      callback(null, JSON.parse(data) as SessionData);
    } catch (error) {
      callback(error);
    }
  }

  async set(
    sid: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void
  ): Promise<void> {
    try {
      const expiresAt = sessionData.cookie.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;

      const ttl = Math.max(
        1,
        Math.ceil((expiresAt - Date.now()) / 1000)
      );

      await redis.set(
        `${SESSION_PREFIX}${sid}`,
        JSON.stringify(sessionData),
        "EX",
        ttl
      );

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(
    sid: string,
    callback?: (error?: unknown) => void
  ): Promise<void> {
    try {
      await redis.del(`${SESSION_PREFIX}${sid}`);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(
    sid: string,
    sessionData: SessionData,
    callback?: (error?: unknown) => void
  ): Promise<void> {
    try {
      const expiresAt = sessionData.cookie.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;

      const ttl = Math.max(
        1,
        Math.ceil((expiresAt - Date.now()) / 1000)
      );

      await redis.expire(
        `${SESSION_PREFIX}${sid}`,
        ttl
      );

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
}

const isProduction = env.NODE_ENV === "production";

export const sessionMiddleware = session({
  name: "email_scheduler.sid",

  secret: env.SESSION_SECRET,

  store: new RedisSessionStore(),

  resave: false,

  saveUninitialized: false,

  rolling: true,

  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
  }
});
