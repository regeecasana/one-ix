import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Page not found</h1>
      <p className="font-body text-ink-soft">That page doesn't exist.</p>
      <Link to="/" className="font-display text-sm font-semibold text-blaze underline underline-offset-4">
        Back to catalog
      </Link>
    </div>
  );
}
