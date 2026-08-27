"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

// Landing target for the voucher email link: {siteUrl}/setup/{cartId}
// ?voucher={code} -- see docs/email-templates.md and
// src/lib/email/templates.ts.
export default function SetupRestorePage({ params }: { params: { cartId: string } }) {
  const searchParams = useSearchParams();
  const restoreCart = useCartStore((s) => s.restoreCart);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    restoreCart(params.cartId)
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.cartId]);

  useEffect(() => {
    if (status !== "done") return;
    const voucher = searchParams.get("voucher");
    router.replace(voucher ? `/setup?voucher=${encodeURIComponent(voucher)}` : "/setup");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === "error") {
    return <p className="font-body text-ink">That setup isn't available anymore.</p>;
  }

  return <p className="font-mono text-sm text-ink-soft">Restoring your setup…</p>;
}
