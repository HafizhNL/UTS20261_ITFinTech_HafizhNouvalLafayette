import { handleXenditWebhook } from "@/backend/webhook";
import { xenditConfig } from "@/lib/xendit";

export async function POST(request: Request) {
  if (!xenditConfig.webhookToken) {
    return Response.json(
      { success: false, message: "XENDIT_WEBHOOK_TOKEN is not configured" },
      { status: 500 }
    );
  }

  if (request.headers.get("x-callback-token") !== xenditConfig.webhookToken) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      id?: string;
      external_id?: string;
      status?: string;
    };

    await handleXenditWebhook(payload);

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);

    return Response.json(
      { success: false, message: "Failed to process webhook" },
      { status: 500 }
    );
  }
}