import {
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Users,
  X,
} from 'lucide-react';
import type {
  FilterState,
  SchoolDistrict,
  TeacherStats,
  TeacherStatus,
} from '../types/teacher';
import {
  ALLOWED_DISTRICTS,
  ALLOWED_STATUSES,
  getDistrictLabel,
  getStatusLabel,
} from '../utils/teacherLogic';

interface SidebarProps {
  stats: TeacherStats;
  filters: FilterState;
  onSelectQuickView: (patch: Partial<FilterState>) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  stats,
  filters,
  onSelectQuickView,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const isAllView =
    filters.visit === 'all' &&
    filters.report === 'all' &&
    filters.status === 'all' &&
    filters.district === 'all';
  const isVisitedView = filters.visit === 'visited' && filters.report === 'all';
  const isPendingView =
    filters.visit === 'not_visited' && filters.report === 'all';
  const isReportsView = filters.report === 'with_report';

  const navItems: Array<{
    id: string;
    label: string;
    count: number;
    active: boolean;
    icon: typeof Users;
    patch: Partial<FilterState>;
  }> = [
    {
      id: 'all',
      label: 'All Teachers',
      count: stats.total,
      active: isAllView,
      icon: Users,
      patch: { status: 'all', visit: 'all', report: 'all', district: 'all', institution: 'all' },
    },
    {
      id: 'visited',
      label: 'Visited',
      count: stats.visited,
      active: isVisitedView,
      icon: CheckCircle2,
      patch: { status: 'all', visit: 'visited', report: 'all' },
    },
    {
      id: 'pending',
      label: 'Not Visited',
      count: stats.notVisited,
      active: isPendingView,
      icon: Clock,
      patch: { status: 'all', visit: 'not_visited', report: 'all' },
    },
    {
      id: 'reports',
      label: 'Visit Reports',
      count: stats.reportsUploaded,
      active: isReportsView,
      icon: FileText,
      patch: { status: 'all', visit: 'all', report: 'with_report' },
    },
  ];

  const handleNavClick = (patch: Partial<FilterState>) => {
    onSelectQuickView(patch);
    onCloseMobile();
  };

  const visitCoverage =
    stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0;

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100 border-r border-slate-800">
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/90">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="font-editorial text-lg font-semibold tracking-tight text-white whitespace-nowrap truncate">
            Faculty Registry
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Primary directory views" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="px-3 mb-2 text-xs font-medium text-slate-400">
            Directory Views
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.patch)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-400 ${
                      item.active
                        ? 'bg-white/10 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          item.active ? 'text-blue-400' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        item.active ? 'text-white font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-800/90">
          <p className="px-3 mb-2 text-xs font-medium text-slate-400">
            Employment Status
          </p>
          <ul className="space-y-1">
            {ALLOWED_STATUSES.map((status: TeacherStatus) => {
              const active = filters.status === status;
              return (
                <li key={status}>
                  <button
                    type="button"
                    onClick={() =>
                      handleNavClick({
                        status: active ? 'all' : status,
                        visit: 'all',
                        report: 'all',
                      })
                    }
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-400 ${
                      active
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{getStatusLabel(status)}</span>
                    <span className="font-mono text-xs tabular-nums text-slate-400">
                      {stats.byStatus[status]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="pt-4 border-t border-slate-800/90">
          <p className="px-3 mb-2 text-xs font-medium text-slate-400">
            School Districts
          </p>
          <ul className="space-y-1">
            {ALLOWED_DISTRICTS.map((district: SchoolDistrict) => {
              const active = filters.district === district;
              return (
                <li key={district}>
                  <button
                    type="button"
                    onClick={() =>
                      handleNavClick({
                        district: active ? 'all' : district,
                      })
                    }
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-400 ${
                      active
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{getDistrictLabel(district)}</span>
                    <span className="font-mono text-xs tabular-nums text-slate-400">
                      {stats.byDistrict[district]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800/90 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Visit Progress</span>
          <span className="font-mono text-slate-200 tabular-nums font-medium">
            {visitCoverage}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${visitCoverage}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 pt-1">
          Academic Inspection Unit
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-64 max-w-[85vw] h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
