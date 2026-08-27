"use client";

import Link from "next/link";
import { cartItemCount, useCartStore } from "../store/cartStore";
import { Mark } from "./Mark";

export function Header() {
  const cart = useCartStore((s) => s.cart);
  const count = cartItemCount(cart);

  return (
    <header className="border-b border-hairline bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="font-display text-xl font-extrabold tracking-tight text-ink">XLSmart</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/support" className="font-display text-sm font-semibold text-ink-soft transition-colors hover:text-blaze">
            Support
          </Link>
          <Link
            href="/setup"
            className="flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 font-display text-sm font-semibold text-ink transition-colors hover:border-blaze hover:text-blaze"
          >
            My Setup
            <span className="inline-flex min-w-[1.4rem] justify-center rounded-full bg-gradient-primary px-1.5 py-0.5 text-xs font-bold text-white">
              {count}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
