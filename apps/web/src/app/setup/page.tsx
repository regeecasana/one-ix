import { Suspense } from "react";
import { SetupContent } from "../_content/SetupContent";

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}
