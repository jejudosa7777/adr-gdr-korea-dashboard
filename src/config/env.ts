import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_DATA_MODE: z.enum(["mock", "real"]).default("mock"),
});

const serverEnvSchema = publicEnvSchema.extend({
  MARKET_DATA_API_KEY: z.string().optional(),
  EXCHANGE_RATE_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  SLACK_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
  });
}

export function getServerEnv() {
  const parsed = serverEnvSchema.parse({
    NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
    MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY,
    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  });

  if (parsed.NEXT_PUBLIC_DATA_MODE === "real" && !parsed.MARKET_DATA_API_KEY) {
    throw new Error("실제 API 모드에서는 MARKET_DATA_API_KEY가 필요합니다. Mock 모드로 실행하거나 .env.local에 값을 설정하세요.");
  }

  return parsed;
}
