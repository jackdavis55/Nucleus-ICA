"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  contributionLabels,
  searchTwinTraps,
  selectedTwinTraps,
  twinCategories,
  twinContributionNeedsEvidence,
  twinNoteLimit,
  type TwinCategory,
  type TwinSelection,
  type TwinSelections,
  type TwinTrapId,
} from "@/lib/twin/assessment";

const inputClass = "mt-1 block w-full rounded-lg border border-[#cbd9dc] bg-white px-3 py-2 text-sm text-[#294751] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b5a]";
const noteFields = [
  { key: "presence", label: "How was this trap present?" },
  { key: "contribution", label: "How, if at all, did it contribute to the incident?" },
  { key: "evidence", label: "Evidence and source references" },
] as const;

type Props = {
  selections: TwinSelections;
  disabled: boolean;
  onSelect: (id: TwinTrapId, selected: boolean) => void;
  onEdit: (id: TwinTrapId, changes: Partial<TwinSelection>) => void;
};

export function TwinPanel({ selections, disabled, onSelect, onEdit }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TwinCategory | null>(null);
  const [searchScope, setSearchScope] = useState<TwinCategory | null>(null);
  const [collapsedSearchCategories, setCollapsedSearchCategories] = useState<TwinCategory[]>([]);
  const [expandedTrap, setExpandedTrap] = useState<TwinTrapId | null>(null);
  const [removedTrap, setRemovedTrap] = useState<TwinTrapId | null>(null);
  const searching = Boolean(query.trim());
  const matches = searchTwinTraps(query);
  const selected = selectedTwinTraps(selections);

  function categoryIsOpen(category: TwinCategory) {
    if (!searching) return activeCategory === category;
    return (!searchScope || searchScope === category) && !collapsedSearchCategories.includes(category);
  }

  function toggleCategory(category: TwinCategory, fromTile = false) {
    setActiveCategory((current) => current === category ? null : category);
    if (!searching) return;
    if (fromTile || searchScope) {
      const closing = searchScope === category && categoryIsOpen(category);
      setSearchScope(category);
      setCollapsedSearchCategories(closing ? [category] : []);
      return;
    }
    setCollapsedSearchCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  }

  function changeSearch(value: string) {
    setQuery(value);
    setSearchScope(null);
    setCollapsedSearchCategories([]);
  }

  function changeSelection(trapId: TwinTrapId, checked: boolean) {
    onSelect(trapId, checked);
    setExpandedTrap(checked ? trapId : null);
    setRemovedTrap(checked ? null : trapId);
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="mt-6 space-y-3 rounded-xl border border-[#dfe7e9] bg-white p-3 text-[#294751] sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <h3 id={`${id}-heading`} className="text-sm font-semibold">Contributing Error Traps (TWIN)</h3>
        <p aria-live="polite" className="text-xs text-[#50656d]">{selected.length} selected</p>
      </div>
      <div className="grid max-w-[22rem] grid-cols-4 gap-1.5 max-[320px]:grid-cols-2 sm:gap-2">
        {twinCategories.map(({ id: category, name, color, short }) => {
          const count = selected.filter(({ trap }) => trap.category === category).length;
          const expanded = categoryIsOpen(category) && matches.some((trap) => trap.category === category);
          return (
            <button key={category} type="button" title={name} aria-label={`${name}, ${count} selected`}
              aria-expanded={expanded} aria-controls={`${id}-category-${category}`}
              onClick={() => toggleCategory(category, true)}
              className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border-2 px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 ${color} ${expanded ? "border-current" : "border-transparent"}`}>
              <span className="text-lg font-bold leading-none">{category}</span>
              <span className="mt-1 text-center [overflow-wrap:anywhere] text-[10px] font-semibold leading-tight">{short}</span>
              <span className="text-xs">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-search`} className="text-xs font-semibold">Search error traps</label>
          <input id={`${id}-search`} type="search" value={query} onChange={(event) => changeSearch(event.target.value)}
            className={inputClass} placeholder="Search by name or definition" />
        </div>
        {query && <Button type="button" variant="outline" size="sm" onClick={() => {
          changeSearch("");
          document.getElementById(`${id}-search`)?.focus();
        }}>Clear search</Button>}
      </div>
      {searching && !matches.some((trap) => !searchScope || trap.category === searchScope) &&
        <p role="status" className="text-xs">No error traps match {searchScope ? "in this category" : "this search"}.</p>}
      <div className="divide-y divide-[#dfe7e9]">
        {twinCategories.map(({ id: category, name }) => {
          const traps = matches.filter((trap) => trap.category === category);
          const count = selected.filter(({ trap }) => trap.category === category).length;
          const expanded = categoryIsOpen(category) && traps.length > 0;
          return (
            <div key={category} hidden={searching && !traps.length}>
              <button type="button" aria-expanded={expanded} aria-controls={`${id}-category-${category}`}
                onClick={() => toggleCategory(category)} className="flex min-h-10 w-full items-center gap-2 rounded px-1 text-left text-xs focus-visible:outline-2 focus-visible:outline-[#176b5a]">
                {expanded ? <ChevronDown aria-hidden="true" className="size-4 shrink-0" /> : <ChevronRight aria-hidden="true" className="size-4 shrink-0" />}
                <span className="flex-1 font-semibold">{category} · {name}</span>
                <span className="shrink-0">{count} selected</span>
              </button>
              <div id={`${id}-category-${category}`} hidden={!expanded}>
                {expanded && traps.map((trap) => (
                  <label key={trap.id} className="flex min-h-9 items-start gap-2 px-2 py-2 text-xs" title={`${trap.sourceTier === "core" ? "Core" : "Extended"} working reference`}>
                    <input type="checkbox" disabled={disabled} checked={Boolean(selections[trap.id]?.selected)}
                      onChange={(event) => changeSelection(trap.id, event.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-[#176b5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b5a]" />
                    <span>{trap.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[#50656d]">Core and extended working reference. Record work-relevant observations only and use the restricted process for fitness-for-duty details.</p>
      {removedTrap && <div role="status" className="flex flex-wrap items-center gap-2 text-xs">
        Error trap removed from the assessment findings.
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => changeSelection(removedTrap, true)}>Undo removal</Button>
      </div>}
      {!!selected.length && <div className="space-y-2">
        <h4 className="text-xs font-semibold">Selected factors — elaborate</h4>
        {selected.map(({ trap, selection }) => {
          const expanded = expandedTrap === trap.id;
          const hasEvidence = Boolean(selection.evidence.trim());
          const elaborated = Boolean(selection.presence.trim() && selection.contribution.trim() && hasEvidence);
          return (
            <div key={trap.id} className="rounded-lg border border-[#dfe7e9]">
              <button type="button" aria-expanded={expanded} aria-controls={`${id}-trap-${trap.id}`}
                onClick={() => setExpandedTrap(expanded ? null : trap.id)}
                className="flex min-h-10 w-full items-start gap-2 rounded-lg px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-[#176b5a]">
                {expanded ? <ChevronDown aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{trap.category} · {trap.label}</span>
                  <span className="mt-0.5 block text-[11px] text-[#50656d]">
                    {contributionLabels[selection.status]} · {hasEvidence ? "Evidence recorded" : "Evidence pending"}
                    {!elaborated && " · Needs elaboration"}
                  </span>
                </span>
              </button>
              <div id={`${id}-trap-${trap.id}`} hidden={!expanded} className="space-y-3 border-t border-[#dfe7e9] p-3">
                {expanded && <>
                  <p className="text-xs"><strong>{trap.sourceTier === "core" ? "Core" : "Extended"} definition</strong><br />{trap.definition}</p>
                  <p className="text-xs">What evidence supports or challenges the presence of this condition? Where in the event sequence could it have influenced the work?</p>
                  {noteFields.map(({ key, label }) => (
                    <label key={key} className="block text-xs font-semibold">
                      {label}
                      <textarea value={selection[key]} maxLength={twinNoteLimit} readOnly={disabled} rows={2}
                        onChange={(event) => onEdit(trap.id, { [key]: event.target.value })}
                        placeholder={key === "evidence" ? "Record supporting or conflicting evidence and sources." : undefined}
                        className={`${inputClass} resize-y font-normal`} />
                    </label>
                  ))}
                  <label className="block text-xs font-semibold">
                    Contribution assessment
                    <select value={selection.status} disabled={disabled} className={inputClass}
                      onChange={(event) => {
                        const status = Object.keys(contributionLabels).find((key) => key === event.target.value) as TwinSelection["status"] | undefined;
                        if (status) onEdit(trap.id, { status });
                      }}>
                      {Object.entries(contributionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </label>
                  {twinContributionNeedsEvidence(selection) && <p className="text-xs text-[#795320]">Add a contribution explanation and evidence before completing the assessment.</p>}
                  <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => changeSelection(trap.id, false)}>Remove</Button>
                </>}
              </div>
            </div>
          );
        })}
      </div>}
    </section>
  );
}
