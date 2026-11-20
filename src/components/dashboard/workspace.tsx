"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { employeeIdSchema } from "@/lib/employee-id";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Individual = Database["public"]["Tables"]["individuals"]["Row"];
function individualLabel(person: Individual) {
  return [person.display_name, person.role].filter(Boolean).join(" · ");
}

type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
type View = "dashboard" | "assessments" | "individuals" | "incidents";

const individualRoles = ["Director", "Manager", "Technician", "Operator", "Engineer", "Officer"] as const satisfies readonly NonNullable<Individual["role"]>[];
const emptyPerson = { display_name: "", reference_code: "", role: "" };

const personSchema = z.object({
  display_name: z.string().trim().min(1).max(160),
  reference_code: z.string().trim().max(80),
  role: z.union([z.enum(individualRoles), z.literal("")]),
});
const incidentSchema = z.object({ reference: z.string().trim().min(1).max(80), title: z.string().trim().min(1).max(200), occurred_on: z.string(), description: z.string().trim().max(5000), site: z.string().trim().max(200) });

const statusLabel: Record<Assessment["status"], string> = { draft: "Draft", in_progress: "In progress", completed: "Completed", archived: "Archived" };
const fieldClass = "w-full rounded-lg border border-[#d6e1e3] bg-white px-3 py-2.5 text-sm text-[#213b46] outline-none placeholder:text-[#98a9ae] focus:border-[#5e9e8e] focus:ring-2 focus:ring-[#dceee8]";

export function Workspace() {
  const router = useRouter();
  const [client] = useState(() => createClient());
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const initialView = useSearchParams().get("view") === "assessments" ? "assessments" : "dashboard";
  const [view, setView] = useState<View>(initialView);
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [personForm, setPersonForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState(false);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [newPerson, setNewPerson] = useState(emptyPerson);
  const [newIncident, setNewIncident] = useState({ reference: "", title: "", occurred_on: "", description: "", site: "" });
  const [assessmentPick, setAssessmentPick] = useState({ display_name: "", role: "", employee_id: "", incident_title: "" });
  const pendingDraft = useRef<{ name: string; role: Individual["role"]; employeeId: string; incidentTitle: string; incidentId: string; assessmentId: string } | null>(null);

  const load = useCallback(async () => {
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) { setUser(null); return; }
    setUser({ id: authData.user.id, email: authData.user.email });
    const [people, events, cases] = await Promise.all([
      client.from("individuals").select("*").order("display_name"),
      client.from("incidents").select("*").order("created_at", { ascending: false }),
      client.from("assessments").select("*").order("updated_at", { ascending: false }),
    ]);
    if (people.error || events.error || cases.error) {
      setError(people.error?.message ?? events.error?.message ?? cases.error?.message ?? "Could not load workspace records.");
      return;
    }
    setIndividuals(people.data ?? []);
    setIncidents(events.data ?? []);
    setAssessments(cases.data ?? []);
  }, [client]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    function refreshRestoredPage(event: PageTransitionEvent) {
      if (event.persisted) void load();
    }
    window.addEventListener("pageshow", refreshRestoredPage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", refreshRestoredPage);
    };
  }, [load]);

  const individualById = useMemo(() => new Map(individuals.map((item) => [item.id, item])), [individuals]);
  const incidentById = useMemo(() => new Map(incidents.map((item) => [item.id, item])), [incidents]);
  const query = search.trim().toLocaleLowerCase();
  const visiblePeople = individuals.filter((person) => (statusFilter === "all" || person.status === statusFilter) && `${person.display_name} ${person.reference_code ?? ""} ${person.role ?? ""}`.toLocaleLowerCase().includes(query)).sort((a, b) => sortBy === "name" ? a.display_name.localeCompare(b.display_name) : b.created_at.localeCompare(a.created_at));
  const visibleIncidents = incidents.filter((item) => (statusFilter === "all" || item.status === statusFilter) && `${item.reference} ${item.title} ${item.site ?? ""}`.toLocaleLowerCase().includes(query)).sort((a, b) => sortBy === "reference" ? a.reference.localeCompare(b.reference) : (b.occurred_on ?? "").localeCompare(a.occurred_on ?? ""));
  const visibleAssessments = assessments.filter((item) => {
    const person = individualById.get(item.individual_id);
    const incident = incidentById.get(item.incident_id);
    return (statusFilter === "all" || item.status === statusFilter) && `${item.reference} ${person ? individualLabel(person) : ""} ${incident?.title ?? ""} ${incident?.reference ?? ""}`.toLocaleLowerCase().includes(query);
  }).sort((a, b) => sortBy === "reference" ? a.reference.localeCompare(b.reference) : b.updated_at.localeCompare(a.updated_at));

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const { error: authError } = await client.auth.signInWithPassword(signIn);
    setBusy(false);
    if (authError) { setError(authError.message); return; }
    await load();
  }

  async function handleSignOut() { await client.auth.signOut(); setUser(null); setIndividuals([]); setIncidents([]); setAssessments([]); }

  async function archiveRecord(table: "individuals" | "incidents" | "assessments", id: string) {
    const archiveResult = table === "assessments"
      ? await client.rpc("archive_assessment", { p_assessment_id: id })
      : await client.from(table).update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
    const archiveError = archiveResult.error;
    if (archiveError) { setError(archiveError.message); return; }
    setNotice("Record archived. Its assessment history is retained."); await load();
  }

  async function savePerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const parsed = personSchema.safeParse(newPerson);
    if (!parsed.success || !user) { setError(parsed.error?.issues[0]?.message ?? "Sign in before adding a person."); return; }
    setBusy(true);
    const { data: person, error: insertError } = await client.from("individuals").insert({
      owner_id: user.id, display_name: parsed.data.display_name,
      reference_code: parsed.data.reference_code || null, role: parsed.data.role || null,
    }).select("*").single();
    setBusy(false);
    if (insertError || !person) { setError(insertError?.message ?? "Could not save the individual."); return; }
    setIndividuals((current) => [...current, person].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    closePersonForm();
    setNotice("Individual added.");
  }

  function closePersonForm() {
    setPersonForm(false);
    setNewPerson(emptyPerson);
    setError("");
  }

  async function saveIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const parsed = incidentSchema.safeParse(newIncident);
    if (!parsed.success || !user) { setError(parsed.error?.issues[0]?.message ?? "Sign in before adding an event."); return; }
    setBusy(true);
    const { error: insertError } = await client.from("incidents").insert({ owner_id: user.id, reference: parsed.data.reference, title: parsed.data.title, occurred_on: parsed.data.occurred_on || null, description: parsed.data.description || null, site: parsed.data.site || null });
    setBusy(false);
    if (insertError) { setError(insertError.message); return; }
    setIncidentForm(false); setNewIncident({ reference: "", title: "", occurred_on: "", description: "", site: "" }); setNotice("Incident or event added."); await load();
  }

  function closeAssessmentForm() {
    if (busy) return;
    setAssessmentForm(false);
    setAssessmentPick({ display_name: "", role: "", employee_id: "", incident_title: "" });
    pendingDraft.current = null;
    setError("");
  }

  async function startAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const name = personSchema.shape.display_name.safeParse(assessmentPick.display_name);
    const role = personSchema.shape.role.safeParse(assessmentPick.role);
    const incident = incidentSchema.shape.title.safeParse(assessmentPick.incident_title);
    const employeeId = employeeIdSchema.safeParse(assessmentPick.employee_id);
    if (!user || !name.success || !incident.success) {
      setError("Enter a name and an incident or event title to start an assessment.");
      return;
    }

    if (!role.success) {
      setError("Select a role from the list.");
      return;
    }
    if (!employeeId.success) {
      setError("Employee ID must contain exactly six digits.");
      return;
    }
    const individualRole = role.data || null;
    const individualEmployeeId = employeeId.data;

    setBusy(true);
    try {
      const { data: method, error: methodError } = await client.from("methodology_versions")
        .select("id").eq("version", "nucleus-1.0").single();
      if (methodError || !method) {
        setError("The NUCLEUS methodology version is not available. Apply the database migration first.");
        return;
      }
      const previous = pendingDraft.current;
      const samePerson = previous?.name === name.data && previous.role === individualRole &&
        previous.employeeId === individualEmployeeId;
      const sameIncident = previous?.incidentTitle === incident.data;
      const draft = {
        name: name.data,
        role: individualRole,
        employeeId: individualEmployeeId,
        incidentTitle: incident.data,
        incidentId: sameIncident ? previous.incidentId : crypto.randomUUID(),
        assessmentId: samePerson && sameIncident ? previous.assessmentId : crypto.randomUUID(),
      };
      pendingDraft.current = draft;

      // The employee ID identifies the individual across assessments, including retried saves.
      const { error: individualError } = await client.from("individuals").upsert({
        owner_id: user.id, display_name: draft.name, role: draft.role, employee_id: draft.employeeId,
      }, { onConflict: "owner_id,employee_id", ignoreDuplicates: true });
      if (individualError) { setError(individualError.message); return; }

      const { data: individual, error: lookupError } = await client.from("individuals")
        .select("id,display_name,role,status").eq("owner_id", user.id).eq("employee_id", draft.employeeId).single();
      if (lookupError || !individual) { setError("Could not look up the individual by Employee ID."); return; }
      if (individual.status === "archived") { setError("This Employee ID belongs to an archived individual."); return; }
      if (individual.display_name.trim().toLowerCase() !== draft.name.toLowerCase()) {
        setError("This Employee ID is already linked to a different name. Check the name and ID.");
        return;
      }
      if (draft.role && individual.role !== draft.role) {
        setError("The selected role differs from the role on record for this Employee ID. Check the role or leave it unselected to use the recorded role.");
        return;
      }

      const { error: incidentError } = await client.from("incidents").upsert({
        id: draft.incidentId, owner_id: user.id, title: draft.incidentTitle,
        reference: `EVT-${draft.incidentId.toUpperCase()}`,
      }, { onConflict: "id", ignoreDuplicates: true });
      if (incidentError) { setError(incidentError.message); return; }

      const reference = `JC-${new Date().getFullYear()}-${draft.assessmentId.slice(0, 8).toUpperCase()}`;
      const { error: assessmentError } = await client.from("assessments").upsert({
        id: draft.assessmentId, owner_id: user.id, individual_id: individual.id, incident_id: draft.incidentId,
        methodology_version_id: method.id, reference, status: "draft",
      }, { onConflict: "id", ignoreDuplicates: true });
      if (assessmentError) { setError(assessmentError.message); return; }
      router.push(`/assessments/${draft.assessmentId}`);
    } catch {
      setError("Could not start the assessment. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <main className="min-h-screen bg-[#f3f6f7] px-4 py-16 text-[#172b38]"><div className="mx-auto max-w-md rounded-2xl border border-[#dfe7e9] bg-white p-7 shadow-sm"><div className="text-xs font-bold tracking-[.16em] text-[#176b5a]">NUCLEUS JUST CULTURE</div><h1 className="mt-3 text-2xl font-semibold">Assessor sign in</h1><p className="mt-2 text-sm leading-6 text-[#687b83]">Use the provisioned assessor account. Public sign-up is disabled.</p><form onSubmit={handleSignIn} className="mt-6 space-y-4"><label className="block text-sm font-medium">Email<input autoComplete="username" required type="email" className={`${fieldClass} mt-1.5`} value={signIn.email} onChange={(e) => setSignIn({ ...signIn, email: e.target.value })}/></label><label className="block text-sm font-medium">Password<input autoComplete="current-password" required type="password" className={`${fieldClass} mt-1.5`} value={signIn.password} onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}/></label><button disabled={busy} className="w-full rounded-lg bg-[#176b5a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button></form>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<p className="mt-5 rounded-lg bg-[#fff8e8] p-3 text-xs leading-5 text-[#79591c]">Prototype environment: use fictional records only. Do not enter real personnel, incident or operational data.</p></div></main>;

  const navItems: { id: View; label: string }[] = [{ id: "dashboard", label: "Dashboard" }, { id: "assessments", label: "Assessments" }, { id: "individuals", label: "Individuals" }, { id: "incidents", label: "Incidents & events" }];
  return <main className="min-h-screen bg-[#f3f6f7] text-[#172b38]"><header className="sticky top-0 z-10 border-b border-white/10 bg-[#102936] text-white"><div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5"><Link href="/" aria-label="NUCLEUS home" className="mr-3 flex min-w-0 items-center gap-3 rounded-lg hover:text-[#c7ece3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#72c5b2] text-[#102936] shadow-inner"><Layers3 className="size-5" strokeWidth={2.4} aria-hidden="true" /></span>
      <span className="min-w-0">
        <span className="block text-sm/tight font-bold tracking-[.12em] sm:text-[1.05rem]/tight">Nucleus - Individual Culpability Assessment</span>
        <span className="block text-[10px] text-[#b2c5cc]">ASSESSOR WORKSPACE · FICTIONAL DATA ONLY</span>
      </span>
    </Link><div className="flex items-center gap-3"><span className="hidden text-xs text-[#cfdbdf] sm:block">{user.email}</span><button onClick={handleSignOut} className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Sign out</button></div></div></header>
    <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="border-b border-[#dce4e7] bg-white px-4 py-5 lg:min-h-[calc(100vh-64px)] lg:border-r lg:border-b-0"><div className="mb-3 px-2 text-[10px] font-bold tracking-[.13em] text-[#81949a]">WORKSPACE</div><nav className="space-y-1" aria-label="Workspace">{navItems.map((item) => <button key={item.id} onClick={() => { setView(item.id); setSearch(""); setStatusFilter("all"); setSortBy(item.id === "individuals" ? "name" : item.id === "incidents" ? "date" : "recent"); setNotice(""); }} aria-current={view === item.id ? "page" : undefined} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${view === item.id ? "bg-[#e8f4f1] text-[#176b5a]" : "text-[#647780] hover:bg-[#f4f7f7]"}`}>{item.label}</button>)}</nav><p className="mt-7 rounded-lg border border-[#dfe9e8] bg-[#f7faf9] p-3 text-xs leading-5 text-[#627d77]">Every assessment concerns one individual and one event. Review evidence and uncertainty before recording provisional interpretations.</p></aside>
      <section className="min-w-0 px-4 py-7 sm:px-7 lg:px-10"><div className="mx-auto max-w-[1100px]"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold tracking-[.13em] text-[#81949a]">NUCLEUS REGISTERS</div><h1 className="mt-1 text-2xl font-semibold text-[#18313d]">{view === "dashboard" ? "Dashboard" : view === "assessments" ? "Assessment register" : view === "individuals" ? "Individuals register" : "Incidents & events register"}</h1><p className="mt-1 text-sm text-[#71828a]">Manage fictional demonstration records and continue draft assessments.</p></div><div className="flex flex-wrap gap-2">{(view === "dashboard" || view === "assessments") && <>
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setView("assessments"); }}
            className="rounded-lg border border-[#cfe1dc] bg-white px-4 py-2.5 text-sm font-semibold text-[#176b5a] hover:bg-[#f4faf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b5a]">
            {view === "assessments" ? "All assessments" : "Back to assessments"}
          </button>
          <button type="button" onClick={() => setAssessmentForm(true)} className="rounded-lg bg-[#176b5a] px-4 py-2.5 text-sm font-semibold text-white">Start assessment</button>
        </>}{view === "individuals" && <button onClick={() => setPersonForm(true)} className="rounded-lg bg-[#176b5a] px-4 py-2.5 text-sm font-semibold text-white">Add individual</button>}{view === "incidents" && <button onClick={() => setIncidentForm(true)} className="rounded-lg bg-[#176b5a] px-4 py-2.5 text-sm font-semibold text-white">Add incident or event</button>}</div></div>
        {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}<button className="float-right" onClick={() => setError("")}>Dismiss</button></div>}{notice && <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
        {view === "dashboard" && <><div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Assessments", assessments.length], ["Individuals", individuals.filter((p) => p.status === "active").length], ["Incidents & events", incidents.length]].map(([label, value]) => <div key={label} className="rounded-xl border border-[#dfe7e9] bg-white p-5"><div className="text-xs text-[#72848b]">{label}</div><div className="mt-2 text-3xl font-semibold text-[#18313d]">{value}</div></div>)}</div><div className="mt-5 rounded-xl border border-[#dfe7e9] bg-white"><div className="flex items-center justify-between border-b border-[#edf1f2] p-5"><div><h2 className="font-semibold">Recent assessments</h2><p className="mt-1 text-xs text-[#819097]">Resume a draft or review a completed record.</p></div><button className="text-sm font-medium text-[#176b5a]" onClick={() => setView("assessments")}>View all</button></div><AssessmentRows assessments={assessments.slice(0, 6)} individualById={individualById} incidentById={incidentById} onOpen={(id) => router.push(`/assessments/${id}`)} onArchive={(id) => archiveRecord("assessments", id)}/></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><RegisterPreview title="Recent individuals" rows={individuals.slice(0, 4).map((p) => [individualLabel(p), p.reference_code ?? "No reference", `${assessments.filter((a) => a.individual_id === p.id).length} assessments`])} onView={() => setView("individuals")}/><RegisterPreview title="Recent incidents & events" rows={incidents.slice(0, 4).map((e) => [e.reference, e.title, `${assessments.filter((a) => a.incident_id === e.id).length} assessments`])} onView={() => setView("incidents")}/></div></>}
        {view !== "dashboard" && <><div className="mt-6 flex flex-wrap items-center gap-3"><input value={search} onChange={(e) => setSearch(e.target.value)} className={`${fieldClass} max-w-md`} type="search" placeholder={`Search ${view}…`} aria-label={`Search ${view}`}/><select className={`${fieldClass} max-w-[180px]`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{(view === "individuals" ? ["active", "archived"] : view === "incidents" ? ["open", "under_review", "closed", "archived"] : ["draft", "in_progress", "completed", "archived"]).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><select className={`${fieldClass} max-w-[190px]`} value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort records"><option value={view === "individuals" ? "name" : view === "incidents" ? "date" : "recent"}>{view === "individuals" ? "Name A–Z" : view === "incidents" ? "Event date, newest" : "Recently updated"}</option><option value={view === "individuals" ? "recent" : "reference"}>{view === "individuals" ? "Recently added" : "Reference A–Z"}</option></select></div><div className="mt-4 overflow-hidden rounded-xl border border-[#dfe7e9] bg-white"><div className="overflow-x-auto">{view === "assessments" ? <AssessmentRows assessments={visibleAssessments} individualById={individualById} incidentById={incidentById} onOpen={(id) => router.push(`/assessments/${id}`)} onArchive={(id) => archiveRecord("assessments", id)}/> : view === "individuals" ? <table className="w-full text-left text-sm"><thead className="bg-[#f7faf9] text-xs text-[#71828a]"><tr><th className="px-5 py-3 font-medium">Individual</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Reference</th><th className="px-5 py-3 font-medium">Assessments</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Action</th></tr></thead><tbody>{visiblePeople.map((p) => <tr key={p.id} className="border-t border-[#edf1f2]"><td className="px-5 py-3.5 font-medium">{p.display_name}</td><td className="px-5 py-3.5 text-[#687b83]">{p.role ?? "—"}</td><td className="px-5 py-3.5 text-[#687b83]">{p.reference_code || "—"}</td><td className="px-5 py-3.5"><button onClick={() => { setView("assessments"); setSearch(p.display_name); }} className="text-[#176b5a]">{assessments.filter((a) => a.individual_id === p.id).length} · View</button></td><td className="px-5 py-3.5"><StatusBadge status={p.status}/></td><td className="px-5 py-3.5">{p.status === "active" && <button onClick={() => archiveRecord("individuals", p.id)} className="text-xs text-[#7b5b3e]">Archive</button>}</td></tr>)}</tbody></table> : <table className="w-full text-left text-sm"><thead className="bg-[#f7faf9] text-xs text-[#71828a]"><tr><th className="px-5 py-3 font-medium">Reference</th><th className="px-5 py-3 font-medium">Incident / event</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Individuals assessed</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Action</th></tr></thead><tbody>{visibleIncidents.map((item) => <tr key={item.id} className="border-t border-[#edf1f2]"><td className="px-5 py-3.5 font-semibold">{item.reference}</td><td className="px-5 py-3.5">{item.title}</td><td className="px-5 py-3.5 text-[#687b83]">{item.occurred_on ?? "Unknown"}</td><td className="px-5 py-3.5"><button onClick={() => { setView("assessments"); setSearch(item.reference); }} className="text-[#176b5a]">{assessments.filter((a) => a.incident_id === item.id).length} · View</button></td><td className="px-5 py-3.5"><StatusBadge status={item.status}/></td><td className="px-5 py-3.5">{item.status !== "archived" && <button onClick={() => archiveRecord("incidents", item.id)} className="text-xs text-[#7b5b3e]">Archive</button>}</td></tr>)}</tbody></table>}</div></div></>}
      </div></section></div>
    {personForm && <Modal title="Add an individual" onClose={() => { if (!busy) closePersonForm(); }}><form className="space-y-4" onSubmit={savePerson}><label className="block text-sm font-medium">Display name<input className={`${fieldClass} mt-1.5`} required maxLength={160} value={newPerson.display_name} onChange={(e) => setNewPerson({ ...newPerson, display_name: e.target.value })}/></label><label className="block text-sm font-medium">Reference code <span className="font-normal text-[#819097]">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={80} value={newPerson.reference_code} onChange={(e) => setNewPerson({ ...newPerson, reference_code: e.target.value })}/></label>
      <label className="block text-sm font-medium">
        Role <span className="font-normal text-[#819097]">(optional)</span>
        <select className={`${fieldClass} mt-1.5`} value={newPerson.role} onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}>
          <option value="">Select a role</option>
          {individualRoles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
      <p className="text-xs leading-5 text-[#7b8b91]">Store only information needed to distinguish this record. Do not add medical or sensitive personal details.</p>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}<ModalButtons busy={busy} onCancel={() => { if (!busy) closePersonForm(); }} label="Save individual"/></form></Modal>}
    {incidentForm && <Modal title="Add an incident or event" onClose={() => setIncidentForm(false)}><form className="space-y-4" onSubmit={saveIncident}><label className="block text-sm font-medium">Incident reference<input className={`${fieldClass} mt-1.5`} required maxLength={80} value={newIncident.reference} onChange={(e) => setNewIncident({ ...newIncident, reference: e.target.value })}/></label><label className="block text-sm font-medium">Title<input className={`${fieldClass} mt-1.5`} required maxLength={200} value={newIncident.title} onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}/></label><label className="block text-sm font-medium">Date <span className="font-normal text-[#819097]">(optional)</span><input type="date" className={`${fieldClass} mt-1.5`} value={newIncident.occurred_on} onChange={(e) => setNewIncident({ ...newIncident, occurred_on: e.target.value })}/></label><label className="block text-sm font-medium">Site or location <span className="font-normal text-[#819097]">(optional)</span><input className={`${fieldClass} mt-1.5`} maxLength={200} value={newIncident.site} onChange={(e) => setNewIncident({ ...newIncident, site: e.target.value })}/></label><label className="block text-sm font-medium">Description <span className="font-normal text-[#819097]">(optional)</span><textarea className={`${fieldClass} mt-1.5 min-h-20`} maxLength={5000} value={newIncident.description} onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}/></label><ModalButtons busy={busy} onCancel={() => setIncidentForm(false)} label="Save event"/></form></Modal>}
    {assessmentForm && <Modal title="Start an assessment" onClose={closeAssessmentForm}>
      <form className="space-y-4" onSubmit={startAssessment}>
        <label className="block text-sm font-medium">
          Individual’s name
          <input required maxLength={160} disabled={busy} className={`${fieldClass} mt-1.5`}
            value={assessmentPick.display_name} onChange={(event) => setAssessmentPick({ ...assessmentPick, display_name: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Role
          <select disabled={busy} className={`${fieldClass} mt-1.5`} value={assessmentPick.role}
            onChange={(event) => setAssessmentPick({ ...assessmentPick, role: event.target.value })}>
            <option value="">Not recorded</option>
            {individualRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Employee ID <span className="font-normal text-[#71828a]">(six digits)</span>
          <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} disabled={busy} className={`${fieldClass} mt-1.5`}
            value={assessmentPick.employee_id} onChange={(event) => setAssessmentPick({ ...assessmentPick, employee_id: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Incident or event
          <input required maxLength={200} disabled={busy} className={`${fieldClass} mt-1.5`}
            value={assessmentPick.incident_title} onChange={(event) => setAssessmentPick({ ...assessmentPick, incident_title: event.target.value })} />
        </label>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <ModalButtons busy={busy} onCancel={closeAssessmentForm} label="Create draft" />
      </form>
    </Modal>}
  </main>;
}

function AssessmentRows({ assessments, individualById, incidentById, onOpen, onArchive }: { assessments: Assessment[]; individualById: Map<string, Individual>; incidentById: Map<string, Incident>; onOpen: (id: string) => void; onArchive: (id: string) => void }) {
  if (!assessments.length) return <p className="p-6 text-sm text-[#819097]">No matching assessments yet.</p>;
  return <table className="w-full text-left text-sm"><thead className="bg-[#f7faf9] text-xs text-[#71828a]"><tr><th className="px-5 py-3 font-medium">Assessment</th><th className="px-5 py-3 font-medium">Individual</th><th className="px-5 py-3 font-medium">Incident / event</th><th className="px-5 py-3 font-medium">Updated</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Action</th></tr></thead><tbody>{assessments.map((item) => {
    const person = individualById.get(item.individual_id);
    return <tr key={item.id} className="border-t border-[#edf1f2]"><td className="px-5 py-3.5"><button onClick={() => onOpen(item.id)} className="font-semibold text-[#176b5a] hover:underline">{item.reference}</button></td><td className="px-5 py-3.5">{person ? individualLabel(person) : "Archived individual"}</td><td className="px-5 py-3.5">{incidentById.get(item.incident_id)?.title ?? "Archived event"}</td><td className="px-5 py-3.5 text-xs text-[#71828a]">{new Date(item.updated_at).toLocaleDateString()}</td><td className="px-5 py-3.5"><StatusBadge status={item.status}/></td><td className="px-5 py-3.5">{item.status !== "archived" && <button onClick={() => onArchive(item.id)} className="text-xs text-[#7b5b3e]">Archive</button>}</td></tr>;
  })}</tbody></table>;
}
function StatusBadge({ status }: { status: string }) { return <span className="inline-flex rounded-full border border-[#e5d9bd] bg-[#fff8e8] px-2.5 py-1 text-[11px] font-medium text-[#87631e]">{statusLabel[status as Assessment["status"]] ?? status.replaceAll("_", " ")}</span>; }
function RegisterPreview({ title, rows, onView }: { title: string; rows: string[][]; onView: () => void }) { return <div className="rounded-xl border border-[#dfe7e9] bg-white p-5"><div className="flex justify-between"><h2 className="font-semibold">{title}</h2><button onClick={onView} className="text-sm text-[#176b5a]">View all</button></div>{rows.length ? rows.map(([a,b,c]) => <div key={a} className="mt-4 flex justify-between gap-3 border-t border-[#edf1f2] pt-3 text-sm"><div className="min-w-0"><div className="truncate font-medium">{a}</div><div className="mt-1 truncate text-xs text-[#819097]">{b}</div></div><span className="shrink-0 text-xs text-[#71828a]">{c}</span></div>) : <p className="mt-4 text-sm text-[#819097]">No records yet.</p>}</div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0c202a]/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 id="modal-title" className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded px-2 py-1 text-[#71828a] hover:bg-[#f2f6f6]">×</button></div>{children}</section></div>; }
function ModalButtons({ busy, onCancel, label }: { busy: boolean; onCancel: () => void; label: string }) { return <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="rounded-lg border border-[#d6e1e3] px-4 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-lg bg-[#176b5a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : label}</button></div>; }
