export type AppView = 'dashboard' | 'simulator' | 'portal' | 'ledger';

export type DeliverableStatus =
  | 'Completed'
  | 'In Progress'
  | 'Not Started'
  | 'Deferred to Phase 2'
  | 'Added via Swap'
  | 'Paid Add-On';

export interface Deliverable {
  id: string;
  index: number;
  name: string;
  allocatedHrs: number;
  status: DeliverableStatus;
  swappable: boolean;
  keywords: string[];
}

export type AlertSeverity = 'error' | 'amber' | 'emerald';
export type AlertStatusLabel = 'Out-of-Scope' | 'Pending Swap' | 'Swapped' | 'Paid Add-On' | 'Deferred';

export interface ScopeDriftAlert {
  id: string;
  auditCode: string;
  timestamp: string;
  statusLabel: AlertStatusLabel;
  severity: AlertSeverity;
  summary: string;
  impactText: string;
  extraHrs: number;
  extraCost: number;
  sourceMessage?: string;
}

export interface InScopeMatch {
  id: string;
  title: string;
  matchedDeliverable: string;
  extraHrs: number;
}

export interface DriftItem {
  id: string;
  title: string;
  hours: number;
  cost: number;
}

export interface SimulatorAnalysis {
  simCode: string;
  source: 'WhatsApp / Slack' | 'Email' | 'Client Call Notes';
  rawMessage: string;
  inScopeMatches: InScopeMatch[];
  driftItems: DriftItem[];
  totalDriftHrs: number;
  totalDriftCost: number;
  timelineExtraDays: number;
}

export type ApprovalMode = 'swap' | 'paid';
export type ApprovalStatus = 'pending' | 'approved' | 'call_requested';

export interface ClientApprovalProposal {
  requestId: string;
  mode: ApprovalMode;
  status: ApprovalStatus;
  addingItems: DriftItem[];
  movingOutDeliverableId: string | null;
  movingOutDeliverableName: string | null;
  movingOutHrs: number;
  netHrsChange: number;
  netCostChange: number;
  revisedContractTotal: number;
  launchDeadlineImpact: string;
  approvedAt?: string;
  verificationNote?: string;
}

export type AuditCategory = 'swapped' | 'paid' | 'deferred';

export interface AuditEvent {
  id: string;
  timestamp: string;
  requestedChange: string;
  resolutionDecision: string;
  category: AuditCategory;
  netHours: number;
  netCost: number;
  verificationCode: string;
  verificationState: string;
  shaDigest: string;
  sowBaselineRef: string;
  actor: string;
}

export interface ProjectData {
  id: string;
  name: string;
  clientName: string;
  agencyName: string;
  agencyInitials: string;
  sowCode: string;
  fixedCap: number;
  capHours: number;
  allocatedHours: number;
  hourlyRate: number;
  pendingCount: number;
  marginProtected: number;
  creepCaughtCount: number;
  sprintAlertCount: number;
  launchDayLabel: string;
  deliverables: Deliverable[];
  alerts: ScopeDriftAlert[];
  simulator: SimulatorAnalysis;
  activeProposal: ClientApprovalProposal;
  auditEvents: AuditEvent[];
}
