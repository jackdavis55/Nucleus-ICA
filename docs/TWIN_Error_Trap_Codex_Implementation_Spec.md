# TWIN Error-Trap Assessment — Codex Implementation Specification

**Target:** Existing culpability assessment application  
**Feature:** Embedded, space-efficient TWIN error-trap assessment area  
**Status:** Implementation specification for Codex in VS Code  
**Scope:** Full reference library, selection, evidence/elaboration, persistence, and incident report integration

> **Codex instruction:** Inspect the repository before modifying code. Implement this as a feature inside the **existing incident/culpability assessment workflow**, not as a standalone application. Reuse the application's framework, design system, data access layer, validation patterns, authentication, testing conventions and existing incident identifiers. Do not replace or redesign unrelated screens. Where this document describes a conceptual API or schema, adapt it to the actual project.

## 1. Purpose and boundaries

Investigators must be able to identify TWIN human-performance error traps relevant to an incident, select multiple traps from the complete reference library, and explain with incident-specific evidence **how each selected trap was present and whether/how it contributed**. The interaction must fit in a restricted-width existing assessment panel.

TWIN means:

- **T — Task Demands:** Requirements and complexity of the task.
- **W — Work Environment:** Conditions of the workplace, equipment, team and organisation.
- **I — Individual Capabilities:** Relevant knowledge, skills, experience and fitness for task.
- **N — Human Nature:** Common cognitive, attentional and behavioural tendencies.

**Important:** An error trap is a condition or precursor, not proof of error, negligence or blame. The TWIN assessment is evidence for the wider investigation; it must **not automatically calculate culpability or imply individual fault**. Human-nature and individual-capability labels must be used neutrally, with evidence rather than speculation.

### Source and terminology integrity

This file combines the **eight-per-category core TWIN matrix** and a broader **extended working reference** discussed earlier. The extended list is a practical catalogue for implementation, **not a verified verbatim transcription of a particular INPO manual edition**. Some extended items are overlapping or modernised descriptions and must be reviewed by the organisation's human-performance subject-matter expert before being presented as authoritative INPO wording. Preserve the source tier (`core` versus `extended`) and do not claim the entire extended catalogue is an official INPO list.

Reference documents to verify against the organisation's approved edition:

- DOE-HDBK-1028-2009, *Human Performance Improvement Handbook*, Vol. 1, especially the error-precursor attachment.
- DOE-HDBK-1208-2012, *Accident and Operational Safety Analysis*, Vol. I, Figure 1-3 (core TWIN matrix).
- Applicable organisation-approved INPO human-performance manual and revision.

## 2. Required embedded UX

Add a section titled **“Contributing Error Traps (TWIN)”** within the existing incident assessment / culpability workflow. It should behave like this:

```text
┌────────────────────────────────────────────────────┐
│ Contributing Error Traps (TWIN)     3 selected     │
│ [ Search error traps...                        ]   │
│                                                    │
│ ▾ T  Task Demands                    2 selected    │
│   ☑ Time pressure                                  │
│   ☑ Unclear / confusing procedures                 │
│   ☐ High workload                                  │
│   ...                                              │
│ ▸ W  Work Environment                1 selected    │
│ ▸ I  Individual Capabilities         0 selected    │
│ ▸ N  Human Nature                    0 selected    │
│                                                    │
│ Selected factors — elaborate                       │
│ ▾ Time pressure                         [Remove]   │
│   Definition: ...                                  │
│   [How did this contribute?                   ]    │
│   [Evidence / references                      ]    │
│   [Contribution: Undetermined ▼]                  │
│ ▸ Distractions / interruptions                     │
│ ▸ Unclear / confusing procedures                   │
└────────────────────────────────────────────────────┘
```

The diagram is conceptual, not a pixel-perfect UI requirement.

### 2.0 Colourful interactive TWIN square selector (required)

**Include the original colourful TWIN squares concept, adapted for the narrow existing incident panel.** Render **four compact, equal-sized, clickable square tiles** in one responsive row immediately beneath the “Contributing Error Traps (TWIN)” heading and above the search/list. They are the **primary category navigation**, not decorative graphics and not a separate dashboard.

| Tile | Full category | Suggested light background | Suggested dark foreground |
|---|---|---|---|
| **T** | Task Demands | `#DCEBFA` | `#174B80` |
| **W** | Work Environment | `#DDF0E4` | `#205C3B` |
| **I** | Individual Capabilities | `#FCE9D7` | `#874A19` |
| **N** | Human Nature | `#EDE3F8` | `#603D88` |

**Visual sketch (within the existing Error Trap Assessment panel):**

```text
┌──────────────────────────────────────────────┐
│ Contributing Error Traps (TWIN)  3 selected │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │   T    │ │   W    │ │   I    │ │   N    │ │
│ │ Task   │ │ Work   │ │Individual││ Nature │ │
│ │   2    │ │   1    │ │   0    │ │   0    │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ │
│ [ Search error traps...                   ] │
│ ▾ T — Task Demands                2 selected│
│   ☑ Time pressure                           │
│   ☑ Unclear procedures                      │
│   ☐ High workload                           │
│ Selected factors — elaborate                │
│ ▾ Time pressure                   [Remove]  │
│   [Explain contribution...               ]  │
└──────────────────────────────────────────────┘
```

**Interaction contract:**

- Each tile is a real accessible button (or equivalent native control). Clicking **T**, **W**, **I** or **N** opens/focuses the corresponding category list **within the same panel**, and closes the previously open category. Clicking the currently active tile may collapse it; match the accordion's state rather than creating a second independent selection state.
- Display the **large initial**, a **short accessible category label**, and a **live count of selected traps** on each tile. Use the full category name in a tooltip/accessible label where the short visible label is abbreviated.
- Show the active tile using a **clear border/focus ring/selected state** in addition to its colour. The four distinct pastel colours remain recognisable when inactive; do not colour the entire incident screen.
- Selection checkboxes update both the tile count and category-row count instantly. Tile count is computed from selected trap IDs and is never stored separately.
- Keep the four squares small and aligned: prefer CSS grid `repeat(4, minmax(0, 1fr))`, a modest aspect ratio near `1 / 1`, short labels, and no horizontal scrolling. At exceptionally narrow widths, allow a 2 × 2 grid rather than unreadably tiny tiles. Long labels belong in accessible text and the expanded category heading.
- Use existing theme tokens and component primitives where possible. Treat the hex colours above as **reference palette values**; adjust for contrast, dark mode and the host application's design system. No image assets or icon packages are required.
- Search and the four tile buttons must coexist: typing a search term filters matches across all TWIN categories, while clicking a tile scopes or focuses the corresponding results. Clearing search returns to the selected tile's expanded category.
- Do **not** render a second large TWIN tile panel elsewhere. The tile strip is the compact navigation header for the existing category list and selected-factor elaboration workflow.
- Persist only incident selections and their notes/status; active tile, search query and accordion expansion are transient UI state unless the existing app already persists UI preferences.

**Acceptance checks specific to the squares:** four correctly coloured tiles are visible; they fit within the existing panel; keyboard users can activate each; clicking each reveals the correct category; selected counts update immediately; selected state survives category changes; dark mode/contrast remain usable; and the tiles do not cause a new route, modal or page.

### 2.1 Category accordions

- Show four category rows in fixed order: **T, W, I, N**, controlled by the colourful TWIN square selector above; each row displays its full category name, selected count, and expand/collapse indicator. Keep tiles and rows synchronised.
- Default to **all collapsed** on revisiting an existing incident; optionally open T on a new empty assessment if that matches existing UI conventions.
- Only one category needs to be expanded at once (prefer single-open to conserve height).
- Within an expanded category, render selectable checkboxes with readable short labels.
- Search across **all four categories**. When search is active, show only matching traps, grouped by T/W/I/N, without losing selected state; provide a clear-search action and a useful empty result message.
- Avoid rendering the entire reference list at once when collapsed. Support keyboard navigation and screen readers.
- Counts are derived from current selections, not separately stored.

### 2.2 Selection behaviour

- Allow **zero, one or many** traps, including multiple traps from the same category.
- Selecting a trap immediately adds a corresponding card/row in **Selected factors — elaborate**.
- Unselecting/removing a trap should avoid silent evidence loss: if it has saved notes, request confirmation or support undo according to the app's patterns.
- A trap is identified by a **stable ID**, not its display label or list position.
- Never create duplicate selections for the same incident and trap.
- Preserve selections when switching category, searching, collapsing, navigating away and returning.

### 2.3 Selected-factor elaboration

Each selected trap has a compact expandable row. **Collapsed:** category initial, label, contribution status, and whether notes/evidence are complete. **Expanded:**

1. **Read-only definition** (from reference library).
2. **Investigation prompt(s)** (contextual questions to help elicit facts).
3. **How was this trap present?** — optional-to-draft free-text field.
4. **How did it contribute to the incident?** — free-text field; separate from presence.
5. **Supporting evidence / source references** — text field or existing attachment linking mechanism; do not invent a new attachment system if one exists.
6. **Contribution assessment:** `Undetermined`, `Contributing`, `Present — not established as contributing`, `Not contributing` (adapt wording to the organisation's terminology).
7. **Evidence confidence** (optional): `Unverified`, `Supported`, `Confirmed`; do not infer automatically.
8. **Remove** action with protection against accidental loss.

Keep long fields and definitions hidden until expanded. Prefer **one expanded elaboration card at a time**. Use the app's autosave pattern or explicit save if autosave is not already supported. Show save/error state where applicable.

### 2.4 Compactness and accessibility

- Fit the host panel's available width; no fixed large widths or horizontal scrolling.
- Mobile/narrow layout: single column, short rows, comfortable touch targets, wrapped labels.
- Desktop: preserve the same compact accordion design; do not introduce a dashboard.
- Semantic labels, checkbox state, expanded state (`aria-expanded`), focus indicators, keyboard interaction, and accessible error messages.
- Use the existing app's typography, colours, spacing and component library.
- Do not use colour as the sole way to indicate TWIN category or completion state.

## 3. Data model and persistence

Adapt these conceptual types to the existing project language and persistence layer:

```ts
type TwinCategory = 'T' | 'W' | 'I' | 'N';
type TwinSourceTier = 'core' | 'extended';
type ContributionStatus =
  | 'undetermined'
  | 'contributing'
  | 'present_unconfirmed'
  | 'not_contributing';

type TwinTrapDefinition = {
  id: string;                 // immutable, e.g. 'T-01'
  category: TwinCategory;
  label: string;
  definition: string;
  prompts: string[];
  sourceTier: TwinSourceTier;  // core or extended
  displayOrder: number;
  active: boolean;
  sourceNote?: string;
};

type IncidentTwinSelection = {
  id: string;                 // persisted record ID
  incidentId: string;         // existing app's incident key
  trapId: string;             // references TwinTrapDefinition.id
  presentExplanation: string;
  contributionExplanation: string;
  evidenceReferences: string;
  contributionStatus: ContributionStatus;
  evidenceConfidence?: 'unverified' | 'supported' | 'confirmed';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};
```

**Data rules:**

- Unique `(incidentId, trapId)` selection constraint.
- Reference definitions are shared and versioned/seeded centrally, **not duplicated into every incident**.
- Retain stable IDs even if labels or definitions are revised. Consider a reference-library version or a definition snapshot for audit/report reproducibility if the existing app has an audit trail.
- Use existing incident access controls: only authorised users can view/edit an incident's TWIN analysis.
- Follow existing save, migration, offline, concurrency and audit conventions. Avoid introducing new backend infrastructure unnecessarily.
- Persist evidence and notes with the incident. Never store only in component-local state.
- Validate text length and escape/render as plain text to prevent injection.
- On delete, follow existing audit/soft-delete policies.

### Suggested storage/API operations (conceptual)

- `listTwinDefinitions()` — all active traps, ordered T/W/I/N then display order; searchable client-side for this catalogue size.
- `getIncidentTwinSelections(incidentId)`.
- `upsertIncidentTwinSelection(incidentId, trapId, fields)`.
- `removeIncidentTwinSelection(incidentId, trapId)`.
- Optional bulk save if the app already uses a form-level save operation.

Prefer the existing API/data-service pattern over implementing these exact function names.

## 4. Complete working TWIN reference library

**Catalogue design:** The following is the complete **working reference from the prior discussion**, not a certification of exact INPO terminology. The **first eight entries in each category** are the core matrix concepts, with normalised labels where necessary; remaining entries are extended working-reference concepts. Some concepts intentionally overlap; an SME should decide whether to merge, reword or retain them. **Do not silently delete entries.**

For each entry below, seed a stable ID, category, short label, definition, and source tier. The description can be shown as the read-only definition. Generate one or two neutral investigation prompts from the description, for example: “What evidence shows this condition was present?” and “How, if at all, did it affect the event sequence?” Prompts must not presuppose culpability.

### T — Task Demands

| ID | Error trap | Definition / description | Tier |
|---|---|---|---|
| T-01 | Time pressure | Actual or perceived urgency, deadlines or pressure to finish quickly. | Core |
| T-02 | High workload | Demands on attention, memory or mental processing exceed available capacity. | Core |
| T-03 | Simultaneous, multiple tasks | Several actions or activities must be managed at the same time. | Core |
| T-04 | Repetitive actions / monotony | Repeated activity encourages automatic behaviour and reduced vigilance. | Core |
| T-05 | Irreversible actions | An action is difficult or impossible to reverse after execution. | Core |
| T-06 | Interpretation requirements | Task requires judgement or interpretation of instructions, technical data or conditions. | Core |
| T-07 | Unclear goals, roles or responsibilities | Uncertainty about outcomes, ownership or responsibilities. | Core |
| T-08 | Lack of or unclear standards | Standards or expectations are missing, vague or poorly understood. | Core |
| T-09 | Confusing procedures / vague guidance | Instructions are ambiguous, incomplete or open to conflicting interpretations. | Extended |
| T-10 | Excessive communication requirements | Numerous handovers or information exchanges increase opportunities for omissions or misunderstanding. | Extended |
| T-11 | Delays / idle time | Waiting or interruption reduces continuity, concentration or awareness of task status. | Extended |
| T-12 | Complexity / high information flow | Complex sequences or large volumes of information strain processing and coordination. | Extended |
| T-13 | Long-term monitoring | Vigilance must be sustained for extended periods. | Extended |
| T-14 | Excessive time on task | Prolonged work reduces alertness or concentration. | Extended |

### W — Work Environment

| ID | Error trap | Definition / description | Tier |
|---|---|---|---|
| W-01 | Distractions / interruptions | Events divert attention or break task continuity. | Core |
| W-02 | Changes / departure from routine | Conditions or arrangements differ from familiar practice. | Core |
| W-03 | Confusing displays or controls | Indications or controls are hard to distinguish, understand or use correctly. | Core |
| W-04 | Workarounds / out-of-service instrumentation | Work must proceed with defective, unavailable or bypassed equipment/instruments. | Core |
| W-05 | Hidden system / equipment response | System response is not immediately visible or easily understood. | Core |
| W-06 | Unexpected equipment conditions | Actual equipment state differs from expectations. | Core |
| W-07 | Lack of alternative indication | No independent or alternative indication is available for verification. | Core |
| W-08 | Personality conflicts | Interpersonal friction undermines communication or coordination. | Core |
| W-09 | Back shift / recent shift change | Shift patterns or handover timing disrupt continuity or awareness. | Extended |
| W-10 | Excessive group cohesiveness / peer pressure | Pressure to conform discourages dissent or questioning. | Extended |
| W-11 | Production overemphasis | Output or deadlines are prioritised over safe, controlled execution. | Extended |
| W-12 | Adverse physical climate (habitability) | Noise, lighting, temperature, ventilation or other physical conditions impair performance. | Extended |
| W-13 | No accounting of performance | Weak feedback, oversight or accountability for standards and performance. | Extended |
| W-14 | Conflicting conventions / stereotypes | Different team conventions or expectations create misunderstanding. | Extended |
| W-15 | Poor equipment layout / poor access | Arrangement, access or positioning makes correct execution difficult. | Extended |
| W-16 | Fear of consequences of error | Concern about blame or punishment discourages reporting or speaking up. | Extended |
| W-17 | Mistrust among work groups | Poor inter-team trust undermines coordination or information sharing. | Extended |
| W-18 | Meaningless rules | Requirements are perceived as impractical or without clear purpose. | Extended |
| W-19 | Nuisance alarms | Frequent low-value alarms reduce attention to meaningful warnings. | Extended |
| W-20 | Unavailable parts or tools | Necessary tools, materials or components are missing. | Extended |
| W-21 | Acceptability of 'cookbooking' practices | Following instructions mechanically without considering actual conditions is normalised. | Extended |
| W-22 | 'Rule book' culture | Rigid rule application displaces situational understanding or consideration of intent. | Extended |
| W-23 | Equipment sensitivity / inadvertent actions | Controls or equipment are easily affected by small unintended movements. | Extended |
| W-24 | Lack of clear strategic vision or goals | Organisational priorities or direction are unclear. | Extended |
| W-25 | Identical and adjacent displays or controls | Similar controls or indications located together increase selection errors. | Extended |
| W-26 | Out-of-service warning systems | Alarm or warning functions are unavailable or impaired. | Extended |
| W-27 | Lack of procedure place-keeping | It is difficult to maintain the correct step or resume after interruption. | Extended |

### I — Individual Capabilities

| ID | Error trap | Definition / description | Tier |
|---|---|---|---|
| I-01 | Unfamiliarity with task / first time | Limited exposure to the task, system or equipment. | Core |
| I-02 | Lack of knowledge / faulty mental model | Missing knowledge or incorrect understanding of how the system works. | Core |
| I-03 | New technique not used before | An unfamiliar method or technique is required. | Core |
| I-04 | Imprecise communication habits | Unclear, incomplete or unconfirmed communication. | Core |
| I-05 | Lack of proficiency / inexperience | Insufficient practical skill or experience for reliable task execution. | Core |
| I-06 | Indistinct problem-solving skills | Difficulty diagnosing problems or choosing appropriate actions. | Core |
| I-07 | Unsafe attitudes for critical tasks | Attitudes diminish appropriate attention to risk or requirements. | Core |
| I-08 | Illness / fatigue / injury / general health | Health or fitness for duty may affect alertness, judgement or physical performance. | Core |
| I-09 | Unawareness of critical parameters | Important operating limits or conditions are not understood or recognised. | Extended |
| I-10 | Inappropriate values | Personal priorities conflict with safe, correct work execution. | Extended |
| I-11 | Major life events | Personal circumstances may materially affect attention or performance; assess sensitively and only with relevant evidence. | Extended |
| I-12 | Poor manual dexterity | Fine motor control or physical coordination is inadequate for a precision task. | Extended |
| I-13 | Low self-esteem / moodiness | Emotional state may affect communication or judgement; avoid unsupported psychological labels. | Extended |
| I-14 | Questionable ethics / bending the rules | Intentional departures from requirements may be present; assess separately from inadvertent error and do not presume intent. | Extended |
| I-15 | Sense of control / learned helplessness | Perceived inability to influence outcomes reduces intervention or initiative. | Extended |
| I-16 | Personality type | Individual interaction style may affect teamwork; avoid unsupported personality profiling. | Extended |

### N — Human Nature

| ID | Error trap | Definition / description | Tier |
|---|---|---|---|
| N-01 | Stress | Pressure or strain affects attention, memory or decision-making. | Core |
| N-02 | Habit patterns | Familiar action sequences are performed automatically despite changed conditions. | Core |
| N-03 | Assumptions / inaccurate mental picture | Beliefs about conditions substitute for verification. | Core |
| N-04 | Complacency / overconfidence | Familiarity or confidence reduces vigilance or checking. | Core |
| N-05 | Mind-set | Fixed expectations hinder recognition of contradictory information. | Core |
| N-06 | Inaccurate risk perception | Likelihood or severity of a hazard is misjudged. | Core |
| N-07 | Mental shortcuts / biases | Heuristics or cognitive biases produce incorrect conclusions. | Core |
| N-08 | Limited short-term memory | Working-memory limits lead to omitted or displaced information. | Core |
| N-09 | Pollyanna effect | Optimistic expectations overshadow negative signals or risks. | Extended |
| N-10 | Limited perspective / bounded rationality | Decisions reflect incomplete information or a narrow view of the situation. | Extended |
| N-11 | Avoidance of mental strain | Easier approaches are favoured over demanding analysis. | Extended |
| N-12 | First day back from vacation / days off | Recent absence reduces familiarity with current changes or conditions. | Extended |
| N-13 | Sugar cycle (after a meal) | Potential post-meal changes in alertness; use cautiously and do not assert causation without evidence. | Extended |
| N-14 | Fatigue (sleep deprivation and biorhythms) | Inadequate sleep or circadian disruption reduces alertness and performance. | Extended |
| N-15 | Tunnel vision / lack of big picture | Attention to one detail obscures wider conditions or consequences. | Extended |
| N-16 | 'Something is not right' / gut feeling | An intuitive warning is noticed but not articulated or acted on; a cue rather than inherently an error trap. | Extended |
| N-17 | Pattern-matching bias | A situation is treated as familiar despite important differences. | Extended |
| N-18 | Social deference / excessive professional courtesy | Reluctance to challenge a perceived authority or expert. | Extended |
| N-19 | Easily bored | Monotony reduces vigilance or sustained attention. | Extended |
| N-20 | Close-in-time cause-effect correlation | Temporal proximity is mistaken for causal connection. | Extended |
| N-21 | Difficulty seeing own errors | Individuals may fail to notice their own omissions or mistakes. | Extended |
| N-22 | Frequency and similarity biases | Previous frequency or resemblance distorts likelihood judgements. | Extended |
| N-23 | Availability bias | Easily recalled examples unduly influence risk judgement. | Extended |
| N-24 | Imprecise physical actions | Physical movements are inaccurate or unintended. | Extended |
| N-25 | Limited attention span | Sustained focus is difficult under prolonged or competing demands. | Extended |
| N-26 | Spatial disorientation | Physical position or orientation is misunderstood. | Extended |
| N-27 | Physical reflex | Automatic physical response is inappropriate to the situation. | Extended |
| N-28 | Anxiety involving uncertainty | Uncertainty produces apprehension that may impair performance. | Extended |

**Catalogue totals:** T = 14, W = 27, I = 16, N = 28; **85 working-reference entries** in total, including **32 core** (8 per category) and **53 extended**. Do not accidentally omit items during seeding.

## 5. Reference library configuration

- Default: show **all 85 working-reference traps** in category lists, clearly distinguishing source tier in metadata/tooltips or a reference-info affordance (without adding clutter to each row).
- If the organisation requires strict core-only mode, make `coreOnly` an **optional configuration** rather than hard-coding a smaller library. The default for this request is **full reference**.
- Keep definitions/prompts in a data file or table, separate from UI rendering.
- Search should match label and definition; optionally synonyms/keywords.
- Use stable ordering and consistent category names.
- The source library is read-only for normal incident investigators.

## 6. Integration with existing culpability assessment

- Mount the TWIN section inside the existing **Error Trap Assessment** area of the incident's culpability assessment view.
- Use the **existing incident ID** and existing permissions, save lifecycle, audit log and report pipeline.
- Keep the TWIN panel independent of any culpability decision tree or scoring logic.
- A completed TWIN entry may inform the broader assessment, but selecting `I-07`, `I-14` or any other trap **must not auto-assign blame, intent, misconduct, negligence or a culpability outcome**.
- If the app has a report/export view, include a subsection titled **“TWIN — Contributing Error Traps”** grouped T/W/I/N. For each selected trap include its label, status, presence explanation, contribution explanation and evidence references. Exclude unselected traps from the incident report.
- If no traps are selected, display **“No TWIN error traps recorded”**, not **“No error traps existed.”**
- Where existing application terminology conflicts with this specification, preserve the existing terminology unless it would change the meaning of TWIN.

## 7. Validation and completion rules

**Draft:** selections may be saved with blank notes and `undetermined` status. Show an unobtrusive **“Needs elaboration”** marker.

**Assessment completion:** for any trap marked `contributing`, require a non-empty contribution explanation and at least one evidence reference or documented evidence narrative, subject to existing app validation conventions. If the app already has an investigation sign-off step, enforce this at sign-off rather than blocking draft saves.

**Review:** a reviewer should be able to distinguish **selected**, **evidence recorded**, and **contribution established**; these are not interchangeable states.

## 8. Acceptance criteria

1. The TWIN feature appears **inside** the existing incident culpability assessment's Error Trap Assessment area.
2. No standalone TWIN app, unrelated navigation or full-screen dashboard is introduced.
3. All **85** reference entries are available, grouped T/W/I/N, with the correct IDs and labels.
4. Each category can expand/collapse and displays its current selected count.
5. Search finds matching entries across categories without changing existing selections.
6. An investigator can select multiple traps from any category; no duplicates occur.
7. Each selected trap has an expandable elaboration area with definition, prompts, presence, contribution, evidence and status.
8. Selection, text and statuses persist after refresh and after leaving/reopening the incident.
9. Removing a selected trap with existing notes cannot silently discard those notes.
10. Narrow screens remain usable without horizontal scrolling.
11. Keyboard and screen-reader interaction is supported.
12. Existing incident permissions and audit behaviour are respected.
13. The incident report/export includes only selected traps and their recorded findings.
14. No TWIN selection changes the culpability outcome automatically.
15. Draft saves are permitted with incomplete elaboration; completion rules are enforced at the appropriate workflow stage.
16. Automated tests cover catalogue integrity, selection/deselection, search, persistence, validation and report rendering.

## 9. Codex implementation sequence

1. **Inspect the repository**: identify incident assessment screen, Error Trap Assessment panel, state management, UI components, persistence and tests.
2. **Summarise the integration plan** in a few lines before making changes; identify files to touch and any migration needed.
3. **Create the reference data module** with the 85 entries, stable IDs, categories, definitions and core/extended tier. Add a catalogue integrity test (14/27/16/28 and 32 core).
4. **Implement the colourful interactive four-square TWIN selector and compact accordion list** within the existing panel. Reuse existing button, search, checkbox, accordion and textarea components where available. Ensure tile and accordion state stay synchronised.
5. **Implement selected-trap elaboration** with a single-expanded-card pattern and safe removal.
6. **Wire incident persistence** and authorisation using existing project conventions.
7. **Integrate reporting/export** if the existing app has a report pipeline.
8. **Add tests** for all acceptance criteria that can be automated; run the project's lint, type-check and test commands.
9. **Report changes**: files changed, migrations, tests run/results, and any assumptions or remaining manual review.

**Do not** introduce a new framework, separate application, unrelated visual redesign, new culpability-scoring formula or speculative external integration. If repository structure makes a requirement unclear, inspect existing patterns and choose the least disruptive implementation; ask only for genuinely blocking decisions.

## 10. Optional future enhancements (not required for first implementation)

- Filter `All / Core only / Selected`.
- Keyword aliases for alternate terminology and organisation-specific phrases.
- Evidence links to existing incident attachments and witness statements.
- Reviewer comments and sign-off, if already supported by the app.
- Versioned reference definitions and organisation-approved wording overrides.
- Simple T/W/I/N counts in the existing report, **not** a culpability score.

---

### Suggested one-line Codex instruction

> Implement the attached `TWIN_Error_Trap_Codex_Implementation_Spec.md` in the existing culpability assessment app, specifically inside the incident's Error Trap Assessment area. Inspect the repo first, preserve the existing architecture and styling, use the complete 85-entry reference library, include the colourful interactive T/W/I/N square selector above the compact list, and ensure TWIN findings do not automatically determine culpability.
