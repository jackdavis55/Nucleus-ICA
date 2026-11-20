import { Suspense } from "react";
import { Workspace } from "@/components/dashboard/workspace";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default function WorkspacePage() {
  if (!hasSupabaseConfig()) {
    return <main className="min-h-screen bg-[#f3f6f7] px-4 py-16 text-[#172b38]"><section className="mx-auto max-w-2xl rounded-2xl border border-[#dfe7e9] bg-white p-7 shadow-sm"><div className="text-xs font-bold tracking-[.16em] text-[#176b5a]">NUCLEUS JUST CULTURE</div><h1 className="mt-3 text-2xl font-semibold">Connect a Supabase project</h1><p className="mt-3 text-sm leading-6 text-[#687b83]">This workspace now uses Supabase Auth and PostgreSQL. Add the project URL and publishable key to a root-level <code>.env.local</code> file, then apply the committed database migration.</p><pre className="mt-5 overflow-x-auto rounded-xl bg-[#102936] p-4 text-xs leading-6 text-[#e0ecee]">{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key`}</pre><ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#526770]"><li>Copy the variable names from <code>.env.example</code>.</li><li>Run <code>npx supabase link</code> and <code>npx supabase db push</code> after linking your project.</li><li>Create one assessor in Supabase Auth. Public sign-up is disabled.</li></ol><p className="mt-5 rounded-lg bg-[#fff8e8] p-3 text-xs leading-5 text-[#79591c]">Prototype environment only. Use fictional records. Do not enter real personnel, incident or operational data.</p></section></main>;
  }
  return (
    <Suspense fallback={<main className="p-6" role="status">Loading workspace…</main>}>
      <Workspace />
    </Suspense>
  );
}
