import React from 'react';
import { AppView, DeliverableStatus, ProjectData, ScopeDriftAlert } from '../types';
import { formatINR } from '../data/initialData';

interface ScopeDashboardProps {
  project: ProjectData;
  onNavigate: (view: AppView) => void;
  onCycleDeliverableStatus: (deliverableId: string) => void;
  onSimulateSwapFromDeliverable: (deliverableId: string) => void;
  onInspectAlertInSimulator: (alert: ScopeDriftAlert) => void;
}

const STATUS_CYCLE: DeliverableStatus[] = ['Not Started', 'In Progress', 'Completed'];

export const ScopeDashboard: React.FC<ScopeDashboardProps> = ({
  project,
  onNavigate,
  onCycleDeliverableStatus,
  onSimulateSwapFromDeliverable,
  onInspectAlertInSimulator,
}) => {
  const remainingHours = Math.max(0, project.capHours - project.allocatedHours);
  const allocationPct = Math.min(
    100,
    Math.round((project.allocatedHours / project.capHours) * 1000) / 10
  );
  const swappableHours = project.deliverables
    .filter((d) => d.swappable && d.status !== 'Deferred to Phase 2')
    .reduce((sum, d) => sum + d.allocatedHrs, 0);

  const renderStatusBadge = (status: DeliverableStatus) => {
    if (status === 'Completed' || status === 'Added via Swap') {
      return (
        <span className="inline-flex items-center px-md py-xs rounded-full bg-emerald-container text-on-emerald-container whitespace-nowrap">
          <span className="font-label text-label-md whitespace-nowrap">{status}</span>
        </span>
      );
    }
    if (status === 'In Progress' || status === 'Paid Add-On') {
      return (
        <span className="inline-flex items-center px-md py-xs rounded-full bg-primary-container text-on-primary-container whitespace-nowrap">
          <span className="font-label text-label-md whitespace-nowrap">{status}</span>
        </span>
      );
    }
    if (status === 'Deferred to Phase 2') {
      return (
        <span className="inline-flex items-center px-md py-xs rounded-full bg-amber-container text-on-amber-container whitespace-nowrap">
          <span className="font-label text-label-md whitespace-nowrap">{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-md py-xs rounded-full bg-surface-subtle text-on-surface-subtle whitespace-nowrap">
        <span className="font-label text-label-md whitespace-nowrap">{status}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-2xl">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">
            Agency Scope Health Dashboard
          </h1>
          <p className="font-body text-body-sm text-on-surface-variant mt-xs">
            Real-time SOW cap tracking, deliverable swap buffer, and automated scope drift detection.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
            {project.sowCode}
          </span>
        </div>
      </div>

      {/* Top Row: 4 Bento KPI Cards */}
      <section
        aria-label="Scope health metrics"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-xl items-stretch"
      >
        {/* KPI 1: Contract Value */}
        <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col justify-between gap-md">
          <header className="flex items-center justify-between gap-sm">
            <h2 className="font-label text-label-md text-on-surface-variant">Contract Value</h2>
            <span
              className="material-symbols-outlined text-[18px] text-on-surface-variant"
              aria-hidden="true"
            >
              account_balance_wallet
            </span>
          </header>
          <div className="flex flex-col gap-xs">
            <p className="font-mono text-mono-lg text-on-surface tabular-nums">
              {formatINR(project.fixedCap)}
            </p>
            <p className="font-body text-body-sm text-on-surface-variant">Fixed SOW Cap</p>
          </div>
        </article>

        {/* KPI 2: Allocated Hours */}
        <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col justify-between gap-md">
          <header className="flex items-center justify-between gap-sm">
            <h2 className="font-label text-label-md text-on-surface-variant">Allocated Hours</h2>
            <span
              className="material-symbols-outlined text-[18px] text-on-surface-variant"
              aria-hidden="true"
            >
              schedule
            </span>
          </header>
          <div className="flex flex-col gap-sm">
            <p className="font-mono text-mono-lg text-on-surface tabular-nums">
              {project.allocatedHours} / {project.capHours} hrs
            </p>
            <div
              className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden"
              role="progressbar"
              aria-valuenow={project.allocatedHours}
              aria-valuemin={0}
              aria-valuemax={project.capHours}
              aria-label={`${project.allocatedHours} of ${project.capHours} hours allocated`}
            >
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  allocationPct > 95 ? 'bg-amber' : 'bg-emerald'
                }`}
                style={{ width: `${allocationPct}%` }}
              />
            </div>
            <p className="font-body text-body-sm text-on-surface-variant tabular-nums">
              {remainingHours} hrs remaining
            </p>
          </div>
        </article>

        {/* KPI 3: Pending Requests */}
        <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col justify-between gap-md">
          <header className="flex items-center justify-between gap-sm">
            <h2 className="font-label text-label-md text-on-surface-variant">Pending Requests</h2>
            <span
              className={`material-symbols-outlined text-[18px] ${
                project.pendingCount > 0 ? 'text-amber' : 'text-emerald'
              }`}
              aria-hidden="true"
            >
              pending_actions
            </span>
          </header>
          <div className="flex flex-col items-start gap-sm">
            {project.pendingCount > 0 ? (
              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="inline-flex items-center gap-xs px-md py-xs rounded-full bg-amber-container text-on-amber-container hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber" aria-hidden="true" />
                <span className="font-label text-label-md tabular-nums whitespace-nowrap">
                  {project.pendingCount} Unresolved
                </span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-xs px-md py-xs rounded-full bg-emerald-container text-on-emerald-container">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" aria-hidden="true" />
                <span className="font-label text-label-md whitespace-nowrap">All Resolved</span>
              </span>
            )}
            <p className="font-body text-body-sm text-on-surface-variant">
              Flagged against SOW baseline
            </p>
          </div>
        </article>

        {/* KPI 4: Margin Protected */}
        <article className="h-full bg-surface-card border border-outline-variant rounded-xl p-xl flex flex-col justify-between gap-md">
          <header className="flex items-center justify-between gap-sm">
            <h2 className="font-label text-label-md text-on-surface-variant">Margin Protected</h2>
            <span
              className="material-symbols-outlined text-[18px] text-emerald"
              aria-hidden="true"
            >
              shield
            </span>
          </header>
          <div className="flex flex-col gap-xs">
            <p className="font-mono text-mono-lg text-emerald tabular-nums">
              {formatINR(project.marginProtected)} Saved
            </p>
            <p className="font-body text-body-sm text-on-surface-variant tabular-nums">
              {project.creepCaughtCount} creep requests caught
            </p>
          </div>
        </article>
      </section>

      {/* Main Split Content (65% Left / 35% Right) */}
      <section
        aria-label="Deliverables and scope drift alerts"
        className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start"
      >
        {/* Left Card (8 cols): SOW Baseline Deliverables */}
        <div className="lg:col-span-8 bg-surface-card border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-xl py-lg border-b border-outline-variant flex flex-wrap items-center justify-between gap-md">
            <div>
              <h2 className="font-headline text-headline-md text-on-surface">
                SOW Baseline Deliverables
              </h2>
              <p className="font-body text-body-sm text-on-surface-variant mt-xs">
                Signed scope items and eligible hour-swap buffers under fixed cap.
              </p>
            </div>
            <span className="font-mono text-mono-sm text-on-surface-variant bg-surface px-md py-xs rounded-md border border-outline-variant tabular-nums whitespace-nowrap">
              {swappableHours} hrs swappable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface">
                  <th scope="col" className="px-lg py-md text-on-surface-variant">
                    <span className="font-label text-label-md whitespace-nowrap">Deliverable</span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant text-right">
                    <span className="font-label text-label-md whitespace-nowrap">
                      Allocated Hrs
                    </span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant">
                    <span className="font-label text-label-md whitespace-nowrap">Status</span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant text-right">
                    <span className="font-label text-label-md whitespace-nowrap">
                      Swap Eligibility
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {project.deliverables.map((item) => {
                  const canCycle = STATUS_CYCLE.includes(item.status);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface transition-colors duration-150 ease-out"
                    >
                      <td className="px-lg py-lg">
                        <span className="font-body text-body-md text-on-surface">{item.name}</span>
                      </td>
                      <td className="px-lg py-lg text-right">
                        <span className="font-mono text-mono-md text-on-surface tabular-nums whitespace-nowrap">
                          {item.allocatedHrs} hrs
                        </span>
                      </td>
                      <td className="px-lg py-lg">
                        {canCycle ? (
                          <button
                            type="button"
                            onClick={() => onCycleDeliverableStatus(item.id)}
                            title="Click to update deliverable progress"
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full hover:opacity-85 transition-opacity"
                          >
                            {renderStatusBadge(item.status)}
                          </button>
                        ) : (
                          renderStatusBadge(item.status)
                        )}
                      </td>
                      <td className="px-lg py-lg text-right">
                        {item.swappable && item.status !== 'Deferred to Phase 2' ? (
                          <button
                            type="button"
                            onClick={() => onSimulateSwapFromDeliverable(item.id)}
                            title="Simulate swapping this deliverable in Guardrail Simulator"
                            className="font-mono text-mono-sm inline-flex items-center gap-xs px-md py-xs rounded-md bg-emerald-container text-on-emerald-container hover:opacity-90 transition-opacity tabular-nums whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            Swappable ({item.allocatedHrs} hrs)
                          </button>
                        ) : (
                          <span className="font-body text-body-sm text-on-surface-variant inline-flex items-center gap-xs whitespace-nowrap">
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                              lock
                            </span>
                            {item.status === 'Deferred to Phase 2' ? 'Deferred' : 'Locked'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card (4 cols): Recent Scope Drift Alerts */}
        <div className="lg:col-span-4 bg-surface-card border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="px-xl py-lg border-b border-outline-variant flex items-center justify-between gap-md">
            <div>
              <h2 className="font-headline text-headline-md text-on-surface">
                Recent Scope Drift Alerts
              </h2>
              <p className="font-body text-body-sm text-on-surface-variant mt-xs">
                Client messages flagged against SOW baseline.
              </p>
            </div>
          </div>

          <div className="p-xl flex flex-col gap-xl">
            {project.alerts.map((alert) => {
              const dotColor =
                alert.severity === 'error'
                  ? 'bg-error'
                  : alert.severity === 'amber'
                  ? 'bg-amber'
                  : 'bg-emerald';

              const badgeBg =
                alert.severity === 'error'
                  ? 'bg-error-container text-on-error-container'
                  : alert.severity === 'amber'
                  ? 'bg-amber-container text-on-amber-container'
                  : 'bg-emerald-container text-on-emerald-container';

              const impactColor =
                alert.severity === 'error'
                  ? 'text-error'
                  : alert.severity === 'amber'
                  ? 'text-on-amber-container'
                  : 'text-on-emerald-container';

              const isClickable = Boolean(alert.sourceMessage);

              return (
                <article
                  key={alert.id}
                  onClick={() => isClickable && onInspectAlertInSimulator(alert)}
                  className={`relative pl-xl border-l border-outline-variant flex flex-col gap-sm ${
                    isClickable ? 'cursor-pointer group' : ''
                  }`}
                >
                  <span
                    className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-surface-card`}
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between gap-sm">
                    <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                      {alert.timestamp}
                    </span>
                    <span
                      role="status"
                      className={`inline-flex items-center px-sm py-xs rounded-full whitespace-nowrap ${badgeBg}`}
                    >
                      <span className="font-label text-label-sm whitespace-nowrap">
                        {alert.statusLabel}
                      </span>
                    </span>
                  </div>
                  <p
                    className={`font-body text-body-md text-on-surface text-pretty ${
                      isClickable ? 'group-hover:text-primary transition-colors' : ''
                    }`}
                  >
                    {alert.summary}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-sm pt-xs">
                    <span className={`font-mono text-mono-sm tabular-nums ${impactColor}`}>
                      {alert.impactText}
                    </span>
                    <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                      {alert.auditCode}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <footer className="px-xl py-md bg-surface border-t border-outline-variant flex items-center justify-between">
            <span className="font-body text-body-sm text-on-surface-variant tabular-nums">
              {project.alerts.length} alerts this sprint
            </span>
            <button
              type="button"
              onClick={() => onNavigate('ledger')}
              className="inline-flex items-center gap-xs text-primary hover:text-primary-hover transition-colors duration-150 ease-out whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <span className="font-label text-label-md whitespace-nowrap">Open Audit Ledger</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
};
