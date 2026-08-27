import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-hairline px-4 py-6 text-center font-mono text-xs uppercase tracking-[0.15em] text-ink-soft sm:px-6">
        Standard Issue — a working demo store. No real payment is ever taken.
      </footer>
    </div>
  );
}
