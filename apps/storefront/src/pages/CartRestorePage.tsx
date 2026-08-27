import { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

// Landing target for the coupon-recovery email link:
// {storefrontUrl}/cart/{cartId}?coupon={code} -- see docs/email-templates.md.
export function CartRestorePage() {
  const { cartId } = useParams<{ cartId: string }>();
  const [searchParams] = useSearchParams();
  const restoreCart = useCartStore((s) => s.restoreCart);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!cartId) {
      setStatus("error");
      return;
    }
    restoreCart(cartId, searchParams.get("coupon"))
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  if (status === "done") return <Navigate to="/cart" replace />;

  if (status === "error") {
    return <p className="font-body text-ink">That manifest isn't on file anymore.</p>;
  }

  return <p className="font-mono text-sm text-ink-soft">Restoring your manifest…</p>;
}
