import { Suspense } from "react";
import { AssessmentWorkspace } from "./workspace";

export default function AssessmentPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f3f6f7] p-8 text-sm text-[#647780]">Loading assessment…</main>}><AssessmentWorkspace /></Suspense>;
}
