import React, { useState } from 'react';
import { AuditEvent, ProjectData, SimulatorAnalysis } from '../types';
import { formatINR, SAMPLE_CLIENT_MESSAGES } from '../data/initialData';

interface SharePortalModalProps {
  project: ProjectData;
  onClose: () => void;
  onOpenPortal: () => void;
}

export const SharePortalModal: React.FC<SharePortalModalProps> = ({
  project,
  onClose,
  onOpenPortal,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?view=client-portal&sow=${project.sowCode}&req=${project.activeProposal.requestId.replace('#', '')}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-lg bg-on-surface/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-portal-title"
    >
      <div className="w-full max-w-[520px] bg-surface-card border border-outline-variant rounded-xl shadow-xl overflow-hidden">
        <div className="px-xl py-lg border-b border-outline-variant flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">ios_share</span>
            <h2 id="share-portal-title" className="font-headline text-headline-md text-on-surface">
              Share Client Approval Portal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-lg text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-xl flex flex-col gap-lg">
          <p className="font-body text-body-md text-on-surface-variant">
            Send this magic approval link to <strong className="font-medium text-on-surface">{project.clientName}</strong> for one-click sign-off on change request{' '}
            <span className="font-mono text-mono-sm text-on-surface">{project.activeProposal.requestId}</span>.
          </p>

          <div className="p-md rounded-lg bg-surface border border-outline-variant flex items-center justify-between gap-sm">
            <span className="font-mono text-mono-sm text-on-surface truncate select-all">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-md py-xs rounded-md bg-surface-card border border-outline-variant hover:bg-surface-subtle font-label text-label-md text-on-surface whitespace-nowrap shrink-0"
            >
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <div className="p-md rounded-lg bg-primary-container text-on-primary-container flex items-center justify-between gap-md">
            <span className="font-body text-body-sm">
              Proposal Mode:{' '}
              <strong>
                {project.activeProposal.mode === 'swap'
                  ? 'Scope Swap (₹0 Extra)'
                  : `Paid Add-On (+${formatINR(project.activeProposal.netCostChange)})`}
              </strong>
            </span>
            <span className="font-mono text-mono-sm tabular-nums">
              {project.sowCode}
            </span>
          </div>
        </div>

        <div className="px-xl py-md bg-surface border-t border-outline-variant flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-sm rounded-lg border border-outline-variant bg-surface-card text-on-surface hover:bg-surface-subtle font-label text-label-lg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPortal();
            }}
            className="inline-flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover font-label text-label-lg whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Open Client Portal Preview
          </button>
        </div>
      </div>
    </div>
  );
};

interface PasteMessageModalProps {
  project: ProjectData;
  onClose: () => void;
  onAnalyze: (message: string, source: SimulatorAnalysis['source']) => void;
}

export const PasteMessageModal: React.FC<PasteMessageModalProps> = ({
  project,
  onClose,
  onAnalyze,
}) => {
  const [text, setText] = useState(project.simulator.rawMessage);
  const [source, setSource] = useState<SimulatorAnalysis['source']>(project.simulator.source);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-lg bg-on-surface/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-msg-title"
    >
      <div className="w-full max-w-[600px] bg-surface-card border border-outline-variant rounded-xl shadow-xl overflow-hidden">
        <div className="px-xl py-lg border-b border-outline-variant flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">chat_bubble_outline</span>
            <h2 id="paste-msg-title" className="font-headline text-headline-md text-on-surface">
              Paste Incoming Client Message
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-lg text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-xl flex flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <label htmlFor="modal-msg-source" className="font-label text-label-md text-on-surface-variant">
              Channel Source
            </label>
            <select
              id="modal-msg-source"
              value={source}
              onChange={(e) => setSource(e.target.value as SimulatorAnalysis['source'])}
              className="rounded-lg border border-outline-variant bg-surface px-md py-xs font-body text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="WhatsApp / Slack">WhatsApp / Slack</option>
              <option value="Email">Email</option>
              <option value="Client Call Notes">Client Call Notes</option>
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label htmlFor="modal-client-msg" className="font-label text-label-md text-on-surface-variant">
              Client Request Text ({project.clientName})
            </label>
            <textarea
              id="modal-client-msg"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste WhatsApp, Slack, or email message from client..."
              className="w-full rounded-lg border border-outline-variant bg-surface p-md font-body text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <span className="font-label text-label-sm text-on-surface-variant">Quick Examples</span>
            <div className="flex flex-wrap gap-sm">
              {SAMPLE_CLIENT_MESSAGES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setText(sample.text);
                    setSource(sample.source);
                  }}
                  className="px-md py-xs rounded-lg border border-outline-variant bg-surface hover:bg-surface-subtle font-label text-label-sm text-on-surface transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-xl py-md bg-surface border-t border-outline-variant flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-sm rounded-lg border border-outline-variant bg-surface-card text-on-surface hover:bg-surface-subtle font-label text-label-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => {
              onAnalyze(text, source);
              onClose();
            }}
            className="inline-flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 font-label text-label-lg whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Analyze in Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

interface AuditReceiptModalProps {
  event: AuditEvent;
  project: ProjectData;
  onClose: () => void;
}

export const AuditReceiptModal: React.FC<AuditReceiptModalProps> = ({
  event,
  project,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyDigest = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(event.shaDigest).catch(() => {});
    }
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-lg bg-on-surface/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-receipt-title"
    >
      <div className="w-full max-w-[560px] bg-surface-card border border-outline-variant rounded-xl shadow-xl overflow-hidden">
        <div className="px-xl py-lg border-b border-outline-variant flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined material-symbols-filled text-[20px] text-emerald">
              verified
            </span>
            <h2 id="audit-receipt-title" className="font-headline text-headline-md text-on-surface">
              Cryptographic Scope Receipt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-lg text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-xl flex flex-col gap-lg">
          <div className="flex items-center justify-between gap-md pb-md border-b border-outline-variant">
            <div>
              <span className="font-label text-label-sm text-on-surface-variant block">
                Verification Hash
              </span>
              <span className="font-mono text-mono-lg text-on-surface tabular-nums">
                {event.verificationCode}
              </span>
            </div>
            <span className="inline-flex items-center px-md py-xs rounded-full bg-emerald-container text-on-emerald-container font-label text-label-md">
              {event.verificationState}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <dt className="font-label text-label-sm text-on-surface-variant">Requested Change</dt>
              <dd className="font-body text-body-md text-on-surface mt-xs">{event.requestedChange}</dd>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <dt className="font-label text-label-sm text-on-surface-variant">Resolution Decision</dt>
              <dd className="font-body text-body-md text-on-surface mt-xs">{event.resolutionDecision}</dd>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <dt className="font-label text-label-sm text-on-surface-variant">Timestamp</dt>
              <dd className="font-mono text-mono-sm text-on-surface tabular-nums mt-xs">{event.timestamp}</dd>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <dt className="font-label text-label-sm text-on-surface-variant">Net Impact</dt>
              <dd className="font-mono text-mono-sm text-on-surface tabular-nums mt-xs">
                {event.netHours > 0 ? `+${event.netHours} hrs` : `${event.netHours} hrs`} /{' '}
                {event.netCost > 0 ? `+${formatINR(event.netCost)}` : formatINR(event.netCost)}
              </dd>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <dt className="font-label text-label-sm text-on-surface-variant">Authorized Signer</dt>
              <dd className="font-body text-body-sm text-on-surface mt-xs">{event.actor}</dd>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <dt className="font-label text-label-sm text-on-surface-variant">SOW Reference</dt>
              <dd className="font-mono text-mono-sm text-on-surface mt-xs">{event.sowBaselineRef}</dd>
            </div>
          </dl>

          <div className="p-md rounded-lg bg-surface border border-outline-variant flex items-center justify-between gap-sm">
            <div className="min-w-0">
              <span className="font-label text-label-sm text-on-surface-variant block">
                SHA-256 Tamper-Evident Digest ({project.sowCode})
              </span>
              <span className="font-mono text-mono-sm text-on-surface truncate block">
                0x{event.shaDigest}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyDigest}
              className="px-md py-xs rounded-md border border-outline-variant bg-surface-card hover:bg-surface-subtle font-label text-label-sm text-on-surface whitespace-nowrap shrink-0"
            >
              {copiedHash ? 'Copied' : 'Copy Digest'}
            </button>
          </div>
        </div>

        <div className="px-xl py-md bg-surface border-t border-outline-variant flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover font-label text-label-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface HandoffPdfModalProps {
  project: ProjectData;
  onClose: () => void;
}

export const HandoffPdfModal: React.FC<HandoffPdfModalProps> = ({ project, onClose }) => {
  const handleDownloadCsv = () => {
    const header = ['Timestamp', 'Requested Change', 'Resolution Decision', 'Net Hours', 'Net Cost (INR)', 'Verification Code', 'Status', 'SHA Digest'];
    const rows = project.auditEvents.map((ev) => [
      `"${ev.timestamp}"`,
      `"${ev.requestedChange.replace(/"/g, '""')}"`,
      `"${ev.resolutionDecision.replace(/"/g, '""')}"`,
      ev.netHours,
      ev.netCost,
      ev.verificationCode,
      `"${ev.verificationState}"`,
      ev.shaDigest,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.sowCode}-handoff-ledger.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-lg bg-on-surface/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handoff-pdf-title"
    >
      <div className="w-full max-w-[760px] max-h-[90vh] flex flex-col bg-surface-card border border-outline-variant rounded-xl shadow-xl overflow-hidden">
        <div className="no-print px-xl py-lg border-b border-outline-variant flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">picture_as_pdf</span>
            <h2 id="handoff-pdf-title" className="font-headline text-headline-md text-on-surface">
              Client SOW Handoff Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-lg text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-xl overflow-y-auto flex flex-col gap-xl">
          <div className="flex flex-wrap items-start justify-between gap-md pb-lg border-b border-outline-variant">
            <div>
              <span className="font-label text-label-sm text-primary block">
                {project.agencyName} · Verified SOW Handoff Certificate
              </span>
              <h3 className="font-headline text-headline-lg text-on-surface mt-xs">
                {project.name}
              </h3>
              <p className="font-body text-body-sm text-on-surface-variant mt-xs">
                Client: {project.clientName} · Baseline Reference: {project.sowCode}
              </p>
            </div>
            <div className="text-right">
              <span className="font-label text-label-sm text-on-surface-variant block">
                Final Contract Value
              </span>
              <span className="font-mono text-mono-lg text-on-surface tabular-nums">
                {formatINR(project.fixedCap)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-md">
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <span className="font-label text-label-sm text-on-surface-variant block">Hours Cap</span>
              <span className="font-mono text-mono-md text-on-surface tabular-nums">
                {project.allocatedHours} / {project.capHours} hrs
              </span>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <span className="font-label text-label-sm text-on-surface-variant block">Margin Protected</span>
              <span className="font-mono text-mono-md text-emerald tabular-nums">
                {formatINR(project.marginProtected)}
              </span>
            </div>
            <div className="p-md rounded-lg bg-surface border border-outline-variant">
              <span className="font-label text-label-sm text-on-surface-variant block">Logged Decisions</span>
              <span className="font-mono text-mono-md text-on-surface tabular-nums">
                {project.auditEvents.length} verified events
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-headline text-headline-sm text-on-surface mb-sm">
              Immutable Change Log ({project.auditEvents.length})
            </h4>
            <div className="border border-outline-variant rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-outline-variant">
                    <th className="px-md py-sm font-label text-label-sm text-on-surface-variant">Date</th>
                    <th className="px-md py-sm font-label text-label-sm text-on-surface-variant">Change</th>
                    <th className="px-md py-sm font-label text-label-sm text-on-surface-variant">Decision</th>
                    <th className="px-md py-sm font-label text-label-sm text-on-surface-variant text-right">Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {project.auditEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td className="px-md py-sm font-mono text-mono-sm text-on-surface-variant tabular-nums whitespace-nowrap">
                        {ev.timestamp}
                      </td>
                      <td className="px-md py-sm font-body text-body-sm text-on-surface">
                        {ev.requestedChange}
                      </td>
                      <td className="px-md py-sm font-body text-body-sm text-on-surface-variant">
                        {ev.resolutionDecision}
                      </td>
                      <td className="px-md py-sm font-mono text-mono-sm text-on-surface text-right tabular-nums whitespace-nowrap">
                        {ev.verificationCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="no-print px-xl py-md bg-surface border-t border-outline-variant flex flex-wrap items-center justify-between gap-md">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-sm px-lg py-sm rounded-lg border border-outline-variant bg-surface-card text-on-surface hover:bg-surface-subtle font-label text-label-lg"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={onClose}
              className="px-lg py-sm rounded-lg border border-outline-variant bg-surface-card text-on-surface hover:bg-surface-subtle font-label text-label-lg"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover font-label text-label-lg"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
