import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold uppercase text-ink">Not on file</h1>
      <p className="font-body text-ink-soft">That page isn't on file.</p>
      <Link to="/" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
        Back to catalog
      </Link>
    </div>
  );
}
