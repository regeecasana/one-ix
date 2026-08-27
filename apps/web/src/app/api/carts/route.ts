import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const cart = await prisma.cart.create({
      data: {
        utmSource: body?.utmSource ? String(body.utmSource) : undefined,
        utmCampaign: body?.utmCampaign ? String(body.utmCampaign) : undefined,
        utmContent: body?.utmContent ? String(body.utmContent) : undefined,
      },
      include: { items: true },
    });
    return NextResponse.json(serializeCart(cart), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
