import { Suspense } from "react";
import { HomeContent } from "./_content/HomeContent";

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
