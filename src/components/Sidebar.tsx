import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  agencyName: string;
  agencyInitials: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCount: number;
}

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Scope Dashboard', icon: 'dashboard' },
  { id: 'simulator', label: 'Guardrail Simulator', icon: 'tune' },
  { id: 'portal', label: 'Client Portal Preview', icon: 'visibility' },
  { id: 'ledger', label: 'Audit Ledger', icon: 'receipt_long' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  agencyName,
  agencyInitials,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-on-surface/30 z-30 lg:hidden no-print"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Workspace sidebar"
        className={`no-print fixed lg:sticky top-0 left-0 z-40 w-[240px] shrink-0 min-h-screen bg-surface-card border-r border-outline-variant flex flex-col justify-between transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-2xl p-lg">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-sm pt-xs">
            <button
              type="button"
              onClick={() => {
                onNavigate('dashboard');
                onCloseMobile();
              }}
              className="flex items-center gap-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined material-symbols-filled text-[18px]">
                  verified_user
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-headline-sm text-on-surface tracking-tight whitespace-nowrap">
                  CSC Guardrail
                </span>
              </div>
            </button>
            <button
              type="button"
              className="lg:hidden p-xs rounded-lg text-on-surface-variant hover:bg-surface-subtle"
              onClick={onCloseMobile}
              aria-label="Close navigation"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Main navigation" className="flex flex-col gap-xs">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-150 ease-out text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] shrink-0 ${
                      isActive ? 'material-symbols-filled' : ''
                    }`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="font-label text-label-lg whitespace-nowrap truncate">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace Badge */}
        <div className="p-lg border-t border-outline-variant">
          <div className="flex items-center gap-md px-sm py-sm rounded-lg bg-surface border border-outline-variant">
            <div className="w-8 h-8 rounded-md bg-surface-subtle text-on-surface flex items-center justify-center shrink-0">
              <span className="font-label text-label-md">{agencyInitials}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label text-label-lg text-on-surface truncate">
                {agencyName}
              </span>
              <span className="font-label text-label-sm text-on-surface-variant">
                Agency Workspace
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
