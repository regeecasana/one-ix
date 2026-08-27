import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ClientProviders } from "@/components/ClientProviders";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "XLSmart — build the connection that powers your creativity",
  description:
    "A working demo store: build a connectivity setup, save it, activate it. Real setups, real vouchers, real activations. No real payment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
        <footer className="border-t border-hairline px-4 py-6 text-center font-display text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft sm:px-6">
          XLSmart — a working demo store. No real payment is ever taken. No real network, either.
        </footer>
        <ClientProviders />
      </body>
    </html>
  );
}
