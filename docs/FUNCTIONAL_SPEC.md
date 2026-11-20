# NUCLEUS — Functional Specification

## 1. Global assessment model

Each assessment contains:
- Assessment metadata.
- One incident/event summary.
- One assessed individual.
- One or more defined actions/omissions by that individual (MVP may begin with one primary act).
- Stage responses.
- Free-text explanations.
- Error traps and mitigating/aggravating contextual factors.
- Evidence references.
- Generated narrative statements.
- Human performance classification.
- Just Culture response consideration.
- Recommendations.
- Provisional overall conclusion.

The interface must show a stage navigation sidebar with status:
- Not started
- In progress
- Completed
- Requires evidence
- Disputed

A stage is not complete merely because a radio button has been selected. Required explanations and evidence prompts must be satisfied or explicitly marked not available/not applicable.

## 2. Common answer states

Use consistent answer states where appropriate:
- Yes
- Partly
- No
- Unknown
- Not applicable
- Disputed / conflicting evidence
- Not yet assessed

Do not force Yes/No answers where a graded or free-text response is more appropriate.

## 3. Standard question panel

Every assessment question should support:
1. Question wording.
2. "Why this matters" explanation.
3. Plain-language guidance.
4. Answer options.
5. Conditional follow-up question(s), including free-text "Why?" prompts.
6. Error traps / mitigating factors relevant to the question.
7. Evidence references and evidence notes.
8. Distinct recording of factual evidence and assessor interpretation where a stage calls for both.
9. Status and completion indicator.

Stage completion requires a response and an evidence reference or note, including an explanation when evidence is unavailable. There is no separate stage rationale field.

Avoid double negatives. Ask one concept per question wherever possible. Use neutral wording and avoid implying the desired answer.

## 4. Assessment stages

### Stage 1 — Event, Incident or Non-Conformance
Purpose: establish the specific behaviour without prematurely judging it.

Core prompts:
- What event, incident or non-conformance is being assessed?
- What specific action or omission by the individual is being assessed?
- What was the individual's role and responsibility?
- What was expected in the circumstances?
- What did the individual actually do?
- What happened immediately before and after?
- What information was available to the individual at the time?

Capture chronology, role, task context, sources and the individual's account.

### Stage 2 — Causal contribution and organisational analysis
Prompts:
- Did the individual's action contribute to the event?
- How did it contribute?
- Would the event likely have occurred without it?
- Which other actions or failures were necessary?
- Which barriers failed or were absent?
- Did management or organisational conditions contribute?
- Could the organisation reasonably have anticipated or prevented the conditions?

Separate:
1. Individual contribution.
2. Immediate workplace/task conditions.
3. Organisational and management conditions.
4. Failed/missing defences.

### Stage 3 — Intention and outcome
Purpose: distinguish intended action from unintended error and intended outcome from unintended consequence.

Prompts:
- Did the individual intend to perform the physical action?
- Did the action achieve what they intended?
- Did they intend the harmful consequence?
- Did they recognise the possibility of that consequence at the time?
- What evidence supports the answer?

Do not infer recklessness solely because an action was deliberate.

### Stage 4 — Fitness for duty
Purpose: identify whether a relevant fitness-for-duty issue may have affected performance.

Prompts:
- Is there evidence of a relevant fitness-for-duty factor at the time?
- Could fatigue, workload, distraction or another factor have affected performance?
- Were working hours and rest arrangements appropriate?
- Is specialist occupational-health/fitness-for-duty review needed?

Do not collect diagnoses or detailed medical information in the general assessment. Record restricted referrals only.

### Stage 5 — Training, competence and experience
Prompts:
- Was the individual appropriately qualified?
- Was training current and relevant?
- Had competence been assessed?
- Was practical experience sufficient?
- Was task assignment appropriate?
- Was supervision proportionate?
- Were known competency gaps addressed?

Distinguish individual capability from organisational assignment, training and supervision failures.

### Stage 6 — Knowledge and understanding
Purpose: establish what the individual knew and understood at the time.

Prompts:
- Did the individual know the applicable requirement?
- Did they understand its safety purpose?
- Did they understand the potential consequences of deviation?
- Did they recognise that the situation was unusual?
- Was the information available and understandable?
- What contemporaneous evidence supports the assessment?

### Stage 7 — Procedures and expectations
Purpose: assess the quality and status of the procedure and the actual expectation to use it.

Prompts:
- Was a relevant procedure available and accessible?
- Was it current and approved?
- Was it technically accurate?
- Was it workable in the actual circumstances?
- Was it clear and understandable?
- Was the individual expected to follow it?
- Did the individual know that expectation?
- What was the procedure’s specified use: Information Only, Reference Use or Continuous Use?
- Did the individual use the procedure as specified? Record the evidence and explain any difference or uncertainty.

Potential follow-ups:
- Was an alternative method formally authorised?
- Was the alternative practice known to supervisors?
- Was the procedure routinely bypassed or adapted?
- Did the work situation make compliance difficult?
- Was there conflicting instruction or production pressure?

Never assume a procedure was suitable simply because it existed.

### Stage 8 — Volition and personal control
Purpose: examine the person's meaningful freedom, understanding and control in context, informed by Dekker's critique of simplistic culpability decision trees.

Organise prompts under three practical lenses. These are application design lenses and must not be presented as verbatim quotations or a definitive named three-part Dekker model unless verified against the source literature.

A. Choice and constraints:
- Could the individual realistically choose another course of action?
- Could they stop the job or seek assistance?
- Were they instructed, pressured or incentivised to proceed?
- Were time, staffing, resources, authority gradients or operational conditions constraining choice?

B. Understanding and foreseeability:
- What risks did the individual recognise at the time?
- What consequences did they reasonably foresee?
- What information was available to them then?
- Did they believe safeguards or other people would control the risk?

C. Control and causal influence:
- What influence did the individual have over the sequence of events?
- Could they reasonably interrupt the sequence?
- Which other failures or conditions were necessary?
- Which safeguards could have prevented or mitigated the outcome?

For each material answer, ask why and record evidence. Do not equate a deliberate act with free choice or informed acceptance of risk.

### Stage 9 — Error traps and mitigating factors
Purpose: systematically identify relevant performance-shaping conditions.

Categories:
- Task: complexity, novelty, ambiguity, repetition, workload.
- Time: time pressure, interruptions, competing priorities.
- Individual: fatigue, experience, stress, familiarity, capability.
- Procedure: ambiguity, poor usability, conflicting instructions, impracticality.
- Equipment/interface: defects, display design, tool availability, layout.
- Communication: handover, briefing, instruction, team coordination.
- Supervision: availability, oversight, conflicting direction, normalised practice.
- Organisation: staffing, resourcing, production pressure, planning, priorities.
- Culture: accepted shortcuts, reluctance to challenge, authority gradient, normalisation of deviance.
- Defences: missing/ineffective checks, verification, barriers, alarms or independent safeguards.

For each factor record:
- Present? (yes/no/unknown/disputed)
- Relevance (relevant/possibly relevant/not relevant/not assessed)
- How it influenced the action or outcome.
- Evidence for and against.
- Assessor rationale.

The embedded TWIN panel uses the 85-entry working reference in [the TWIN implementation specification](TWIN_Error_Trap_Codex_Implementation_Spec.md). Selections belong to the individual assessment. Drafts can save incomplete elaboration. Completing an assessment requires a contribution explanation and evidence for each selected trap marked Contributing. The report includes selected TWIN findings with the Stage 9 responses.

Do not add factor points into a culpability score.

### Stage 10 — Substitution test
Purpose: explore whether a comparable competent person would likely have acted differently in the same circumstances.

Prompt:
- Would a similarly qualified and experienced person, facing the same information and conditions, probably have acted differently?

Options:
- Probably yes
- Probably no
- Unable to determine

Record evidence about who is considered comparable and what context they would have known. Avoid hindsight bias.

### Stage 11 — Previous history and behavioural context
Prompts:
- Were there previous similar events?
- Had relevant expectations been clearly communicated?
- Was previous coaching or instruction given?
- Were similar practices common among colleagues?
- Did management know about repeated deviations?
- Are prior events genuinely relevant to the current behaviour?

A previous event is not automatic proof of current culpability. Record the evidence relevant to whether the previous event bears on the current behaviour.

## 5. Analysis and conclusion areas

### Reason human performance classification
Support classification of relevant acts as:
- Slip
- Lapse
- Rule-based mistake
- Knowledge-based mistake
- Violation (with subtype/description where evidence supports it)
- Other / insufficient information

Also allow relevant rule-related procedure categories to be considered, such as following an unsuitable procedure, departing from an inappropriate rule, or relying on informal work practice. Validate exact terminology against the source register before presenting it as Reason's terminology.

Allow more than one classification if the event contains multiple distinct behaviours.

### Just Culture response consideration
Present as a separate management-response consideration, not as a synonym for Reason's error taxonomy:
- Human error
- At-risk behaviour
- Possible reckless behaviour
- System-induced behaviour/error
- Insufficient evidence / further investigation required
- Other / specialist review required

These are provisional considerations, not automated verdicts. Do not infer recklessness from intentional action alone.

### Summary
Show:
- Established facts.
- Assessor interpretations.
- Individual's explanation.
- Evidence supporting and challenging each key finding.
- Relevant factors.
- Unresolved questions.
- Reason classification.
- Volition analysis.
- Organisational contribution.
- Provisional accountability consideration.

### Recommendations
Support recommendations such as:
- Individual learning/coaching.
- Refresher training or competency reassessment.
- Procedure review.
- Work design or interface improvement.
- Staffing/resourcing changes.
- Supervision/briefing improvements.
- Barrier/defence improvements.
- Organisational learning.
- Independent specialist review.
- Further evidence gathering.

The assessor may add a supporting note to each proposed recommendation. A linked finding is optional. Do not generate a disciplinary sanction automatically.

### Overall verdict
Use a clear provisional status:
- No individual culpability finding supported on current evidence.
- Human error / learning response indicated.
- At-risk behaviour response may be appropriate.
- Possible reckless behaviour requires independent review.
- Further investigation required.
- Unable to conclude.

These are draft workflow labels, not legal conclusions. Allow the assessor to write a reasoned conclusion and record dissent/uncertainty.

## 6. Live assessment narrative

Narrative must update as answers change and distinguish:
- Established facts.
- Assessor interpretations.
- Individual explanations.
- Conflicting evidence.
- Assumptions.
- Missing information.
- Provisional conclusions.

Narrative statements must be traceable to the responses and evidence that generated them. Use cautious language ("currently indicates", "the assessor has recorded", "requires verification"). Never convert an assessor's interpretation into a fact.

Allow assessor editing, but retain generated text and the basis for the final edited narrative.

## 7. Evidence handling

For the MVP, evidence can be represented by references/notes rather than file upload. Each evidence item should include:
- Evidence ID.
- Type/source.
- Description.
- Date (if known).
- Which question/finding it supports or challenges.
- Reliability/limitations note.
- Confidentiality marker (future-ready field).

## 8. Report

Draft report sections:
1. Executive summary.
2. Incident description and chronology.
3. Individual's role and assessed action(s).
4. Evidence considered.
5. Reason human performance classification.
6. Procedure, knowledge, training and competence findings.
7. Error traps and mitigating/aggravating circumstances.
8. Volition and personal control.
9. Substitution test.
10. Organisational/systemic contributors.
11. Causal contribution.
12. Provisional Just Culture consideration.
13. Recommendations.
14. Assessor's conclusion and limitations.

Always mark the report as draft/provisional until the assessor completes the required review steps.
