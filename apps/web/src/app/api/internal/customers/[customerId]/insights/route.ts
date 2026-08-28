import { NextResponse } from "next/server";
import { buildCustomerProfile } from "@/lib/services/profileService";
import { generateInsight } from "@/lib/services/insightService";
import { requireInternalAuth, checkRateLimit, rateLimitResponse, handleError } from "@/lib/apiHelpers";

// On-demand only (agent clicks "Get AI insight") -- never runs
// automatically, same "explicit action, not automated" principle as
// voucher issuance. Each call is a real OpenAI request, so keep it capped.
export async function POST(req: Request, { params }: { params: { customerId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    if (!checkRateLimit(req, "insights", 10, 60_000)) return rateLimitResponse();

    const profile = await buildCustomerProfile(params.customerId);
    const insight = await generateInsight(profile);
    return NextResponse.json({ insight });
  } catch (err) {
    return handleError(err);
  }
}
