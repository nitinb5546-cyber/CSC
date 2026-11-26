import React, { useState, useRef, useEffect } from 'react';
import { ProjectData } from '../types';
import { formatINR } from '../data/initialData';

interface TopBarProps {
  projects: ProjectData[];
  activeProject: ProjectData;
  onSelectProject: (projectId: string) => void;
  onOpenMobileSidebar: () => void;
  onSharePortal: () => void;
  onPasteMessage: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenMobileSidebar,
  onSharePortal,
  onPasteMessage,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <header className="no-print sticky top-0 z-20 bg-surface-card border-b border-outline-variant px-lg lg:px-page py-md flex flex-wrap items-center justify-between gap-lg">
      <div className="flex items-center gap-md min-w-0">
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-subtle"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* Project Switcher */}
        <div className="relative min-w-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-md px-md py-sm rounded-lg bg-surface border border-outline-variant hover:border-outline transition-colors duration-150 ease-out text-left min-w-0 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="w-2 h-2 rounded-full bg-emerald shrink-0" aria-hidden="true" />
            <span className="font-label text-label-lg text-on-surface truncate">
              {activeProject.name} — Fixed Cap{' '}
              <span className="font-mono tabular-nums">{formatINR(activeProject.fixedCap)}</span>
            </span>
            <span
              className={`material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 transition-transform duration-150 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Select SOW project"
              className="absolute left-0 mt-sm w-[360px] max-w-[90vw] bg-surface-card border border-outline-variant rounded-xl shadow-lg p-xs z-30"
            >
              <div className="px-md py-xs border-b border-outline-variant mb-xs">
                <span className="font-label text-label-sm text-on-surface-variant">
                  Active Fixed-Cap SOWs ({projects.length})
                </span>
              </div>
              {projects.map((proj) => {
                const isSelected = proj.id === activeProject.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectProject(proj.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-md px-md py-sm rounded-lg text-left transition-colors duration-150 ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container'
                        : 'hover:bg-surface-subtle text-on-surface'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-label text-label-lg truncate">{proj.name}</span>
                      <span className="font-mono text-mono-sm text-on-surface-variant tabular-nums">
                        {proj.sowCode} · {proj.capHours} hrs cap
                      </span>
                    </div>
                    <span className="font-mono text-mono-md tabular-nums shrink-0">
                      {formatINR(proj.fixedCap)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-md shrink-0">
        <button
          type="button"
          onClick={onSharePortal}
          className="inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-surface-card text-on-surface border border-outline-variant hover:bg-surface-subtle transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
        >
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant" aria-hidden="true">
            ios_share
          </span>
          <span className="font-label text-label-lg whitespace-nowrap">Share Client Portal</span>
        </button>

        <button
          type="button"
          onClick={onPasteMessage}
          className="inline-flex items-center justify-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add
          </span>
          <span className="font-label text-label-lg whitespace-nowrap">Paste Client Message</span>
        </button>
      </div>
    </header>
  );
};
