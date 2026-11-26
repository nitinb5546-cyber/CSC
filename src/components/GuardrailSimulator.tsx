import React, { useState, useEffect } from 'react';
import { ProjectData, SimulatorAnalysis } from '../types';
import { formatINR, SAMPLE_CLIENT_MESSAGES } from '../data/initialData';

interface GuardrailSimulatorProps {
  project: ProjectData;
  preselectedSwapId?: string | null;
  onAnalyzeMessage: (rawMessage: string, source: SimulatorAnalysis['source']) => void;
  onApplyScopeSwap: (swapDeliverableId: string) => void;
  onGeneratePaidAddon: () => void;
  onDeferToPhase2: () => void;
}

export const GuardrailSimulator: React.FC<GuardrailSimulatorProps> = ({
  project,
  preselectedSwapId,
  onAnalyzeMessage,
  onApplyScopeSwap,
  onGeneratePaidAddon,
  onDeferToPhase2,
}) => {
  const { simulator } = project;
  const [draftMessage, setDraftMessage] = useState(simulator.rawMessage);
  const [draftSource, setDraftSource] = useState<SimulatorAnalysis['source']>(simulator.source);

  const swappableDeliverables = project.deliverables.filter(
    (d) => d.swappable && d.status !== 'Deferred to Phase 2'
  );

  const [selectedSwapId, setSelectedSwapId] = useState<string>(
    preselectedSwapId || swappableDeliverables[0]?.id || ''
  );

  useEffect(() => {
    setDraftMessage(simulator.rawMessage);
    setDraftSource(simulator.source);
  }, [project.id, simulator.rawMessage, simulator.source]);

  useEffect(() => {
    if (preselectedSwapId && swappableDeliverables.some((d) => d.id === preselectedSwapId)) {
      setSelectedSwapId(preselectedSwapId);
    } else if (!swappableDeliverables.some((d) => d.id === selectedSwapId)) {
      setSelectedSwapId(swappableDeliverables[0]?.id || '');
    }
  }, [preselectedSwapId, project.id, project.deliverables]);

  const selectedSwapDeliverable =
    swappableDeliverables.find((d) => d.id === selectedSwapId) || swappableDeliverables[0];

  const swapHoursRemoved = selectedSwapDeliverable ? selectedSwapDeliverable.allocatedHrs : 0;
  const netHoursAfterSwap = project.capHours - swapHoursRemoved + simulator.totalDriftHrs;
  const unabsorbedHours = Math.max(0, simulator.totalDriftHrs - swapHoursRemoved);
  const swapExtraCost = unabsorbedHours * project.hourlyRate;

  const handleAnalyzeClick = () => {
    if (!draftMessage.trim()) return;
    onAnalyzeMessage(draftMessage, draftSource);
  };

  return (
    <div className="flex flex-col gap-2xl">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">
            Live Scope Guardrail &amp; Trade-Off Swap Simulator
          </h1>
          <p className="font-body text-body-sm text-on-surface-variant mt-xs">
            Parse incoming client requests against signed SOW deliverables and model zero-margin trade-offs.
          </p>
        </div>
        <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
          {simulator.simCode}
        </span>
      </div>

      {/* Top Section: Incoming Client Message Analyzer */}
      <section
        aria-label="Incoming Client Message Analyzer"
        className="bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col gap-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <span
              className="material-symbols-outlined text-[20px] text-primary"
              aria-hidden="true"
            >
              chat_bubble_outline
            </span>
            <h2 className="font-headline text-headline-md text-on-surface">
              Incoming Client Message Analyzer
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-md">
            <div className="flex items-center gap-xs">
              <span className="font-mono text-mono-sm text-on-surface-variant">Source:</span>
              <select
                aria-label="Message source channel"
                value={draftSource}
                onChange={(e) => setDraftSource(e.target.value as SimulatorAnalysis['source'])}
                className="rounded-md border border-outline-variant bg-surface px-sm py-xs font-mono text-mono-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="WhatsApp / Slack">WhatsApp / Slack</option>
                <option value="Email">Email</option>
                <option value="Client Call Notes">Client Call Notes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-md">
          <label htmlFor="client-message-input" className="sr-only">
            Client message text
          </label>
          <textarea
            id="client-message-input"
            rows={3}
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface p-lg font-body text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-md">
            <div className="flex flex-wrap items-center gap-md">
              <span className="font-body text-body-sm text-on-surface-variant tabular-nums">
                Comparing against {project.deliverables.length} baseline deliverables (
                {project.capHours} hrs cap @ {formatINR(project.hourlyRate)}/hr).
              </span>
              <div className="flex flex-wrap items-center gap-xs">
                {SAMPLE_CLIENT_MESSAGES.map((sample, idx) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setDraftMessage(sample.text);
                      setDraftSource(sample.source);
                      onAnalyzeMessage(sample.text, sample.source);
                    }}
                    className="px-sm py-xs rounded-md border border-outline-variant bg-surface hover:bg-surface-subtle font-label text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Sample {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeClick}
              disabled={!draftMessage.trim()}
              className="inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                auto_awesome
              </span>
              <span className="font-label text-label-lg whitespace-nowrap">
                Analyze Against SOW Baseline
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Middle Section: 2-Column Comparison Split */}
      <section
        aria-label="SOW baseline comparison"
        className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-stretch"
      >
        {/* Left Card: Covered in SOW Baseline */}
        <article className="h-full bg-surface-card border border-outline-variant border-t-4 border-t-emerald rounded-xl p-xl flex flex-col gap-lg">
          <header className="flex flex-wrap items-center justify-between gap-sm">
            <div className="flex items-center gap-sm">
              <span
                className="material-symbols-outlined material-symbols-filled text-[20px] text-emerald"
                aria-hidden="true"
              >
                check_circle
              </span>
              <h2 className="font-headline text-headline-md text-on-surface">
                Covered in SOW Baseline (0 Extra Hrs)
              </h2>
            </div>
            <span
              role="status"
              className="inline-flex items-center px-md py-xs rounded-full bg-emerald-container text-on-emerald-container whitespace-nowrap"
            >
              <span className="font-label text-label-md whitespace-nowrap">In-Scope</span>
            </span>
          </header>

          <div className="flex flex-col gap-md">
            {simulator.inScopeMatches.map((match) => (
              <div
                key={match.id}
                className="p-lg rounded-lg bg-surface border border-outline-variant flex items-center justify-between gap-md"
              >
                <div className="flex flex-col gap-xs">
                  <span className="font-body text-body-md text-on-surface">{match.title}</span>
                  <span className="font-body text-body-sm text-on-surface-variant">
                    {match.matchedDeliverable}
                  </span>
                </div>
                <span className="font-mono text-mono-md text-on-emerald-container tabular-nums whitespace-nowrap">
                  0 Extra Hrs
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Right Card: Out-of-Scope Drift Detected */}
        <article className="h-full bg-surface-card border border-outline-variant border-t-4 border-t-amber rounded-xl p-xl flex flex-col gap-lg">
          <header className="flex flex-wrap items-center justify-between gap-sm">
            <div className="flex items-center gap-sm">
              <span
                className="material-symbols-outlined material-symbols-filled text-[20px] text-amber"
                aria-hidden="true"
              >
                warning
              </span>
              <h2 className="font-headline text-headline-md text-on-surface tabular-nums">
                Out-of-Scope Drift Detected (+{simulator.totalDriftHrs} hrs / +
                {formatINR(simulator.totalDriftCost)})
              </h2>
            </div>
            <span
              role="status"
              className="inline-flex items-center px-md py-xs rounded-full bg-amber-container text-on-amber-container whitespace-nowrap"
            >
              <span className="font-label text-label-md tabular-nums whitespace-nowrap">
                {simulator.driftItems.length}{' '}
                {simulator.driftItems.length === 1 ? 'Drift Item' : 'Drift Items'}
              </span>
            </span>
          </header>

          <div className="flex flex-col gap-md">
            {simulator.driftItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-lg rounded-lg bg-surface border border-outline-variant flex items-center justify-between gap-md"
              >
                <div className="flex items-center gap-md">
                  <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-body text-body-md text-on-surface">{item.title}</span>
                </div>
                <span className="font-mono text-mono-md text-on-amber-container tabular-nums whitespace-nowrap">
                  +{item.hours} hrs (+{formatINR(item.cost)})
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Bottom Section: Select Resolution Path (3 Equal Side-by-Side Cards) */}
      <section aria-label="Select Resolution Path" className="flex flex-col gap-lg">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <h2 className="font-headline text-headline-md text-on-surface">
            Select Resolution Path
          </h2>
          <span className="font-body text-body-sm text-on-surface-variant">
            Choose how to present this change to {project.clientName}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl items-stretch">
          {/* Card 1: Scope Swap (Highlighted) */}
          <article className="h-full bg-surface-card border-2 border-primary rounded-xl p-xl flex flex-col justify-between gap-lg">
            <div className="flex flex-col gap-lg">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <span
                  role="status"
                  className="inline-flex items-center px-md py-xs rounded-full bg-primary-container text-on-primary-container whitespace-nowrap"
                >
                  <span className="font-label text-label-sm whitespace-nowrap">
                    {swapExtraCost === 0
                      ? 'Recommended — ₹0 Extra'
                      : `Partial Swap — +${formatINR(swapExtraCost)}`}
                  </span>
                </span>
              </div>

              <h3 className="font-headline text-headline-sm text-on-surface">
                Scope Swap (Zero Budget Impact)
              </h3>

              <div className="flex flex-col gap-xs">
                <label
                  htmlFor="swap-select"
                  className="font-label text-label-md text-on-surface-variant"
                >
                  Select swappable SOW deliverable
                </label>
                {swappableDeliverables.length > 0 ? (
                  <select
                    id="swap-select"
                    value={selectedSwapId}
                    onChange={(e) => setSelectedSwapId(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant bg-surface px-md py-sm font-body text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {swappableDeliverables.map((d) => (
                      <option key={d.id} value={d.id}>
                        Trade: {d.name} ({d.allocatedHrs} hrs) → Phase 2
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-md rounded-lg bg-surface border border-outline-variant font-body text-body-sm text-on-surface-variant">
                    All swappable buffer deliverables have been used. Use Paid Add-On or Defer to Phase 2.
                  </div>
                )}
              </div>

              <div className="p-md rounded-lg bg-surface border border-outline-variant">
                <p className="font-mono text-mono-sm text-on-surface tabular-nums">
                  {project.capHours} hrs - {swapHoursRemoved} hrs + {simulator.totalDriftHrs} hrs ={' '}
                  {netHoursAfterSwap} hrs |{' '}
                  {swapExtraCost === 0
                    ? `Total stays ${formatINR(project.fixedCap)}`
                    : `Total ${formatINR(project.fixedCap + swapExtraCost)}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedSwapDeliverable}
              onClick={() => selectedSwapDeliverable && onApplyScopeSwap(selectedSwapDeliverable.id)}
              className="w-full inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="font-label text-label-lg whitespace-nowrap">
                Apply Scope Swap &amp; Send Client Link
              </span>
            </button>
          </article>

          {/* Card 2: Paid Change Request */}
          <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col justify-between gap-lg">
            <div className="flex flex-col gap-lg">
              <div className="flex items-center justify-between gap-sm">
                <span
                  role="status"
                  className="inline-flex items-center px-md py-xs rounded-full bg-surface-subtle text-on-surface-subtle whitespace-nowrap"
                >
                  <span className="font-label text-label-sm whitespace-nowrap">Cap Expansion</span>
                </span>
              </div>

              <h3 className="font-headline text-headline-sm text-on-surface">
                Paid Change Request
              </h3>

              <p className="font-body text-body-sm text-on-surface-variant text-pretty">
                Keep all baseline deliverables intact and issue a formal add-on invoice for the extra{' '}
                {simulator.totalDriftHrs} hours.
              </p>

              <div className="p-md rounded-lg bg-surface border border-outline-variant">
                <p className="font-mono text-mono-sm text-on-surface tabular-nums">
                  {formatINR(project.fixedCap)} + {formatINR(simulator.totalDriftCost)} ={' '}
                  {formatINR(project.fixedCap + simulator.totalDriftCost)} (+
                  {simulator.timelineExtraDays} Days Timeline)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onGeneratePaidAddon}
              className="w-full inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-surface-card text-on-surface border border-outline-variant hover:bg-surface-subtle transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="font-label text-label-lg whitespace-nowrap">
                Generate Paid Add-On Link
              </span>
            </button>
          </article>

          {/* Card 3: Defer to Phase 2 */}
          <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col justify-between gap-lg">
            <div className="flex flex-col gap-lg">
              <div className="flex items-center justify-between gap-sm">
                <span
                  role="status"
                  className="inline-flex items-center px-md py-xs rounded-full bg-surface-subtle text-on-surface-subtle whitespace-nowrap"
                >
                  <span className="font-label text-label-sm whitespace-nowrap">Backlog</span>
                </span>
              </div>

              <h3 className="font-headline text-headline-sm text-on-surface">Defer to Phase 2</h3>

              <p className="font-body text-body-md text-on-surface-variant text-pretty">
                Log {simulator.driftItems.length === 1 ? 'this request' : 'both requests'} into
                post-launch backlog without delaying {project.launchDayLabel}.
              </p>

              <div className="p-md rounded-lg bg-surface border border-outline-variant">
                <p className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                  0 hrs added | {project.launchDayLabel} protected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDeferToPhase2}
              className="w-full inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-surface-card text-on-surface border border-outline-variant hover:bg-surface-subtle transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="font-label text-label-lg whitespace-nowrap">
                Log to Phase 2 Backlog
              </span>
            </button>
          </article>
        </div>
      </section>
    </div>
  );
};
