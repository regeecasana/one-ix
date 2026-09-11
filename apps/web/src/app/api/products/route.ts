import { NextResponse } from "next/server";
import { searchObjects } from "@/lib/bird/objects";
import type { BirdProduct } from "@/lib/bird/types";
import { serializeProduct } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

// Has no dynamic segments or request-dependent input, so Next.js would
// otherwise statically cache this response at build time -- baking in a
// stale product/stock snapshot forever. Force a live query every request.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await searchObjects<BirdProduct>("products", []);
    products.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(products.map(serializeProduct));
  } catch (err) {
    return handleError(err);
  }
}
