import {
  DriftItem,
  InScopeMatch,
  ProjectData,
  SimulatorAnalysis,
} from '../types';

export function formatINR(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('en-IN');
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function generateHashCode(): string {
  const num = Math.floor(893 + Math.random() * 105);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letter = chars[Math.floor(Math.random() * chars.length)];
  return `#CSC-${num}${letter}`;
}

export function generateShaDigest(seed: string): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part1.split('').reverse().join('')}${part2.split('').reverse().join('')}`;
}

export function formatCurrentTimestamp(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  let hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;
}

interface PatternRule {
  pattern: RegExp;
  title: string;
  hours: number;
}

const DRIFT_PATTERNS: PatternRule[] = [
  { pattern: /whatsapp|otp|2fa|sms/i, title: 'WhatsApp / SMS 2FA OTP', hours: 6 },
  { pattern: /excel|csv|spreadsheet|order export|export/i, title: 'Excel & CSV Order Export', hours: 8 },
  { pattern: /multi[- ]?currency|usd|eur|forex|currency/i, title: 'Multi-Currency Pricing Engine', hours: 10 },
  { pattern: /gst|invoice|tax pdf|billing pdf/i, title: 'Automated GST Invoice PDF Export', hours: 8 },
  { pattern: /dark mode|theme switch|night mode/i, title: 'System-Wide Dark Mode Theme', hours: 6 },
  { pattern: /ai|chatbot|assistant|recommendation/i, title: 'AI Shopping Assistant Widget', hours: 16 },
  { pattern: /loyalty|points|wallet|rewards/i, title: 'Customer Loyalty & Wallet Credits', hours: 12 },
  { pattern: /apple pay|upi autopay|subscription|recurring/i, title: 'Recurring Billing & Autopay', hours: 10 },
  { pattern: /erp|sap|zoho|tally|webhook|sync/i, title: 'ERP / Inventory Webhook Sync', hours: 14 },
  { pattern: /sso|saml|google login|oauth/i, title: 'Enterprise SSO / SAML Auth', hours: 8 },
  { pattern: /push notification|mobile app|pwa/i, title: 'Web Push Notifications & PWA', hours: 9 },
  { pattern: /bulk|wholesale|b2b|tier pricing/i, title: 'B2B Wholesale Tier Pricing', hours: 12 },
];

export function analyzeClientMessage(
  message: string,
  project: ProjectData,
  source: SimulatorAnalysis['source'] = project.simulator.source
): SimulatorAnalysis {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Find In-Scope matches from project deliverables
  const inScopeMatches: InScopeMatch[] = [];
  for (const del of project.deliverables) {
    if (del.status === 'Deferred to Phase 2') continue;
    const hit = del.keywords.some((kw) => lower.includes(kw.toLowerCase()));
    if (hit) {
      inScopeMatches.push({
        id: `in-${del.id}`,
        title:
          del.name === 'Auth & Email Login'
            ? 'Standard User Authentication'
            : `Baseline ${del.name}`,
        matchedDeliverable: `Matched to SOW Item #${del.index} (${del.name})`,
        extraHrs: 0,
      });
    }
  }

  if (inScopeMatches.length === 0 && project.deliverables.length > 0) {
    const fallbackDel = project.deliverables[0];
    inScopeMatches.push({
      id: `in-fallback-${fallbackDel.id}`,
      title:
        fallbackDel.name === 'Auth & Email Login'
          ? 'Standard User Authentication'
          : `Baseline ${fallbackDel.name}`,
      matchedDeliverable: `Matched to SOW Item #${fallbackDel.index} (${fallbackDel.name})`,
      extraHrs: 0,
    });
  }

  // 2. Detect out-of-scope drift items
  const driftItems: DriftItem[] = [];
  const seenTitles = new Set<string>();

  for (const rule of DRIFT_PATTERNS) {
    if (rule.pattern.test(trimmed) && !seenTitles.has(rule.title)) {
      seenTitles.add(rule.title);
      driftItems.push({
        id: `drift-${driftItems.length + 1}`,
        title: rule.title,
        hours: rule.hours,
        cost: rule.hours * project.hourlyRate,
      });
    }
  }

  // Fallback parser if user typed a custom message without known pattern keywords
  if (driftItems.length === 0 && trimmed.length > 0) {
    const clauses = trimmed
      .split(/[,.;!?]|\band\b|\bplus\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
    const chosen = clauses.slice(0, 2);
    if (chosen.length === 0) {
      driftItems.push({
        id: 'drift-custom-1',
        title: 'Unscoped Custom Feature Addition',
        hours: 8,
        cost: 8 * project.hourlyRate,
      });
    } else {
      chosen.forEach((clause, idx) => {
        const cleanLabel =
          clause.length > 42 ? `${clause.slice(0, 39)}...` : clause;
        const hrs = idx === 0 ? 6 : 8;
        driftItems.push({
          id: `drift-custom-${idx + 1}`,
          title: cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1),
          hours: hrs,
          cost: hrs * project.hourlyRate,
        });
      });
    }
  }

  const totalDriftHrs = driftItems.reduce((sum, item) => sum + item.hours, 0);
  const totalDriftCost = driftItems.reduce((sum, item) => sum + item.cost, 0);
  const timelineExtraDays = Math.max(1, Math.ceil(totalDriftHrs / 5));

  return {
    simCode: project.simulator.simCode,
    source,
    rawMessage: message,
    inScopeMatches,
    driftItems,
    totalDriftHrs,
    totalDriftCost,
    timelineExtraDays,
  };
}

export const SAMPLE_CLIENT_MESSAGES: Array<{
  label: string;
  source: SimulatorAnalysis['source'];
  text: string;
}> = [
  {
    label: 'WhatsApp OTP + Excel Export (Default)',
    source: 'WhatsApp / Slack',
    text: "Hey team, quick thing—before Friday's launch can we also add WhatsApp OTP login and an Excel order export for our accounts team? Shouldn't take long!",
  },
  {
    label: 'Multi-Currency + Automated GST PDF',
    source: 'Email',
    text: 'Hi PixelCraft, our finance director asked if checkout can support multi-currency USD/EUR pricing and an automated GST invoice PDF export before go-live.',
  },
  {
    label: 'AI Chatbot + Dark Mode',
    source: 'WhatsApp / Slack',
    text: 'Quick idea from the founder: can we slip in an AI shopping assistant chatbot and full dark mode theme switcher into the product catalog page this sprint?',
  },
];

export const INITIAL_PROJECTS: ProjectData[] = [
  {
    id: 'proj-vastrakart',
    name: 'VastraKart Store Redesign',
    clientName: 'VastraKart',
    agencyName: 'PixelCraft Studio',
    agencyInitials: 'PS',
    sowCode: 'SOW-VK-2026-04',
    fixedCap: 150000,
    capHours: 120,
    allocatedHours: 86,
    hourlyRate: 1250,
    pendingCount: 2,
    marginProtected: 28500,
    creepCaughtCount: 3,
    sprintAlertCount: 3,
    launchDayLabel: "Friday's release",
    deliverables: [
      {
        id: 'del-vk-1',
        index: 1,
        name: 'Auth & Email Login',
        allocatedHrs: 8,
        status: 'Completed',
        swappable: false,
        keywords: ['login', 'auth', 'sign in', 'email'],
      },
      {
        id: 'del-vk-2',
        index: 2,
        name: 'Product Catalog & Filters',
        allocatedHrs: 28,
        status: 'In Progress',
        swappable: false,
        keywords: ['catalog', 'product', 'filter', 'search'],
      },
      {
        id: 'del-vk-3',
        index: 3,
        name: 'Razorpay Checkout',
        allocatedHrs: 16,
        status: 'Not Started',
        swappable: false,
        keywords: ['checkout', 'razorpay', 'payment', 'cart'],
      },
      {
        id: 'del-vk-4',
        index: 4,
        name: 'Blog & Content CMS',
        allocatedHrs: 14,
        status: 'Not Started',
        swappable: true,
        keywords: ['blog', 'cms', 'content'],
      },
      {
        id: 'del-vk-5',
        index: 5,
        name: 'Custom Analytics Reports',
        allocatedHrs: 10,
        status: 'Not Started',
        swappable: true,
        keywords: ['analytics', 'reports', 'metrics'],
      },
    ],
    alerts: [
      {
        id: 'alert-vk-1',
        auditCode: 'AUD-1042',
        timestamp: '[10:42 AM]',
        statusLabel: 'Out-of-Scope',
        severity: 'error',
        summary: 'WhatsApp OTP & Excel Export requested',
        impactText: 'Flagged +14 hrs (+₹17,500)',
        extraHrs: 14,
        extraCost: 17500,
        sourceMessage:
          "Hey team, quick thing—before Friday's launch can we also add WhatsApp OTP login and an Excel order export for our accounts team? Shouldn't take long!",
      },
      {
        id: 'alert-vk-2',
        auditCode: 'AUD-1039',
        timestamp: '[Yesterday, 4:18 PM]',
        statusLabel: 'Pending Swap',
        severity: 'amber',
        summary: 'Multi-currency GST invoice PDF export',
        impactText: 'Flagged +8 hrs (+₹10,000)',
        extraHrs: 8,
        extraCost: 10000,
        sourceMessage:
          'Can we include multi-currency GST invoice PDF export for international wholesale buyers before launch?',
      },
      {
        id: 'alert-vk-3',
        auditCode: 'AUD-1031',
        timestamp: '[Nov 23, 11:05 AM]',
        statusLabel: 'Swapped',
        severity: 'emerald',
        summary: 'Custom loyalty tier rules swapped into buffer',
        impactText: 'Protected ₹11,000 (0 hrs net)',
        extraHrs: 0,
        extraCost: 0,
      },
    ],
    simulator: {
      simCode: 'SIM-VK-1042',
      source: 'WhatsApp / Slack',
      rawMessage:
        "Hey team, quick thing—before Friday's launch can we also add WhatsApp OTP login and an Excel order export for our accounts team? Shouldn't take long!",
      inScopeMatches: [
        {
          id: 'in-vk-1',
          title: 'Standard User Authentication',
          matchedDeliverable: 'Matched to SOW Item #1 (Auth & Email Login)',
          extraHrs: 0,
        },
      ],
      driftItems: [
        {
          id: 'drift-vk-1',
          title: 'WhatsApp / SMS 2FA OTP',
          hours: 6,
          cost: 7500,
        },
        {
          id: 'drift-vk-2',
          title: 'Excel & CSV Order Export',
          hours: 8,
          cost: 10000,
        },
      ],
      totalDriftHrs: 14,
      totalDriftCost: 17500,
      timelineExtraDays: 3,
    },
    activeProposal: {
      requestId: '#CSC-892A',
      mode: 'swap',
      status: 'pending',
      addingItems: [
        { id: 'drift-vk-1', title: 'WhatsApp / SMS 2FA OTP', hours: 6, cost: 7500 },
        { id: 'drift-vk-2', title: 'Excel & CSV Order Export', hours: 8, cost: 10000 },
      ],
      movingOutDeliverableId: 'del-vk-4',
      movingOutDeliverableName: 'Blog & Content CMS',
      movingOutHrs: 14,
      netHrsChange: 0,
      netCostChange: 0,
      revisedContractTotal: 150000,
      launchDeadlineImpact: 'None (On Schedule)',
    },
    auditEvents: [
      {
        id: 'aud-1',
        timestamp: '26 Nov 2026, 07:15 PM',
        requestedChange: 'WhatsApp 2FA + Excel Export',
        resolutionDecision: 'Swapped w/ Blog CMS',
        category: 'swapped',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-892A',
        verificationState: 'Client Approved',
        shaDigest: generateShaDigest('CSC-892A-VastraKart-WhatsApp'),
        sowBaselineRef: 'SOW-VK-2026-04 · Item #4',
        actor: 'Rohan Mehta (VastraKart)',
      },
      {
        id: 'aud-2',
        timestamp: '24 Nov 2026, 04:30 PM',
        requestedChange: 'Multi-Currency Pricing',
        resolutionDecision: 'Deferred to Phase 2',
        category: 'deferred',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-889F',
        verificationState: 'Logged',
        shaDigest: generateShaDigest('CSC-889F-VastraKart-Currency'),
        sowBaselineRef: 'SOW-VK-2026-04 · Backlog',
        actor: 'Ananya Rao (PixelCraft Studio)',
      },
      {
        id: 'aud-3',
        timestamp: '21 Nov 2026, 11:10 AM',
        requestedChange: 'Priority GST Invoice Generator',
        resolutionDecision: 'Paid Add-On Approved',
        category: 'paid',
        netHours: 10,
        netCost: 12500,
        verificationCode: '#CSC-881C',
        verificationState: 'Signed',
        shaDigest: generateShaDigest('CSC-881C-VastraKart-GST'),
        sowBaselineRef: 'SOW-VK-2026-04 · Amendment A1',
        actor: 'Rohan Mehta (VastraKart)',
      },
      {
        id: 'aud-4',
        timestamp: '18 Nov 2026, 02:05 PM',
        requestedChange: 'Custom Loyalty Wallet',
        resolutionDecision: 'Swapped w/ Analytics',
        category: 'swapped',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-874E',
        verificationState: 'Client Approved',
        shaDigest: generateShaDigest('CSC-874E-VastraKart-Loyalty'),
        sowBaselineRef: 'SOW-VK-2026-04 · Item #5',
        actor: 'Rohan Mehta (VastraKart)',
      },
      {
        id: 'aud-5',
        timestamp: '15 Nov 2026, 10:20 AM',
        requestedChange: 'Custom Courier Webhook',
        resolutionDecision: 'Swapped w/ Gift Notes',
        category: 'swapped',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-868B',
        verificationState: 'Client Approved',
        shaDigest: generateShaDigest('CSC-868B-VastraKart-Courier'),
        sowBaselineRef: 'SOW-VK-2026-04 · Buffer',
        actor: 'Rohan Mehta (VastraKart)',
      },
      {
        id: 'aud-6',
        timestamp: '12 Nov 2026, 05:45 PM',
        requestedChange: 'B2B Wholesale Bulk Portal',
        resolutionDecision: 'Deferred to Phase 2',
        category: 'deferred',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-860D',
        verificationState: 'Logged',
        shaDigest: generateShaDigest('CSC-860D-VastraKart-B2B'),
        sowBaselineRef: 'SOW-VK-2026-04 · Backlog',
        actor: 'Ananya Rao (PixelCraft Studio)',
      },
    ],
  },
  {
    id: 'proj-finledger',
    name: 'FinLedger SaaS Portal',
    clientName: 'FinLedger',
    agencyName: 'PixelCraft Studio',
    agencyInitials: 'PS',
    sowCode: 'SOW-FL-2026-02',
    fixedCap: 240000,
    capHours: 160,
    allocatedHours: 112,
    hourlyRate: 1500,
    pendingCount: 1,
    marginProtected: 36000,
    creepCaughtCount: 2,
    sprintAlertCount: 2,
    launchDayLabel: 'Monday milestone',
    deliverables: [
      {
        id: 'del-fl-1',
        index: 1,
        name: 'Enterprise RBAC & Audit Auth',
        allocatedHrs: 24,
        status: 'Completed',
        swappable: false,
        keywords: ['login', 'auth', 'rbac', 'role'],
      },
      {
        id: 'del-fl-2',
        index: 2,
        name: 'Automated Bank Reconciliation',
        allocatedHrs: 44,
        status: 'In Progress',
        swappable: false,
        keywords: ['bank', 'reconciliation', 'ledger'],
      },
      {
        id: 'del-fl-3',
        index: 3,
        name: 'Quarterly Board Reporting',
        allocatedHrs: 22,
        status: 'Not Started',
        swappable: false,
        keywords: ['report', 'board', 'quarterly'],
      },
      {
        id: 'del-fl-4',
        index: 4,
        name: 'Interactive Onboarding Tour',
        allocatedHrs: 12,
        status: 'Not Started',
        swappable: true,
        keywords: ['onboarding', 'tour', 'walkthrough'],
      },
      {
        id: 'del-fl-5',
        index: 5,
        name: 'White-Label Email Templates',
        allocatedHrs: 10,
        status: 'Not Started',
        swappable: true,
        keywords: ['email', 'template', 'branding'],
      },
    ],
    alerts: [
      {
        id: 'alert-fl-1',
        auditCode: 'AUD-2018',
        timestamp: '[11:15 AM]',
        statusLabel: 'Out-of-Scope',
        severity: 'error',
        summary: 'Enterprise SAML SSO & ERP Webhook Sync requested',
        impactText: 'Flagged +22 hrs (+₹33,000)',
        extraHrs: 22,
        extraCost: 33000,
        sourceMessage:
          'Security asked if we can add Enterprise SAML SSO login and a Zoho ERP inventory webhook sync before Monday milestone.',
      },
      {
        id: 'alert-fl-2',
        auditCode: 'AUD-2011',
        timestamp: '[Nov 22, 03:40 PM]',
        statusLabel: 'Swapped',
        severity: 'emerald',
        summary: 'Custom Slack alert digest swapped w/ Email Templates',
        impactText: 'Protected ₹15,000 (0 hrs net)',
        extraHrs: 0,
        extraCost: 0,
      },
    ],
    simulator: {
      simCode: 'SIM-FL-2018',
      source: 'Email',
      rawMessage:
        'Security asked if we can add Enterprise SAML SSO login and a Zoho ERP inventory webhook sync before Monday milestone.',
      inScopeMatches: [
        {
          id: 'in-fl-1',
          title: 'Baseline Enterprise RBAC & Audit Auth',
          matchedDeliverable: 'Matched to SOW Item #1 (Enterprise RBAC & Audit Auth)',
          extraHrs: 0,
        },
      ],
      driftItems: [
        { id: 'drift-fl-1', title: 'Enterprise SSO / SAML Auth', hours: 8, cost: 12000 },
        { id: 'drift-fl-2', title: 'ERP / Inventory Webhook Sync', hours: 14, cost: 21000 },
      ],
      totalDriftHrs: 22,
      totalDriftCost: 33000,
      timelineExtraDays: 5,
    },
    activeProposal: {
      requestId: '#CSC-904B',
      mode: 'swap',
      status: 'pending',
      addingItems: [
        { id: 'drift-fl-1', title: 'Enterprise SSO / SAML Auth', hours: 8, cost: 12000 },
      ],
      movingOutDeliverableId: 'del-fl-4',
      movingOutDeliverableName: 'Interactive Onboarding Tour',
      movingOutHrs: 12,
      netHrsChange: -4,
      netCostChange: 0,
      revisedContractTotal: 240000,
      launchDeadlineImpact: 'None (On Schedule)',
    },
    auditEvents: [
      {
        id: 'aud-fl-1',
        timestamp: '22 Nov 2026, 03:40 PM',
        requestedChange: 'Custom Slack Alert Digest',
        resolutionDecision: 'Swapped w/ Email Templates',
        category: 'swapped',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-901K',
        verificationState: 'Client Approved',
        shaDigest: generateShaDigest('CSC-901K-FinLedger-Slack'),
        sowBaselineRef: 'SOW-FL-2026-02 · Item #5',
        actor: 'Vikram Seth (FinLedger)',
      },
      {
        id: 'aud-fl-2',
        timestamp: '19 Nov 2026, 01:15 PM',
        requestedChange: 'SOC2 Export Archive Bundle',
        resolutionDecision: 'Paid Add-On Approved',
        category: 'paid',
        netHours: 14,
        netCost: 21000,
        verificationCode: '#CSC-895M',
        verificationState: 'Signed',
        shaDigest: generateShaDigest('CSC-895M-FinLedger-SOC2'),
        sowBaselineRef: 'SOW-FL-2026-02 · Amendment A1',
        actor: 'Vikram Seth (FinLedger)',
      },
    ],
  },
  {
    id: 'proj-greenbasket',
    name: 'GreenBasket Quick-Commerce',
    clientName: 'GreenBasket',
    agencyName: 'PixelCraft Studio',
    agencyInitials: 'PS',
    sowCode: 'SOW-GB-2026-07',
    fixedCap: 95000,
    capHours: 80,
    allocatedHours: 54,
    hourlyRate: 1188,
    pendingCount: 1,
    marginProtected: 14250,
    creepCaughtCount: 2,
    sprintAlertCount: 2,
    launchDayLabel: "Wednesday's pilot",
    deliverables: [
      {
        id: 'del-gb-1',
        index: 1,
        name: 'Storefront & Pincode Check',
        allocatedHrs: 18,
        status: 'Completed',
        swappable: false,
        keywords: ['storefront', 'pincode', 'location'],
      },
      {
        id: 'del-gb-2',
        index: 2,
        name: 'Express Slot Cart & UPI',
        allocatedHrs: 16,
        status: 'In Progress',
        swappable: false,
        keywords: ['cart', 'upi', 'slot'],
      },
      {
        id: 'del-gb-3',
        index: 3,
        name: 'Rider Dispatch View',
        allocatedHrs: 12,
        status: 'Not Started',
        swappable: true,
        keywords: ['rider', 'dispatch', 'delivery'],
      },
      {
        id: 'del-gb-4',
        index: 4,
        name: 'Seasonal Recipe Journal',
        allocatedHrs: 8,
        status: 'Not Started',
        swappable: true,
        keywords: ['recipe', 'journal', 'blog'],
      },
    ],
    alerts: [
      {
        id: 'alert-gb-1',
        auditCode: 'AUD-3012',
        timestamp: '[09:30 AM]',
        statusLabel: 'Pending Swap',
        severity: 'amber',
        summary: 'Web Push Notifications & PWA requested',
        impactText: 'Flagged +9 hrs (+₹10,692)',
        extraHrs: 9,
        extraCost: 10692,
        sourceMessage:
          'Can we add browser push notifications and offline PWA install before Wednesday pilot?',
      },
    ],
    simulator: {
      simCode: 'SIM-GB-3012',
      source: 'WhatsApp / Slack',
      rawMessage:
        'Can we add browser push notifications and offline PWA install before Wednesday pilot?',
      inScopeMatches: [
        {
          id: 'in-gb-1',
          title: 'Baseline Storefront & Pincode Check',
          matchedDeliverable: 'Matched to SOW Item #1 (Storefront & Pincode Check)',
          extraHrs: 0,
        },
      ],
      driftItems: [
        { id: 'drift-gb-1', title: 'Web Push Notifications & PWA', hours: 9, cost: 10692 },
      ],
      totalDriftHrs: 9,
      totalDriftCost: 10692,
      timelineExtraDays: 2,
    },
    activeProposal: {
      requestId: '#CSC-771P',
      mode: 'swap',
      status: 'pending',
      addingItems: [
        { id: 'drift-gb-1', title: 'Web Push Notifications & PWA', hours: 9, cost: 10692 },
      ],
      movingOutDeliverableId: 'del-gb-4',
      movingOutDeliverableName: 'Seasonal Recipe Journal',
      movingOutHrs: 8,
      netHrsChange: 1,
      netCostChange: 0,
      revisedContractTotal: 95000,
      launchDeadlineImpact: 'None (On Schedule)',
    },
    auditEvents: [
      {
        id: 'aud-gb-1',
        timestamp: '20 Nov 2026, 06:10 PM',
        requestedChange: 'Organic Farm Badge Filters',
        resolutionDecision: 'Swapped w/ Recipe Journal',
        category: 'swapped',
        netHours: 0,
        netCost: 0,
        verificationCode: '#CSC-764R',
        verificationState: 'Client Approved',
        shaDigest: generateShaDigest('CSC-764R-GreenBasket-Badge'),
        sowBaselineRef: 'SOW-GB-2026-07 · Item #4',
        actor: 'Meera Nair (GreenBasket)',
      },
    ],
  },
];
