import { useState } from 'react';
import {
  AppView,
  AuditEvent,
  ClientApprovalProposal,
  Deliverable,
  DeliverableStatus,
  ProjectData,
  ScopeDriftAlert,
  SimulatorAnalysis,
} from './types';
import {
  INITIAL_PROJECTS,
  analyzeClientMessage,
  formatCurrentTimestamp,
  formatINR,
  generateHashCode,
  generateShaDigest,
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ScopeDashboard } from './components/ScopeDashboard';
import { GuardrailSimulator } from './components/GuardrailSimulator';
import { ClientApprovalPortal } from './components/ClientApprovalPortal';
import { AuditLedger } from './components/AuditLedger';
import {
  AuditReceiptModal,
  HandoffPdfModal,
  PasteMessageModal,
  SharePortalModal,
} from './components/Modals';

const STATUS_CYCLE: DeliverableStatus[] = ['Not Started', 'In Progress', 'Completed'];

export default function App() {
  const [projects, setProjects] = useState<ProjectData[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [activeView, setActiveView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'client-portal' ? 'portal' : 'dashboard';
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [preselectedSwapId, setPreselectedSwapId] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [selectedAuditEvent, setSelectedAuditEvent] = useState<AuditEvent | null>(null);
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; targetView?: AppView } | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const triggerToast = (
    message: string,
    actionLabel?: string,
    targetView?: AppView
  ) => {
    setToast({ message, actionLabel, targetView });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  const updateActiveProject = (updater: (proj: ProjectData) => ProjectData) => {
    setProjects((prev) =>
      prev.map((proj) => (proj.id === activeProject.id ? updater(proj) : proj))
    );
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setPreselectedSwapId(null);
  };

  const handleCycleDeliverableStatus = (deliverableId: string) => {
    updateActiveProject((proj) => ({
      ...proj,
      deliverables: proj.deliverables.map((d) => {
        if (d.id !== deliverableId) return d;
        const idx = STATUS_CYCLE.indexOf(d.status);
        if (idx === -1) return d;
        const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        return { ...d, status: nextStatus };
      }),
    }));
  };

  const handleSimulateSwapFromDeliverable = (deliverableId: string) => {
    setPreselectedSwapId(deliverableId);
    setActiveView('simulator');
  };

  const handleInspectAlertInSimulator = (alert: ScopeDriftAlert) => {
    if (!alert.sourceMessage) return;
    const analysis = analyzeClientMessage(
      alert.sourceMessage,
      activeProject,
      activeProject.simulator.source
    );
    updateActiveProject((proj) => ({
      ...proj,
      simulator: analysis,
    }));
    setActiveView('simulator');
  };

  const handleAnalyzeMessage = (
    rawMessage: string,
    source: SimulatorAnalysis['source']
  ) => {
    const analysis = analyzeClientMessage(rawMessage, activeProject, source);
    updateActiveProject((proj) => ({
      ...proj,
      simulator: analysis,
    }));
    if (activeView !== 'simulator') {
      setActiveView('simulator');
    }
    triggerToast(
      `Detected ${analysis.driftItems.length} out-of-scope item${
        analysis.driftItems.length === 1 ? '' : 's'
      } (+${analysis.totalDriftHrs} hrs).`
    );
  };

  const handleApplyScopeSwap = (swapDeliverableId: string) => {
    const targetDeliverable = activeProject.deliverables.find(
      (d) => d.id === swapDeliverableId
    );
    if (!targetDeliverable) return;

    const { simulator } = activeProject;
    const unabsorbedHours = Math.max(
      0,
      simulator.totalDriftHrs - targetDeliverable.allocatedHrs
    );
    const extraCost = unabsorbedHours * activeProject.hourlyRate;
    const requestId = generateHashCode();

    const proposal: ClientApprovalProposal = {
      requestId,
      mode: 'swap',
      status: 'pending',
      addingItems: simulator.driftItems,
      movingOutDeliverableId: targetDeliverable.id,
      movingOutDeliverableName: targetDeliverable.name,
      movingOutHrs: targetDeliverable.allocatedHrs,
      netHrsChange: simulator.totalDriftHrs - targetDeliverable.allocatedHrs,
      netCostChange: extraCost,
      revisedContractTotal: activeProject.fixedCap + extraCost,
      launchDeadlineImpact: 'None (On Schedule)',
    };

    updateActiveProject((proj) => ({
      ...proj,
      activeProposal: proposal,
    }));
    setActiveView('portal');
    triggerToast(
      `Prepared Scope Swap ${requestId} for ${activeProject.clientName} approval.`
    );
  };

  const handleGeneratePaidAddon = () => {
    const { simulator } = activeProject;
    const requestId = generateHashCode();

    const proposal: ClientApprovalProposal = {
      requestId,
      mode: 'paid',
      status: 'pending',
      addingItems: simulator.driftItems,
      movingOutDeliverableId: null,
      movingOutDeliverableName: null,
      movingOutHrs: 0,
      netHrsChange: simulator.totalDriftHrs,
      netCostChange: simulator.totalDriftCost,
      revisedContractTotal: activeProject.fixedCap + simulator.totalDriftCost,
      launchDeadlineImpact: `+${simulator.timelineExtraDays} Days Timeline`,
    };

    updateActiveProject((proj) => ({
      ...proj,
      activeProposal: proposal,
    }));
    setActiveView('portal');
    triggerToast(
      `Prepared Paid Add-On ${requestId} (+${formatINR(simulator.totalDriftCost)}).`
    );
  };

  const handleDeferToPhase2 = () => {
    const { simulator } = activeProject;
    const verificationCode = generateHashCode();
    const timestamp = formatCurrentTimestamp();
    const requestedSummary = simulator.driftItems.map((i) => i.title).join(' + ');

    const newEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp,
      requestedChange: requestedSummary || 'Custom Scope Request',
      resolutionDecision: 'Deferred to Phase 2',
      category: 'deferred',
      netHours: 0,
      netCost: 0,
      verificationCode,
      verificationState: 'Logged',
      shaDigest: generateShaDigest(`${verificationCode}-${requestedSummary}-${timestamp}`),
      sowBaselineRef: `${activeProject.sowCode} · Backlog`,
      actor: `Ananya Rao (${activeProject.agencyName})`,
    };

    updateActiveProject((proj) => ({
      ...proj,
      pendingCount: Math.max(0, proj.pendingCount - 1),
      marginProtected: proj.marginProtected + simulator.totalDriftCost,
      creepCaughtCount: proj.creepCaughtCount + 1,
      auditEvents: [newEvent, ...proj.auditEvents],
      alerts: [
        {
          id: `alert-${Date.now()}`,
          auditCode: verificationCode.replace('#', ''),
          timestamp: '[Just now]',
          statusLabel: 'Deferred',
          severity: 'emerald',
          summary: `${requestedSummary} deferred to Phase 2`,
          impactText: `Protected ${formatINR(simulator.totalDriftCost)} (0 hrs net)`,
          extraHrs: 0,
          extraCost: 0,
        },
        ...proj.alerts.slice(0, 2),
      ],
    }));

    triggerToast(
      `Deferred to Phase 2 (${verificationCode}). Protected ${formatINR(
        simulator.totalDriftCost
      )}.`,
      'View Audit Ledger',
      'ledger'
    );
  };

  const handleClientApprove = () => {
    const proposal = activeProject.activeProposal;
    if (proposal.status === 'approved') return;

    const approvedAt = formatCurrentTimestamp();
    const requestedSummary = proposal.addingItems.map((i) => i.title).join(' + ');
    const totalAddedHrs = proposal.addingItems.reduce((s, i) => s + i.hours, 0);

    const newAuditEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: approvedAt,
      requestedChange: requestedSummary,
      resolutionDecision:
        proposal.mode === 'swap'
          ? `Swapped w/ ${proposal.movingOutDeliverableName}`
          : 'Paid Add-On Approved',
      category: proposal.mode === 'swap' ? 'swapped' : 'paid',
      netHours: proposal.mode === 'swap' ? Math.max(0, proposal.netHrsChange) : totalAddedHrs,
      netCost: proposal.netCostChange,
      verificationCode: proposal.requestId,
      verificationState: proposal.mode === 'swap' ? 'Client Approved' : 'Signed',
      shaDigest: generateShaDigest(`${proposal.requestId}-${requestedSummary}-${approvedAt}`),
      sowBaselineRef:
        proposal.mode === 'swap'
          ? `${activeProject.sowCode} · Swap Amendment`
          : `${activeProject.sowCode} · Paid Amendment`,
      actor: `Client Sign-off (${activeProject.clientName})`,
    };

    updateActiveProject((proj) => {
      const updatedDeliverables: Deliverable[] = proj.deliverables.map((d) => {
        if (proposal.mode === 'swap' && d.id === proposal.movingOutDeliverableId) {
          return { ...d, status: 'Deferred to Phase 2', swappable: false };
        }
        return d;
      });

      const addedDeliverables: Deliverable[] = proposal.addingItems.map((item, idx) => ({
        id: `del-added-${Date.now()}-${idx}`,
        index: updatedDeliverables.length + idx + 1,
        name: item.title,
        allocatedHrs: item.hours,
        status: proposal.mode === 'swap' ? 'Added via Swap' : 'Paid Add-On',
        swappable: false,
        keywords: [],
      }));

      const nextFixedCap =
        proposal.mode === 'paid'
          ? proj.fixedCap + proposal.netCostChange
          : proj.fixedCap + Math.max(0, proposal.netCostChange);

      const nextCapHours =
        proposal.mode === 'paid' ? proj.capHours + totalAddedHrs : proj.capHours;

      const nextAllocatedHours =
        proposal.mode === 'swap'
          ? Math.max(0, proj.allocatedHours - proposal.movingOutHrs + totalAddedHrs)
          : proj.allocatedHours + totalAddedHrs;

      const savedAmount =
        proposal.mode === 'swap'
          ? proposal.addingItems.reduce((s, i) => s + i.cost, 0)
          : 0;

      // Replace existing audit event if same verification code exists, else prepend
      const existsIdx = proj.auditEvents.findIndex(
        (ev) => ev.verificationCode === proposal.requestId
      );
      const nextAuditEvents =
        existsIdx >= 0
          ? proj.auditEvents.map((ev, i) => (i === existsIdx ? newAuditEvent : ev))
          : [newAuditEvent, ...proj.auditEvents];

      return {
        ...proj,
        fixedCap: nextFixedCap,
        capHours: nextCapHours,
        allocatedHours: nextAllocatedHours,
        pendingCount: Math.max(0, proj.pendingCount - 1),
        marginProtected: proj.marginProtected + savedAmount,
        creepCaughtCount: proj.creepCaughtCount + 1,
        deliverables: [...updatedDeliverables, ...addedDeliverables],
        auditEvents: nextAuditEvents,
        alerts: [
          {
            id: `alert-${Date.now()}`,
            auditCode: proposal.requestId.replace('#', ''),
            timestamp: '[Just now]',
            statusLabel: proposal.mode === 'swap' ? 'Swapped' : 'Paid Add-On',
            severity: 'emerald',
            summary:
              proposal.mode === 'swap'
                ? `${requestedSummary} swapped w/ ${proposal.movingOutDeliverableName}`
                : `${requestedSummary} approved as Paid Add-On`,
            impactText:
              proposal.mode === 'swap'
                ? `Protected ${formatINR(savedAmount)} (0 hrs net)`
                : `+${totalAddedHrs} hrs (+${formatINR(proposal.netCostChange)})`,
            extraHrs: proposal.mode === 'swap' ? 0 : totalAddedHrs,
            extraCost: proposal.netCostChange,
          },
          ...proj.alerts.slice(0, 2),
        ],
        activeProposal: {
          ...proposal,
          status: 'approved',
          approvedAt,
        },
      };
    });

    triggerToast(`Client approval ${proposal.requestId} signed and logged to Audit Ledger.`);
  };

  const handleRequestCall = () => {
    updateActiveProject((proj) => ({
      ...proj,
      activeProposal: {
        ...proj.activeProposal,
        status: 'call_requested',
      },
    }));
    triggerToast(`Call request logged for ${activeProject.agencyName}.`);
  };

  const handleResetProposalApproval = () => {
    updateActiveProject((proj) => ({
      ...proj,
      activeProposal: {
        ...proj.activeProposal,
        status: 'pending',
        approvedAt: undefined,
      },
    }));
  };

  return (
    <>
      {activeView === 'portal' ? (
        <ClientApprovalPortal
          project={activeProject}
          onApprove={handleClientApprove}
          onRequestCall={handleRequestCall}
          onResetApproval={handleResetProposalApproval}
          onNavigate={setActiveView}
        />
      ) : (
        <div className="min-h-screen flex bg-surface">
          <Sidebar
            activeView={activeView}
            onNavigate={setActiveView}
            agencyName={activeProject.agencyName}
            agencyInitials={activeProject.agencyInitials}
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            pendingCount={activeProject.pendingCount}
          />

          <div className="flex-1 min-w-0 flex flex-col">
            <TopBar
              projects={projects}
              activeProject={activeProject}
              onSelectProject={handleSelectProject}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              onSharePortal={() => setShowShareModal(true)}
              onPasteMessage={() => setShowPasteModal(true)}
            />

            <main className="flex-1 p-lg lg:p-page max-w-[1440px] w-full mx-auto">
              {activeView === 'dashboard' && (
                <ScopeDashboard
                  project={activeProject}
                  onNavigate={setActiveView}
                  onCycleDeliverableStatus={handleCycleDeliverableStatus}
                  onSimulateSwapFromDeliverable={handleSimulateSwapFromDeliverable}
                  onInspectAlertInSimulator={handleInspectAlertInSimulator}
                />
              )}

              {activeView === 'simulator' && (
                <GuardrailSimulator
                  project={activeProject}
                  preselectedSwapId={preselectedSwapId}
                  onAnalyzeMessage={handleAnalyzeMessage}
                  onApplyScopeSwap={handleApplyScopeSwap}
                  onGeneratePaidAddon={handleGeneratePaidAddon}
                  onDeferToPhase2={handleDeferToPhase2}
                />
              )}

              {activeView === 'ledger' && (
                <AuditLedger
                  project={activeProject}
                  onSelectEvent={(ev) => setSelectedAuditEvent(ev)}
                  onDownloadPdf={() => setShowHandoffModal(true)}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Modals */}
      {showShareModal && (
        <SharePortalModal
          project={activeProject}
          onClose={() => setShowShareModal(false)}
          onOpenPortal={() => setActiveView('portal')}
        />
      )}

      {showPasteModal && (
        <PasteMessageModal
          project={activeProject}
          onClose={() => setShowPasteModal(false)}
          onAnalyze={handleAnalyzeMessage}
        />
      )}

      {selectedAuditEvent && (
        <AuditReceiptModal
          event={selectedAuditEvent}
          project={activeProject}
          onClose={() => setSelectedAuditEvent(null)}
        />
      )}

      {showHandoffModal && (
        <HandoffPdfModal
          project={activeProject}
          onClose={() => setShowHandoffModal(false)}
        />
      )}

      {/* Non-blocking Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-lg right-lg z-50 max-w-[420px] bg-on-surface text-surface-card rounded-xl shadow-lg px-lg py-md flex items-center justify-between gap-md border border-outline-variant/20"
        >
          <span className="font-body text-body-sm">{toast.message}</span>
          {toast.actionLabel && toast.targetView && (
            <button
              type="button"
              onClick={() => {
                setActiveView(toast.targetView!);
                setToast(null);
              }}
              className="font-label text-label-sm text-primary-container hover:underline whitespace-nowrap shrink-0"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </>
  );
}
