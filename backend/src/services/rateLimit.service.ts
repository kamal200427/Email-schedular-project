
import { redis } from "../config/redis";

import type {
  RateLimitResult
} from "../modules/emails/email.types";

interface ReserveEmailSlotOptions {
  senderId: number;
  hourlyLimit: number;
  minDelaySeconds: number;
}

/**
 * Atomically checks:
 * 1. Minimum delay between emails from the same sender.
 * 2. Maximum number of emails sent per UTC hour.
 *
 * Both checks and the reservation happen inside one Redis Lua script.
 */
const RESERVE_SLOT_SCRIPT = `
local hourlyKey = KEYS[1]
local intervalKey = KEYS[2]

local now = tonumber(ARGV[1])
local hourlyLimit = tonumber(ARGV[2])
local minDelayMs = tonumber(ARGV[3])
local hourEnd = tonumber(ARGV[4])

-- Check minimum delay between sends.
if minDelayMs > 0 then
    local lastSent = redis.call("GET", intervalKey)

    if lastSent then
        local nextAllowed = tonumber(lastSent) + minDelayMs

        if now < nextAllowed then
            return {0, nextAllowed, "minimum_delay"}
        end
    end
end

-- Check the hourly sending limit.
local currentCount = tonumber(
    redis.call("GET", hourlyKey) or "0"
)

if currentCount >= hourlyLimit then
    return {0, hourEnd, "hourly_limit"}
end

-- Reserve one sending slot.
local newCount = redis.call("INCR", hourlyKey)

-- Keep the counter for two hours so it survives the hour boundary.
if newCount == 1 then
    redis.call("EXPIRE", hourlyKey, 7200)
end

-- Record the time of this reservation.
if minDelayMs > 0 then
    redis.call(
        "SET",
        intervalKey,
        now,
        "PX",
        minDelayMs
    )
end

return {1, 0, "allowed"}
`;

export async function reserveEmailSlot(
  options: ReserveEmailSlotOptions
): Promise<RateLimitResult> {
  const {
    senderId,
    hourlyLimit,
    minDelaySeconds
  } = options;

  if (!Number.isInteger(senderId) || senderId <= 0) {
    throw new Error("Invalid sender ID");
  }

  if (!Number.isInteger(hourlyLimit) || hourlyLimit < 1) {
    throw new Error("Hourly limit must be a positive integer");
  }

  if (!Number.isFinite(minDelaySeconds) || minDelaySeconds < 0) {
    throw new Error("Minimum delay cannot be negative");
  }

  const now = Date.now();
  const hourStart = Math.floor(now / 3_600_000) * 3_600_000;
  const hourEnd = hourStart + 3_600_000;

  const hourlyKey = `email-rate:sender:${senderId}:hour:${hourStart}`;
  const intervalKey = `email-rate:sender:${senderId}:last-send`;

  const minDelayMs = Math.floor(minDelaySeconds * 1000);

  const result = await redis.eval(
    RESERVE_SLOT_SCRIPT,
    2,
    hourlyKey,
    intervalKey,
    now,
    hourlyLimit,
    minDelayMs,
    hourEnd
  ) as [number, number, string];

  const [allowed, retryAt, reason] = result;

  if (Number(allowed) === 1) {
    return {
      allowed: true
    };
  }

  return {
    allowed: false,
    retryAt: Number(retryAt),
    reason: reason as RateLimitResult["reason"]
  };
}

/**
 * Read the current hourly count for a sender.
 * Useful for dashboard statistics and debugging.
 */
export async function getHourlyEmailCount(
  senderId: number
): Promise<number> {
  const now = Date.now();
  const hourStart = Math.floor(now / 3_600_000) * 3_600_000;

  const key = `email-rate:sender:${senderId}:hour:${hourStart}`;

  const count = await redis.get(key);

  return Number(count ?? 0);
}
