import { NextResponse } from "next/server";
import { buildCustomerProfile } from "@/lib/services/profileService";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function GET(req: Request, { params }: { params: { customerId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const profile = await buildCustomerProfile(params.customerId);
    return NextResponse.json(profile);
  } catch (err) {
    return handleError(err);
  }
}
