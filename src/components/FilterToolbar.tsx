import { RotateCcw, Search, X } from 'lucide-react';
import type {
  DistrictFilter,
  FilterState,
  SortField,
  StatusFilter,
  VisitFilter,
} from '../types/teacher';
import { ALLOWED_DISTRICTS, getDistrictLabel } from '../utils/teacherLogic';

interface FilterToolbarProps {
  filters: FilterState;
  institutions: string[];
  totalCount: number;
  filteredCount: number;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'tenured', label: 'Tenured' },
  { value: 'contracted', label: 'Contracted' },
  { value: 'substitute', label: 'Substitute' },
];

const VISIT_TABS: Array<{ value: VisitFilter; label: string }> = [
  { value: 'all', label: 'All Visits' },
  { value: 'visited', label: 'Visited' },
  { value: 'not_visited', label: 'Not Visited' },
];

export function FilterToolbar({
  filters,
  institutions,
  totalCount,
  filteredCount,
  onChange,
  onReset,
}: FilterToolbarProps) {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.visit !== 'all' ||
    filters.report !== 'all' ||
    filters.institution !== 'all' ||
    filters.district !== 'all';

  return (
    <section
      aria-label="Search and filter teachers"
      className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5"
    >
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <label htmlFor="teacher-search" className="sr-only">
            Search teachers by name, primary school, district, or phone number
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="teacher-search"
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by teacher name, primary school, district, or phone number..."
            className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="district-filter"
              className="text-xs font-medium text-slate-500 whitespace-nowrap"
            >
              District
            </label>
            <select
              id="district-filter"
              value={filters.district}
              onChange={(e) =>
                onChange({ district: e.target.value as DistrictFilter })
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            >
              <option value="all">All Districts</option>
              {ALLOWED_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {getDistrictLabel(dist)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="primary-school-filter"
              className="text-xs font-medium text-slate-500 whitespace-nowrap"
            >
              Primary School
            </label>
            <select
              id="primary-school-filter"
              value={filters.institution}
              onChange={(e) => onChange({ institution: e.target.value })}
              className="h-10 max-w-[210px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            >
              <option value="all">All Primary Schools</option>
              {institutions.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-medium text-slate-500 whitespace-nowrap"
            >
              Sort
            </label>
            <select
              id="sort-select"
              value={`${filters.sortField}:${filters.sortDirection}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split(':') as [
                  SortField,
                  'asc' | 'desc',
                ];
                onChange({ sortField: field, sortDirection: dir });
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            >
              <option value="fullName:asc">Name (A–Z)</option>
              <option value="fullName:desc">Name (Z–A)</option>
              <option value="institution:asc">Primary School (A–Z)</option>
              <option value="district:asc">District (A–Z)</option>
              <option value="visited:desc">Visited First</option>
              <option value="visited:asc">Not Visited First</option>
              <option value="updatedAt:desc">Recently Updated</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center gap-1.5 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Filter by employment status"
            className="flex flex-wrap sm:inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {STATUS_TABS.map((tab) => {
              const active = filters.status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onChange({ status: tab.value })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Filter by visit status"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {VISIT_TABS.map((tab) => {
              const active = filters.visit === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onChange({ visit: tab.value })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
          Showing <span className="font-semibold text-slate-800">{filteredCount}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> teachers
        </p>
      </div>
    </section>
  );
}
