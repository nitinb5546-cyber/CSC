import React, { useState } from 'react';
import { AuditCategory, AuditEvent, ProjectData } from '../types';
import { formatINR } from '../data/initialData';

interface AuditLedgerProps {
  project: ProjectData;
  onSelectEvent: (event: AuditEvent) => void;
  onDownloadPdf: () => void;
}

type FilterTab = 'all' | AuditCategory;

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  project,
  onSelectEvent,
  onDownloadPdf,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allCount = project.auditEvents.length;
  const swappedCount = project.auditEvents.filter((e) => e.category === 'swapped').length;
  const paidCount = project.auditEvents.filter((e) => e.category === 'paid').length;
  const deferredCount = project.auditEvents.filter((e) => e.category === 'deferred').length;

  const filteredEvents = project.auditEvents.filter((ev) => {
    const matchesTab = activeTab === 'all' || ev.category === activeTab;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ev.requestedChange.toLowerCase().includes(q) ||
      ev.resolutionDecision.toLowerCase().includes(q) ||
      ev.verificationCode.toLowerCase().includes(q) ||
      ev.verificationState.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const renderDecisionBadge = (ev: AuditEvent) => {
    if (ev.category === 'swapped') {
      return (
        <span
          role="status"
          className="inline-flex items-center px-md py-xs rounded-full bg-emerald-container text-on-emerald-container whitespace-nowrap"
        >
          <span className="font-label text-label-md whitespace-nowrap">
            {ev.resolutionDecision}
          </span>
        </span>
      );
    }
    if (ev.category === 'paid') {
      return (
        <span
          role="status"
          className="inline-flex items-center px-md py-xs rounded-full bg-primary-container text-on-primary-container whitespace-nowrap"
        >
          <span className="font-label text-label-md whitespace-nowrap">
            {ev.resolutionDecision}
          </span>
        </span>
      );
    }
    return (
      <span
        role="status"
        className="inline-flex items-center px-md py-xs rounded-full bg-surface-subtle text-on-surface-subtle whitespace-nowrap"
      >
        <span className="font-label text-label-md whitespace-nowrap">{ev.resolutionDecision}</span>
      </span>
    );
  };

  const renderImpactText = (ev: AuditEvent) => {
    const hrsPart = ev.netHours > 0 ? `+${ev.netHours} hrs` : `${ev.netHours} hrs`;
    const costPart = ev.netCost > 0 ? `+${formatINR(ev.netCost)}` : formatINR(ev.netCost);
    const colorClass =
      ev.category === 'swapped'
        ? 'text-on-emerald-container'
        : ev.category === 'paid'
        ? 'text-on-primary-container'
        : 'text-on-surface-variant';

    return (
      <span className={`font-mono text-mono-md tabular-nums whitespace-nowrap ${colorClass}`}>
        {hrsPart} / {costPart}
      </span>
    );
  };

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'all', label: `All Events (${allCount})` },
    { id: 'swapped', label: `Swapped ₹0 (${swappedCount})` },
    { id: 'paid', label: `Paid Add-Ons (${paidCount})` },
    { id: 'deferred', label: `Deferred (${deferredCount})` },
  ];

  return (
    <div className="flex flex-col gap-2xl">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-lg">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">
            Immutable Scope &amp; Change Ledger
          </h1>
          <p className="font-body text-body-sm text-on-surface-variant mt-xs">
            Tamper-evident record of all client scope decisions for {project.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            picture_as_pdf
          </span>
          <span className="font-label text-label-lg whitespace-nowrap">
            Download Client Handoff PDF
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <section
        aria-label="Ledger filters"
        className="flex flex-wrap items-center justify-between gap-lg"
      >
        <div className="flex flex-wrap items-center gap-sm" role="tablist" aria-label="Event categories">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center px-lg py-xs rounded-full transition-colors duration-150 ease-out whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-card text-on-surface-variant border border-outline-variant hover:bg-surface-subtle hover:text-on-surface'
                }`}
              >
                <span className="font-label text-label-md tabular-nums whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-[280px]">
          <label htmlFor="ledger-search" className="sr-only">
            Search audit ledger
          </label>
          <span
            className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-md top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="ledger-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hash or change..."
            className="w-full pl-[36px] pr-md py-sm rounded-lg border border-outline-variant bg-surface-card font-body text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </section>

      {/* Main Card: Audit Trail Data Table */}
      <section
        aria-label="Audit trail table"
        className="bg-surface-card border border-outline-variant rounded-xl overflow-hidden"
      >
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface">
                  <th scope="col" className="px-lg py-md text-on-surface-variant">
                    <span className="font-label text-label-md whitespace-nowrap">Timestamp</span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant">
                    <span className="font-label text-label-md whitespace-nowrap">
                      Requested Change
                    </span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant">
                    <span className="font-label text-label-md whitespace-nowrap">
                      Resolution Decision
                    </span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant text-right">
                    <span className="font-label text-label-md whitespace-nowrap">
                      Net Hour &amp; Cost Impact
                    </span>
                  </th>
                  <th scope="col" className="px-lg py-md text-on-surface-variant text-right">
                    <span className="font-label text-label-md whitespace-nowrap">
                      Verification Hash
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="hover:bg-surface transition-colors duration-150 ease-out cursor-pointer"
                  >
                    <td className="px-lg py-lg">
                      <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums whitespace-nowrap">
                        {ev.timestamp}
                      </span>
                    </td>
                    <td className="px-lg py-lg">
                      <span className="font-body text-body-md text-on-surface">
                        {ev.requestedChange}
                      </span>
                    </td>
                    <td className="px-lg py-lg">{renderDecisionBadge(ev)}</td>
                    <td className="px-lg py-lg text-right">{renderImpactText(ev)}</td>
                    <td className="px-lg py-lg text-right">
                      <span className="font-mono text-mono-sm text-on-surface tabular-nums whitespace-nowrap">
                        {ev.verificationCode} · {ev.verificationState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3xl flex flex-col items-center justify-center text-center gap-md">
            <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
              search_off
            </span>
            <div className="flex flex-col gap-xs">
              <h2 className="font-headline text-headline-sm text-on-surface">
                No matching scope events found
              </h2>
              <p className="font-body text-body-sm text-on-surface-variant">
                Try clearing your search query or switching to All Events.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
              className="px-lg py-sm rounded-lg border border-outline-variant bg-surface-card text-on-surface hover:bg-surface-subtle font-label text-label-md"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Bottom Verification Banner */}
      <aside
        aria-label="Cryptographic verification status"
        className="bg-emerald-container border border-outline-variant rounded-xl px-xl py-lg flex items-center gap-md"
      >
        <span
          className="material-symbols-outlined material-symbols-filled text-[20px] text-emerald shrink-0"
          aria-hidden="true"
        >
          verified
        </span>
        <p className="font-body text-body-md text-on-emerald-container tabular-nums">
          All {project.auditEvents.length} scope decisions cryptographically timestamped and synced
          with final SOW handoff summary.
        </p>
      </aside>
    </div>
  );
};
