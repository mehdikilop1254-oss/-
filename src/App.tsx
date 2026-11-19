/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, Menu, Plus, X } from 'lucide-react';
import type {
  FilterState,
  PendingReportUpload,
  Teacher,
  TeacherFormInput,
} from './types/teacher';
import {
  buildTeachersCsv,
  calculateTeacherStats,
  filterAndSortTeachers,
  getUniqueInstitutions,
} from './utils/teacherLogic';
import {
  createTeacher,
  deleteTeacher,
  fetchTeachers,
  fileToPendingReport,
  removeTeacherReport,
  updateTeacher,
  uploadTeacherReport,
} from './utils/api';
import { Sidebar } from './components/Sidebar';
import { StatsStrip } from './components/StatsStrip';
import { FilterToolbar } from './components/FilterToolbar';
import { TeacherTable } from './components/TeacherTable';
import { TeacherFormModal } from './components/TeacherFormModal';
import { TeacherDetailDrawer } from './components/TeacherDetailDrawer';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  visit: 'all',
  report: 'all',
  institution: 'all',
  district: 'all',
  sortField: 'fullName',
  sortDirection: 'asc',
};

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    message: string;
    teacherId?: string;
  } | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const list = await fetchTeachers();
      setTeachers(list);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Unable to load teachers database.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const stats = useMemo(() => calculateTeacherStats(teachers), [teachers]);

  const institutions = useMemo(
    () => getUniqueInstitutions(teachers),
    [teachers]
  );

  const visibleTeachers = useMemo(
    () => filterAndSortTeachers(teachers, filters),
    [teachers, filters]
  );

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) ?? null,
    [teachers, selectedTeacherId]
  );

  const handleFilterChange = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    input: TeacherFormInput,
    report: PendingReportUpload | null
  ) => {
    if (editingTeacher) {
      const updated = await updateTeacher(editingTeacher.id, input);
      setTeachers((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setStatusBanner({
        message: `Updated record for ${updated.fullName}.`,
        teacherId: updated.id,
      });
    } else {
      const created = await createTeacher(input, report);
      setTeachers((prev) => [created, ...prev]);
      const hiddenByFilter =
        filterAndSortTeachers([created], filters).length === 0;
      if (hiddenByFilter) {
        setFilters(DEFAULT_FILTERS);
      }
      setStatusBanner({
        message: hiddenByFilter
          ? `Added ${created.fullName} and cleared active filters so the new record is visible.`
          : `Added ${created.fullName} to the faculty directory.`,
        teacherId: created.id,
      });
    }
  };

  const handleToggleVisited = async (teacher: Teacher) => {
    const nextVisited = !teacher.visited;
    const nextVisitDate = nextVisited
      ? teacher.visitDate || new Date().toISOString().slice(0, 10)
      : '';
    try {
      const updated = await updateTeacher(teacher.id, {
        visited: nextVisited,
        visitDate: nextVisitDate,
      });
      setTeachers((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to update visit status.'
      );
    }
  };

  const handleUpdateVisitFromDrawer = async (
    id: string,
    patch: Partial<TeacherFormInput>
  ) => {
    const updated = await updateTeacher(id, patch);
    setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleUploadReport = async (
    id: string,
    file: File,
    options: { markVisited: boolean; visitDate?: string; notes?: string }
  ) => {
    const prepared = await fileToPendingReport(file);
    const updated = await uploadTeacherReport(id, prepared, options);
    setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleRemoveReport = async (id: string) => {
    const updated = await removeTeacherReport(id);
    setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteTeacher(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      if (selectedTeacherId === id) {
        setSelectedTeacherId(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Failed to delete teacher record.'
      );
      setDeleteTarget(null);
    }
  };

  const handleExportCsv = () => {
    const csv = buildTeachersCsv(visibleTeachers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teachers_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-[#F4F5F7] text-slate-900">
      <Sidebar
        stats={stats}
        filters={filters}
        onSelectQuickView={handleFilterChange}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, 1-2 primary actions on right */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
                Registry
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display text-base font-semibold text-slate-900 truncate">
                Teachers Database
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={visibleTeachers.length === 0}
              className="hidden sm:inline-flex h-10 items-center gap-2 px-3.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex h-10 items-center gap-2 px-4 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add Teacher</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1440px] w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Academic Inspection Directory · 2026–2027
              </p>
              <h2 className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 text-balance">
                Faculty Inspection Ledger
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Track appointed teachers across primary schools in Tiaret, Frenda, Ain El Hadid, and Takhmaret, monitor classroom visits, and archive inspection reports.
            </p>
          </div>

          {errorBanner && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                aria-label="Dismiss error message"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-600 hover:bg-red-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {statusBanner && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              <span className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span className="truncate">{statusBanner.message}</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {statusBanner.teacherId && (
                  <button
                    type="button"
                    onClick={() => setSelectedTeacherId(statusBanner.teacherId!)}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-100/70 transition-colors"
                  >
                    View Record
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStatusBanner(null)}
                  aria-label="Dismiss notification"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <StatsStrip stats={stats} />

          <FilterToolbar
            filters={filters}
            institutions={institutions}
            totalCount={teachers.length}
            filteredCount={visibleTeachers.length}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          <TeacherTable
            teachers={visibleTeachers}
            totalCount={teachers.length}
            loading={loading}
            onInspect={(teacher) => setSelectedTeacherId(teacher.id)}
            onEdit={handleOpenEdit}
            onDelete={(teacher) => setDeleteTarget(teacher)}
            onToggleVisited={handleToggleVisited}
            onAddNew={handleOpenAdd}
            onResetFilters={handleResetFilters}
          />
        </main>
      </div>

      <TeacherFormModal
        open={formOpen}
        editingTeacher={editingTeacher}
        onClose={() => {
          setFormOpen(false);
          setEditingTeacher(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <TeacherDetailDrawer
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacherId(null)}
        onEditDetails={(t) => handleOpenEdit(t)}
        onUpdateVisit={handleUpdateVisitFromDrawer}
        onUploadReport={handleUploadReport}
        onRemoveReport={handleRemoveReport}
        onRequestDelete={(t) => setDeleteTarget(t)}
      />

      <DeleteConfirmModal
        teacher={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
