import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

// Landing target for the CDP nudge email link:
// {storefrontUrl}/setup/{cartId} -- see docs/email-templates.md.
export function SetupRestorePage() {
  const { cartId } = useParams<{ cartId: string }>();
  const restoreCart = useCartStore((s) => s.restoreCart);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!cartId) {
      setStatus("error");
      return;
    }
    restoreCart(cartId)
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  if (status === "done") return <Navigate to="/setup" replace />;

  if (status === "error") {
    return <p className="font-body text-ink">That setup isn't available anymore.</p>;
  }

  return <p className="font-mono text-sm text-ink-soft">Restoring your setup…</p>;
}
