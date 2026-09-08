import { NextResponse } from "next/server";
import { getContactByEmail } from "@/lib/bird/client";
import { HttpError } from "@/lib/errors";
import { buildCustomerProfile } from "@/lib/services/profileService";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

// Lets an agent look up a customer's profile by email directly -- for
// tickets that never got linked (Customer.activeTicketId unset), or when
// the agent wants to check a different customer than the one this ticket
// resolves to. See docs/zendesk-app.md.
export async function GET(req: Request) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
    if (!email) throw new HttpError(400, "email_required");

    const customer = await getContactByEmail(email);
    if (!customer) throw new HttpError(404, "customer_not_found");

    const profile = await buildCustomerProfile(customer.id);
    return NextResponse.json(profile);
  } catch (err) {
    return handleError(err);
  }
}
