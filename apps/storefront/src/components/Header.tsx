import { Link } from "react-router-dom";
import { cartItemCount, useCartStore } from "../store/cartStore";
import { SignalBars } from "./SignalBars";

export function Header() {
  const cart = useCartStore((s) => s.cart);
  const count = cartItemCount(cart);

  return (
    <header className="border-b border-hairline bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <SignalBars />
          <span className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-ink">Relay</span>
        </Link>
        <Link
          to="/cart"
          className="flex items-center gap-2 border border-ink px-3 py-1.5 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-canvas"
        >
          Cart
          <span className="inline-flex min-w-[1.5rem] justify-center rounded-sm bg-blaze px-1 text-canvas">
            {count}
          </span>
        </Link>
      </div>
    </header>
  );
}
