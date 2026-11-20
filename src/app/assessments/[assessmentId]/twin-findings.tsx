import { contributionLabels, groupTwinFindings, type TwinSelections } from "@/lib/twin/assessment";

export function TwinFindings({ selections }: { selections: TwinSelections }) {
  const groups = groupTwinFindings(selections);
  return (
    <section aria-label="TWIN — Contributing Error Traps" className="mt-3 border-t border-[#edf1f2] pt-3 text-xs text-[#526871]">
      <h5 className="font-semibold text-[#405b64]">TWIN — Contributing Error Traps</h5>
      {groups.length === 0 && <p className="mt-1">No TWIN error traps recorded</p>}
      {groups.map(({ category, entries }) => (
        <div key={category.id} className="mt-2">
          <h6 className="font-semibold">{category.id} · {category.name}</h6>
          <ul className="mt-1 space-y-2">
            {entries.map(({ trap, selection }) => (
              <li key={trap.id} className="break-inside-avoid break-words">
                <p className="font-medium">{trap.label} · {contributionLabels[selection.status]}</p>
                <dl className="whitespace-pre-wrap">
                  <div><dt className="inline font-medium">Presence </dt><dd className="inline">{selection.presence.trim() || "Not recorded"}</dd></div>
                  <div><dt className="inline font-medium">Contribution </dt><dd className="inline">{selection.contribution.trim() || "Not recorded"}</dd></div>
                  <div><dt className="inline font-medium">Evidence </dt><dd className="inline">{selection.evidence.trim() || "Not recorded"}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
