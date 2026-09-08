import { NextResponse } from "next/server";
import { createObject } from "@/lib/bird/objects";
import type { BirdCart } from "@/lib/bird/types";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const cart = await createObject<BirdCart>("carts", {
      customerId: null,
      status: "active",
      items: [],
      utmSource: body?.utmSource ? String(body.utmSource) : null,
      utmCampaign: body?.utmCampaign ? String(body.utmCampaign) : null,
      utmContent: body?.utmContent ? String(body.utmContent) : null,
      recommendationReason: null,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
    if (!cart) throw new Error("cart_creation_failed");
    return NextResponse.json(serializeCart(cart), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
