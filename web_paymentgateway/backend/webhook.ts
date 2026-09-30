import { updatePaymentFromWebhook } from "@/backend/payment";

export async function handleXenditWebhook(payload: {
	id?: string;
	external_id?: string;
	status?: string;
}) {
	return updatePaymentFromWebhook(payload);
}
