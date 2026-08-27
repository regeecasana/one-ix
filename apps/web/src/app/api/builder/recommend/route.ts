import { NextResponse } from "next/server";
import { recommendPlan } from "@/lib/services/recommendationService";
import { handleError } from "@/lib/apiHelpers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const devices = String(body?.devices ?? "");
    const priority = String(body?.priority ?? "");
    const recommendation = recommendPlan(body?.usage, devices, priority);
    return NextResponse.json(recommendation);
  } catch (err) {
    return handleError(err);
  }
}
