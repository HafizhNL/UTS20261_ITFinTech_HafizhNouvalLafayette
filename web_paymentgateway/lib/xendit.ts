const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

if (!XENDIT_SECRET_KEY) {
  throw new Error("XENDIT_SECRET_KEY is not defined");
}

export const xenditConfig = {
  secretKey: XENDIT_SECRET_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  webhookToken: process.env.XENDIT_WEBHOOK_TOKEN,
};