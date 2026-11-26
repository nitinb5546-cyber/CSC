import React, { useState } from 'react';
import { AppView, ProjectData } from '../types';
import { formatINR } from '../data/initialData';

interface ClientApprovalPortalProps {
  project: ProjectData;
  onApprove: () => void;
  onRequestCall: () => void;
  onResetApproval: () => void;
  onNavigate: (view: AppView) => void;
}

export const ClientApprovalPortal: React.FC<ClientApprovalPortalProps> = ({
  project,
  onApprove,
  onRequestCall,
  onResetApproval,
  onNavigate,
}) => {
  const [confirmed, setConfirmed] = useState(true);
  const proposal = project.activeProposal;
  const totalAddingHrs = proposal.addingItems.reduce((sum, i) => sum + i.hours, 0);

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between py-2xl px-lg">
      {/* Subtle Agency Preview Return Bar */}
      <div className="no-print w-full max-w-[720px] mx-auto mb-lg flex flex-wrap items-center justify-between gap-sm px-md py-sm rounded-lg bg-surface-card border border-outline-variant">
        <span className="font-label text-label-sm text-on-surface-variant">
          Client Portal Preview ({project.clientName} view)
        </span>
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="font-label text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Edit in Simulator
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-xs font-label text-label-sm text-primary hover:text-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Agency Workspace
          </button>
        </div>
      </div>

      {/* Centered Stripe-Style Contract Approval Container (max-w 720px) */}
      <main className="w-full max-w-[720px] mx-auto flex flex-col gap-2xl">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-md pb-lg border-b border-outline-variant">
          <div className="flex items-center gap-md">
            <div className="w-8 h-8 rounded-lg bg-surface-card border border-outline-variant text-on-surface flex items-center justify-center shrink-0">
              <span className="font-label text-label-md">{project.agencyInitials}</span>
            </div>
            <div className="flex items-center gap-sm">
              <span className="font-headline text-headline-sm text-on-surface">
                {project.agencyName}
              </span>
              <span
                role="status"
                className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-emerald-container text-on-emerald-container whitespace-nowrap"
              >
                <span
                  className="material-symbols-outlined material-symbols-filled text-[14px]"
                  aria-hidden="true"
                >
                  verified
                </span>
                <span className="font-label text-label-sm whitespace-nowrap">Verified SOW</span>
              </span>
            </div>
          </div>

          <span className="font-mono text-mono-sm text-on-surface-variant bg-surface-card px-md py-xs rounded-md border border-outline-variant tabular-nums whitespace-nowrap">
            Change Request {proposal.requestId}
          </span>
        </header>

        {/* Title Block */}
        <section aria-label="Scope adjustment overview" className="flex flex-col gap-sm">
          <h1 className="font-headline text-headline-lg text-on-surface text-balance">
            Scope Adjustment Review — {project.name}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant text-pretty">
            {proposal.mode === 'swap'
              ? 'No budget increase required. Review the Phase 1 trade-off below.'
              : 'Formal SOW cap expansion request. Review the added hours and revised contract total below.'}
          </p>
        </section>

        {/* Before vs. After Comparison Card (2-Column Grid) */}
        <section
          aria-label="Scope trade-off comparison"
          className="bg-surface-card border border-outline-variant rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant">
            {/* Left Column: Adding to Phase 1 */}
            <div className="p-xl flex flex-col gap-lg">
              <div className="flex items-center justify-between gap-sm">
                <h2 className="font-headline text-headline-sm text-on-surface">
                  Adding to Phase 1
                </h2>
                <span className="font-mono text-mono-sm text-on-emerald-container bg-emerald-container px-sm py-xs rounded-md tabular-nums whitespace-nowrap">
                  +{totalAddingHrs} hrs
                </span>
              </div>

              <ul className="flex flex-col gap-md">
                {proposal.addingItems.map((item) => (
                  <li
                    key={item.id}
                    className="p-md rounded-lg bg-surface border border-outline-variant flex items-start gap-md"
                  >
                    <span
                      className="material-symbols-outlined text-[20px] text-emerald shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      add_circle
                    </span>
                    <div className="flex flex-col gap-xs min-w-0">
                      <span className="font-body text-body-md text-on-surface">{item.title}</span>
                      <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                        {item.hours} hrs allocated
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: Moving to Phase 2 or Baseline Retained */}
            <div className="p-xl flex flex-col gap-lg">
              {proposal.mode === 'swap' && proposal.movingOutDeliverableName ? (
                <>
                  <div className="flex items-center justify-between gap-sm">
                    <h2 className="font-headline text-headline-sm text-on-surface">
                      Moving to Phase 2
                    </h2>
                    <span className="font-mono text-mono-sm text-on-amber-container bg-amber-container px-sm py-xs rounded-md tabular-nums whitespace-nowrap">
                      -{proposal.movingOutHrs} hrs
                    </span>
                  </div>

                  <ul className="flex flex-col gap-md">
                    <li className="p-md rounded-lg bg-surface border border-outline-variant flex items-start gap-md">
                      <span
                        className="material-symbols-outlined text-[20px] text-amber shrink-0 mt-0.5"
                        aria-hidden="true"
                      >
                        arrow_circle_right
                      </span>
                      <div className="flex flex-col gap-xs min-w-0">
                        <span className="font-body text-body-md text-on-surface">
                          {proposal.movingOutDeliverableName}
                        </span>
                        <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                          {proposal.movingOutHrs} hrs deferred to Phase 2
                        </span>
                      </div>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-sm">
                    <h2 className="font-headline text-headline-sm text-on-surface">
                      Baseline SOW Retained
                    </h2>
                    <span className="font-mono text-mono-sm text-on-primary-container bg-primary-container px-sm py-xs rounded-md tabular-nums whitespace-nowrap">
                      0 hrs removed
                    </span>
                  </div>
                  <div className="p-md rounded-lg bg-surface border border-outline-variant flex items-start gap-md">
                    <span
                      className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      layers
                    </span>
                    <div className="flex flex-col gap-xs min-w-0">
                      <span className="font-body text-body-md text-on-surface">
                        All {project.deliverables.length} SOW Deliverables Kept
                      </span>
                      <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                        Expanded via paid amendment (+{formatINR(proposal.netCostChange)})
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Financial & Timeline Summary Strip (3 Crisp Metric Boxes) */}
        <section
          aria-label="Financial and timeline summary"
          className="grid grid-cols-1 sm:grid-cols-3 gap-lg items-stretch"
        >
          {/* Box 1: Net Cost Change */}
          <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-lg flex flex-col justify-between gap-sm">
            <span className="font-label text-label-md text-on-surface-variant">
              Net Cost Change
            </span>
            <span
              className={`font-mono text-mono-lg tabular-nums ${
                proposal.netCostChange === 0 ? 'text-emerald' : 'text-primary'
              }`}
            >
              {proposal.netCostChange === 0 ? '₹0' : `+${formatINR(proposal.netCostChange)}`}
            </span>
          </article>

          {/* Box 2: Revised Contract Total */}
          <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-lg flex flex-col justify-between gap-sm">
            <span className="font-label text-label-md text-on-surface-variant">
              Revised Contract Total
            </span>
            <span className="font-mono text-mono-lg text-on-surface tabular-nums">
              {formatINR(proposal.revisedContractTotal)}
            </span>
          </article>

          {/* Box 3: Launch Deadline Impact */}
          <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-lg flex flex-col justify-between gap-sm">
            <span className="font-label text-label-md text-on-surface-variant">
              Launch Deadline Impact
            </span>
            <span className="font-headline text-headline-sm text-on-surface">
              {proposal.launchDeadlineImpact}
            </span>
          </article>
        </section>

        {/* Approval Footer */}
        <section
          aria-label="Client approval confirmation"
          className="bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col gap-lg"
        >
          {proposal.status === 'approved' ? (
            <div className="flex flex-col gap-lg">
              <div className="p-lg rounded-lg bg-emerald-container border border-outline-variant flex items-start gap-md">
                <span className="material-symbols-outlined material-symbols-filled text-[22px] text-emerald shrink-0 mt-0.5">
                  verified
                </span>
                <div className="flex flex-col gap-xs">
                  <h3 className="font-headline text-headline-sm text-on-emerald-container">
                    {proposal.mode === 'swap'
                      ? 'Scope Swap Approved & Cryptographically Logged'
                      : 'Paid Add-On Approved & Cryptographically Logged'}
                  </h3>
                  <p className="font-body text-body-sm text-on-emerald-container">
                    Signed on {proposal.approvedAt} under verification hash{' '}
                    <span className="font-mono">{proposal.requestId}</span>. Both the Agency Scope
                    Dashboard and Immutable Audit Ledger have been updated.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-md">
                <button
                  type="button"
                  onClick={onResetApproval}
                  className="px-md py-sm rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle font-label text-label-md"
                >
                  Reset Approval State
                </button>
                <div className="flex items-center gap-md">
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="px-lg py-sm rounded-lg border border-outline-variant bg-surface-card text-on-surface hover:bg-surface-subtle font-label text-label-lg"
                  >
                    View Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('ledger')}
                    className="inline-flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover font-label text-label-lg"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    Open Audit Ledger
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {proposal.status === 'call_requested' && (
                <div className="p-md rounded-lg bg-amber-container border border-outline-variant flex items-start gap-md">
                  <span className="material-symbols-outlined text-[20px] text-amber shrink-0 mt-0.5">
                    call
                  </span>
                  <div className="flex flex-col gap-xs">
                    <span className="font-headline text-headline-sm text-on-amber-container">
                      Call Requested — {project.agencyName} Notified
                    </span>
                    <span className="font-body text-body-sm text-on-amber-container">
                      No SOW changes have been applied yet. You can still approve directly below once aligned.
                    </span>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-md cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-outline text-primary focus:ring-primary"
                />
                <span className="font-body text-body-md text-on-surface">
                  I confirm this scope {proposal.mode === 'swap' ? 'trade-off' : 'amendment'} for Phase 1 delivery
                </span>
              </label>

              <div className="flex flex-col items-center gap-md">
                <button
                  type="button"
                  disabled={!confirmed}
                  onClick={onApprove}
                  className="w-full inline-flex items-center justify-center gap-sm px-lg py-md rounded-lg bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    check
                  </span>
                  <span className="font-label text-label-lg whitespace-nowrap">
                    {proposal.mode === 'swap' ? 'Approve Scope Swap' : 'Approve Paid Add-On'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onRequestCall}
                  className="inline-flex items-center justify-center gap-xs px-md py-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-label text-label-md whitespace-nowrap">
                    Request Call to Discuss
                  </span>
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Minimal Trust Footer */}
      <footer className="w-full max-w-[720px] mx-auto pt-2xl flex flex-wrap items-center justify-between gap-md text-on-surface-variant">
        <div className="flex items-center gap-xs">
          <span
            className="material-symbols-outlined material-symbols-filled text-[16px] text-primary"
            aria-hidden="true"
          >
            verified_user
          </span>
          <span className="font-label text-label-sm">Protected by CSC Guardrail</span>
        </div>
        <span className="font-mono text-mono-sm tabular-nums">{project.sowCode}</span>
      </footer>
    </div>
  );
};
