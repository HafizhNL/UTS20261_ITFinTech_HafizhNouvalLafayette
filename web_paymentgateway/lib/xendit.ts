const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

if (!XENDIT_SECRET_KEY) {
  throw new Error("XENDIT_SECRET_KEY is not defined");
}

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const vercelAppUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const xenditConfig = {
  secretKey: XENDIT_SECRET_KEY,
  appUrl: (
    configuredAppUrl ||
    (vercelAppUrl ? `https://${vercelAppUrl}` : "http://localhost:3000")
  ).replace(/\/$/, ""),
  webhookToken: process.env.XENDIT_WEBHOOK_TOKEN,
};