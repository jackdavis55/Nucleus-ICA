import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileSearch,
  GitBranch,
  Scale,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

const assessmentAreas = [
  {
    number: "01",
    title: "The action and the person’s understanding",
    description:
      "Establish what happened, the person’s role, what they intended, and what they knew or reasonably understood at the time.",
    icon: FileSearch,
    topics: ["Event and chronology", "Intention and outcome", "Knowledge and competence"],
  },
  {
    number: "02",
    title: "The conditions around the work",
    description:
      "Examine procedures, task demands, resources, supervision, communication, barriers and organisational conditions that may have influenced events.",
    icon: Waypoints,
    topics: ["Procedures and expectations", "Human and task factors", "Organisational contribution"],
  },
  {
    number: "03",
    title: "Choice, evidence and response",
    description:
      "Consider realistic choices and control, test interpretations against supporting and challenging evidence, and record a provisional response for human review.",
    icon: Scale,
    topics: ["Volition and personal control", "Causal contribution", "Learning and accountability"],
  },
];

const principles = [
  {
    title: "Evidence before assumptions",
    text: "Keep recorded facts, individual explanations and assessor interpretations distinct. Make gaps and conflicting information visible.",
  },
  {
    title: "Context before conclusions",
    text: "Consider the way work was designed, equipped, supervised and expected to be done alongside the individual’s actions.",
  },
  {
    title: "Human judgement stays with the assessor",
    text: "NUCLEUS structures reasoning. It does not calculate culpability, decide discipline or make legal findings.",
  },
];

const workflow = [
  ["Record the event", "Describe the incident and the specific action or omission being considered."],
  ["Explore the circumstances", "Work through relevant questions and record explanations, evidence and uncertainty."],
  ["Review the reasoning", "Check that interpretations are balanced, traceable and considered alongside wider system factors."],
  ["Document a provisional view", "Set out limitations, recommendations and the assessor’s reasoned conclusion for review."],
];

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f6] text-[#19313c]">
      <header className="relative z-10 border-b border-white/10 bg-[#102936] text-white">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 rounded-sm focus-visible:outline-white">
            <span className="flex size-9 items-center justify-center rounded-xl border border-[#6fa897]/40 bg-[#176b5a] text-sm font-bold tracking-[.12em]">N</span>
            <span className="text-[1.05rem]/tight font-bold">Nucleus - Individual Culpability Assessment</span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-5">
            <a href="#approach" className="hidden text-xs text-[#c2d0d3] hover:text-white sm:inline">Our approach</a>
            <a href="#how-it-works" className="hidden text-xs text-[#c2d0d3] hover:text-white sm:inline">How it works</a>
            <Link href="/workspace" className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-semibold text-[#173d36] transition hover:bg-[#e9f3f0] sm:px-4">
              Assessor sign in <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#102936] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-48 -top-64 size-[620px] rounded-full border border-white/[0.07]" />
          <div className="absolute -right-24 -top-40 size-[470px] rounded-full border border-white/[0.08]" />
          <div className="absolute right-[-2rem] top-[-7rem] size-[320px] rounded-full bg-[#176b5a]/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#79a99c]/40 to-transparent" />
        </div>
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)] lg:gap-16 lg:pb-24 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8db9ad]/40 bg-white/[0.1] px-4 py-2 text-xs font-bold uppercase tracking-[.15em] text-white shadow-sm shadow-black/10 sm:text-sm">
              <span className="size-2 rounded-full bg-[#76b39d]" /> Individual Culpability Assessment
            </div>
            <h1 className="max-w-3xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl lg:text-[3.75rem]">
              A fair Just Culture starts with understanding.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#c3d0d4] sm:text-lg sm:leading-8">
              The purpose of this application is to provide a consistent, informed and fair approach in the assessment of an individual&apos;s culpability within the context of their impact within an event, incident or exhibited behavior.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#c3d0d4] sm:text-lg sm:leading-8">
              The goal of a <strong className="font-semibold text-white">Just Culture</strong> is to create a fair and supportive environment where people feel safe to report mistakes, incidents and concerns without fear of unfair blame or punishment. It promotes learning and accountability through <strong className="font-semibold text-white">just accountability</strong>, ensuring that those who act negligently face appropriate consequences, while those who make genuine mistakes due to human error, error traps or wider organisational factors are treated fairly and with appropriate consideration. People should feel confident that their individual culpability is properly assessed and all relevant detail and context is considered before being judged.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/workspace" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#79b39e] px-5 text-sm font-semibold text-[#102e2c] shadow-lg shadow-black/10 transition hover:bg-[#94c5b3]">
                Enter assessor workspace <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href="#approach" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/[0.07]">
                Explore the approach <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-5 text-[11px] text-[#91a7ad]">Prototype for fictional demonstration records. Public registration is disabled.</p>
          </div>

          <div className="relative mx-auto w-full max-w-[430px] lg:ml-auto">
            <div className="absolute -inset-4 rounded-[2rem] border border-white/[0.08]" aria-hidden="true" />
            <div className="relative rounded-2xl border border-white/[0.12] bg-[#f8fbfa] p-5 text-[#19313c] shadow-2xl shadow-black/25 sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#e4ebea] pb-4">
                <div><div className="text-[9px] font-bold tracking-[.16em] text-[#71858b]">A FAIR ASSESSMENT STARTS WITH</div><div className="mt-1 text-lg font-semibold tracking-tight">The full picture</div></div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e6f2ee] text-[#287361]"><Compass className="size-4" aria-hidden="true" /></span>
              </div>
              <div className="space-y-3 py-4">
                {[
                  ["What happened", "Actions, chronology and available information"],
                  ["What shaped the work", "Procedures, conditions and organisational context"],
                  ["What the evidence shows", "Support, challenge, uncertainty and gaps"],
                ].map(([title, description], index) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-[#e7eeec] bg-white p-3.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edf5f2] text-[10px] font-bold text-[#367b69]">0{index + 1}</span>
                    <div><div className="text-xs font-semibold text-[#28434d]">{title}</div><div className="mt-1 text-[10px] leading-4 text-[#71848a]">{description}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-[#eef5f2] p-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#327663]" aria-hidden="true" />
                <p className="text-[10px] leading-4 text-[#4d6a65]">Conclusions remain provisional and reviewable. The assessor remains responsible for the assessment.</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-xl border border-[#d9e8e2] bg-white px-3.5 py-2.5 text-[10px] font-medium text-[#4c6769] shadow-lg sm:flex">
              <CheckCircle2 className="size-4 text-[#438b72]" aria-hidden="true" /> Evidence and uncertainty stay visible
            </div>
          </div>
        </div>
      </section>

      <section id="approach" className="scroll-mt-8 px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="max-w-2xl">
            <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#39806d]">THE PURPOSE OF NUCLEUS</div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] text-[#18333e] sm:text-4xl">Understand the circumstances before reaching a conclusion.</h2>
            <p className="mt-4 text-sm leading-7 text-[#647980]">In high-hazard work, an individual’s actions do not happen in isolation. A fair assessment considers the action, the person’s understanding, and the system in which the work took place.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {assessmentAreas.map(({ number, title, description, icon: Icon, topics }) => (
              <article key={number} className="group rounded-2xl border border-[#dfe8e6] bg-white p-5 shadow-[0_8px_28px_rgba(32,62,71,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(32,62,71,0.08)] sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.14em] text-[#8a9b9d]">{number} / AREAS OF INQUIRY</span><span className="flex size-9 items-center justify-center rounded-xl bg-[#edf5f2] text-[#347b67]"><Icon className="size-4" aria-hidden="true" /></span></div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-[#203b46]">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#71838a]">{description}</p>
                <ul className="mt-5 space-y-2 border-t border-[#edf1f0] pt-4">
                  {topics.map((topic) => <li key={topic} className="flex items-center gap-2 text-[11px] font-medium text-[#526a70]"><span className="size-1 rounded-full bg-[#68a28e]" />{topic}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-[#7c8d91]"><GitBranch className="mt-0.5 size-3.5 shrink-0 text-[#4d8b78]" aria-hidden="true" />These are areas of consideration, not a scoring model. Their sequence and relevance depend on the assessment and its evidence.</p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 border-y border-[#e1e9e7] bg-[#edf3f1] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#39806d]">HOW TO USE NUCLEUS</div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] text-[#18333e]">A structured process. A human decision.</h2>
            <p className="mt-4 text-sm leading-7 text-[#647980]">Work progressively through relevant questions. Capture what is known, what remains unclear and why an interpretation is being considered.</p>
            <div className="mt-6 rounded-xl border border-[#d7e5e0] bg-white p-4">
              <BookOpenCheck className="size-5 text-[#377c68]" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-[#365451]">Keep the reasoning traceable</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#71838a]">Record evidence that supports an interpretation and evidence that challenges it. Unknown, disputed and unavailable information should remain visible.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {workflow.map(([title, text], index) => (
              <article key={title} className="rounded-2xl border border-[#dfe8e6] bg-white p-5 sm:p-6">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#e8f3ef] text-xs font-bold text-[#367b69]">{index + 1}</div>
                <h3 className="mt-4 text-sm font-semibold text-[#29444e]">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#71838a]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
            <div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#39806d]">A BALANCED APPROACH</div><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] text-[#18333e]">Describe the behaviour. Consider the response separately.</h2></div>
            <p className="max-w-2xl text-sm leading-7 text-[#647980]">NUCLEUS reflects distinct strands of Just Culture and human-factors thinking, including the work of James Reason and Sidney Dekker. These ideas inform prompts for assessment; the application does not reproduce one author’s complete model or decide a finding for the assessor.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#dfe8e6] bg-white p-6 sm:p-7">
              <div className="text-[9px] font-bold uppercase tracking-[.15em] text-[#578679]">HUMAN PERFORMANCE</div>
              <h3 className="mt-2 text-lg font-semibold text-[#29444e]">What kind of action occurred?</h3>
              <p className="mt-2 text-xs leading-6 text-[#71838a]">Consider whether the behaviour is best described as a slip, lapse, mistake or violation, using the evidence and operating context.</p>
              <div className="mt-5 flex flex-wrap gap-2">{["Slip", "Lapse", "Mistake", "Violation"].map((label) => <span key={label} className="rounded-full border border-[#e3ece9] bg-[#f5f9f7] px-3 py-1.5 text-[10px] font-medium text-[#526c69]">{label}</span>)}</div>
            </article>
            <article className="rounded-2xl border border-[#dfe8e6] bg-white p-6 sm:p-7">
              <div className="text-[9px] font-bold uppercase tracking-[.15em] text-[#a77d3c]">JUST CULTURE RESPONSE</div>
              <h3 className="mt-2 text-lg font-semibold text-[#29444e]">What response may be appropriate?</h3>
              <p className="mt-2 text-xs leading-6 text-[#71838a]">Consider learning, support, system improvement or further accountability review. A behaviour label alone does not settle the response.</p>
              <div className="mt-5 flex flex-wrap gap-2">{["Human error", "At-risk behaviour", "Possible reckless behaviour"].map((label) => <span key={label} className="rounded-full border border-[#eee6d8] bg-[#fcf9f2] px-3 py-1.5 text-[10px] font-medium text-[#806842]">{label}</span>)}</div>
            </article>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[#7c8d91]">A violation does not automatically mean reckless behaviour. Deliberate action alone does not establish culpability.</p>
        </div>
      </section>

      <section className="border-y border-[#e1e9e7] bg-white px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="max-w-2xl"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#39806d]">PRINCIPLES IN PRACTICE</div><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] text-[#18333e]">Designed to make fair reasoning visible.</h2></div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {principles.map((principle) => <article key={principle.title} className="rounded-xl bg-[#f5f8f7] p-5 sm:p-6"><div className="flex size-8 items-center justify-center rounded-lg bg-white text-[#44806f] shadow-sm"><ClipboardCheck className="size-4" aria-hidden="true" /></div><h3 className="mt-4 text-sm font-semibold text-[#2c4851]">{principle.title}</h3><p className="mt-2 text-xs leading-6 text-[#71838a]">{principle.text}</p></article>)}
          </div>
          <div className="mt-6 grid gap-4 rounded-2xl border border-[#e4e9e7] bg-[#fbfcfb] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div><h3 className="text-sm font-semibold text-[#29444e]">The assessor remains accountable for the assessment</h3><p className="mt-2 max-w-3xl text-xs leading-6 text-[#71838a]">The assessor is responsible for the quality and relevance of the information, considering alternative explanations, giving the individual’s account appropriate consideration, and qualifying conclusions where evidence is limited. Any employment, operational or regulatory decision belongs with the authorised decision-maker.</p></div>
            <Scale className="hidden size-8 text-[#6c9589] sm:block" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-5 rounded-2xl border border-[#e4d9bd] bg-[#fffaf0] p-5 sm:flex-row sm:items-start sm:p-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f5e9cb] text-[#906b2d]"><ShieldCheck className="size-4" aria-hidden="true" /></div>
          <div><h2 className="text-sm font-semibold text-[#66542f]">Prototype data boundary</h2><p className="mt-1.5 text-xs leading-6 text-[#796b55]">This development prototype is for fictional demonstration records only. Do not enter real personnel, employment, incident, plant, security-sensitive, medical or operationally sensitive information. The application is not a determination of legal or regulatory responsibility and has not been approved for operational use.</p></div>
        </div>
      </section>

      <footer className="bg-[#102936] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="text-xs font-bold tracking-[.14em]">NUCLEUS · JUST CULTURE ASSESSMENT</div><p className="mt-2 text-[11px] text-[#9fb2b8]">Understand the event. Understand the context. Support meaningful improvement.</p></div>
          <Link href="/workspace" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#79b39e] px-4 text-xs font-semibold text-[#102e2c] transition hover:bg-[#94c5b3] sm:self-auto">Go to assessor workspace <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </footer>
    </main>
  );
}
