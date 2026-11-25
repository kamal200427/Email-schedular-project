
import { redis } from "../config/redis";

export interface ReserveEmailSlotInput {
  senderId: number;
  hourlyLimit: number;
  minDelaySeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAt: number;
  reason?: "hourly_limit" | "minimum_delay";
}

/**
 * Redis Lua script:
 *
 * 1. Removes expired hourly timestamps.
 * 2. Checks the sender's hourly limit.
 * 3. Checks the minimum delay between emails.
 * 4. Reserves a slot atomically.
 *
 * All timestamps are in milliseconds.
 */
const RESERVE_EMAIL_SLOT_SCRIPT = `
local hourlyKey = KEYS[1]
local delayKey = KEYS[2]

local now = tonumber(ARGV[1])
local hourlyLimit = tonumber(ARGV[2])
local minDelayMs = tonumber(ARGV[3])
local windowMs = tonumber(ARGV[4])

-- Remove timestamps older than one hour.
local windowStart = now - windowMs

redis.call(
  "ZREMRANGEBYSCORE",
  hourlyKey,
  "-inf",
  windowStart
)

-- Count emails already reserved in the current hour.
local currentCount = redis.call(
  "ZCARD",
  hourlyKey
)

-- Check hourly limit.
if currentCount >= hourlyLimit then
  local oldest = redis.call(
    "ZRANGE",
    hourlyKey,
    0,
    0,
    "WITHSCORES"
  )

  local retryAt = now + 1000

  if oldest[2] then
    retryAt = tonumber(oldest[2]) + windowMs
  end

  return {0, retryAt, 1}
end

-- Check minimum delay.
local lastSentAt = redis.call("GET", delayKey)

if lastSentAt then
  local nextAllowedAt = tonumber(lastSentAt) + minDelayMs

  if now < nextAllowedAt then
    return {0, nextAllowedAt, 2}
  end
end

-- Reserve the hourly slot.
local reservationId = tostring(now) .. ":" .. tostring(redis.call("INCR", "email-rate-limit:sequence"))

redis.call(
  "ZADD",
  hourlyKey,
  now,
  reservationId
)

redis.call(
  "PEXPIRE",
  hourlyKey,
  windowMs + 60000
)

-- Reserve the minimum-delay slot.
redis.call(
  "SET",
  delayKey,
  now,
  "PX",
  minDelayMs + 60000
)

return {1, now, 0}
`;

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Reserve a sending slot for a particular sender.
 */
export async function reserveEmailSlot(
  input: ReserveEmailSlotInput
): Promise<RateLimitResult> {
  const {
    senderId,
    hourlyLimit,
    minDelaySeconds,
  } = input;

  // Validate input.
  if (!Number.isInteger(senderId) || senderId <= 0) {
    throw new Error("senderId must be a positive integer.");
  }

  if (!Number.isInteger(hourlyLimit) || hourlyLimit <= 0) {
    throw new Error("hourlyLimit must be a positive integer.");
  }

  if (
    !Number.isFinite(minDelaySeconds) ||
    minDelaySeconds < 0
  ) {
    throw new Error("minDelaySeconds cannot be negative.");
  }

  const now = Date.now();
  const minDelayMs = minDelaySeconds * 1000;

  // Separate Redis keys for each sender.
  const hourlyKey = `email-rate-limit:sender:${senderId}:hourly`;
  const delayKey = `email-rate-limit:sender:${senderId}:delay`;

  const result = await redis.eval(
    RESERVE_EMAIL_SLOT_SCRIPT,
    2,
    hourlyKey,
    delayKey,
    now.toString(),
    hourlyLimit.toString(),
    minDelayMs.toString(),
    ONE_HOUR_MS.toString()
  ) as [number, number, number];

  const [allowed, retryAt, reasonCode] = result;

  if (Number(allowed) === 1) {
    return {
      allowed: true,
      retryAt: Number(retryAt),
    };
  }

  return {
    allowed: false,
    retryAt: Number(retryAt),
    reason:
      Number(reasonCode) === 1
        ? "hourly_limit"
        : "minimum_delay",
  };
}
