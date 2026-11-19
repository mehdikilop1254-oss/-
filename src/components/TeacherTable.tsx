import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileUp,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Teacher, TeacherStatus } from '../types/teacher';
import {
  formatFileSize,
  getDistrictLabel,
  getInitials,
  getStatusLabel,
} from '../utils/teacherLogic';
import { getReportDownloadUrl } from '../utils/api';

interface TeacherTableProps {
  teachers: Teacher[];
  totalCount: number;
  loading: boolean;
  onInspect: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onToggleVisited: (teacher: Teacher) => void;
  onAddNew: () => void;
  onResetFilters: () => void;
}

const STATUS_TEXT_CLASS: Record<TeacherStatus, string> = {
  tenured: 'text-slate-900 font-medium',
  contracted: 'text-blue-700 font-medium',
  substitute: 'text-amber-700 font-medium',
};

const MONOGRAM_CLASS: Record<TeacherStatus, string> = {
  tenured: 'bg-slate-100 text-slate-800 border-slate-200',
  contracted: 'bg-blue-50 text-blue-800 border-blue-200/80',
  substitute: 'bg-amber-50 text-amber-800 border-amber-200/80',
};

export function TeacherTable({
  teachers,
  totalCount,
  loading,
  onInspect,
  onEdit,
  onDelete,
  onToggleVisited,
  onAddNew,
  onResetFilters,
}: TeacherTableProps) {
  if (loading) {
    return (
      <div
        aria-label="Loading teachers directory"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-44 bg-slate-200 rounded" />
                <div className="h-3 w-64 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-24 bg-slate-100 rounded hidden sm:block" />
              <div className="h-4 w-28 bg-slate-100 rounded hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    const isEmptyDb = totalCount === 0;
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-16 text-center">
        <h3 className="font-display text-base font-semibold text-slate-900">
          {isEmptyDb
            ? 'No teacher records yet'
            : 'No teachers match your current search or filters'}
        </h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
          {isEmptyDb
            ? 'Add your first teacher record with their primary school, district, employment status, phone number, and visit report.'
            : 'Try adjusting the search query, primary school, district, employment status, or visit filter to view matching records.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          {isEmptyDb ? (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add First Teacher</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
              <th scope="col" className="py-3 pl-4 pr-2.5">
                Teacher Name
              </th>
              <th scope="col" className="py-3 px-2.5">
                Primary School
              </th>
              <th scope="col" className="py-3 px-2.5">
                District
              </th>
              <th scope="col" className="py-3 px-2.5">
                Status
              </th>
              <th scope="col" className="py-3 px-2.5">
                Phone Number
              </th>
              <th scope="col" className="py-3 px-2.5">
                Visit Status
              </th>
              <th scope="col" className="py-3 px-2.5">
                Visit Report
              </th>
              <th scope="col" className="py-3 pl-2.5 pr-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {teachers.map((teacher) => (
              <tr
                key={teacher.id}
                data-testid={`teacher-row-${teacher.id}`}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="py-3.5 pl-4 pr-2.5 align-middle">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-display text-xs font-semibold tracking-tight ${
                        MONOGRAM_CLASS[teacher.status]
                      }`}
                    >
                      {getInitials(teacher.fullName)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspect(teacher)}
                      className="font-medium text-slate-900 hover:text-blue-700 text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                    >
                      {teacher.fullName}
                    </button>
                  </div>
                </td>
                <td className="py-3.5 px-2.5 align-middle text-slate-700">
                  {teacher.institution}
                </td>
                <td className="py-3.5 px-2.5 align-middle text-slate-600 whitespace-nowrap">
                  {getDistrictLabel(teacher.district)}
                </td>
                <td className="py-3.5 px-2.5 align-middle whitespace-nowrap">
                  <span className={STATUS_TEXT_CLASS[teacher.status]}>
                    {getStatusLabel(teacher.status)}
                  </span>
                </td>
                <td className="py-3.5 px-2.5 align-middle font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                  {teacher.phone || <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3.5 px-2.5 align-middle whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onToggleVisited(teacher)}
                    aria-label={`Mark ${teacher.fullName} as ${
                      teacher.visited ? 'not visited' : 'visited'
                    }`}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 -ml-2 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 ${
                      teacher.visited ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {teacher.visited ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          Visited
                          {teacher.visitDate ? ` · ${teacher.visitDate}` : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Not Visited</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="py-3.5 px-2.5 align-middle">
                  {teacher.visitReport ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onInspect(teacher)}
                        aria-label={`View visit report for ${teacher.fullName}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 truncate max-w-[160px]"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{teacher.visitReport.fileName}</span>
                      </button>
                      <a
                        href={getReportDownloadUrl(teacher.id)}
                        download={teacher.visitReport.fileName}
                        aria-label={`Download visit report for ${teacher.fullName}`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title={`Download (${formatFileSize(teacher.visitReport.size)})`}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onInspect(teacher)}
                      aria-label={`Upload visit report for ${teacher.fullName}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 transition-colors whitespace-nowrap"
                    >
                      <FileUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Upload Report</span>
                    </button>
                  )}
                </td>
                <td className="py-3.5 pl-2.5 pr-4 align-middle text-right whitespace-nowrap">
                  <div className="inline-flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(teacher)}
                      aria-label={`Edit ${teacher.fullName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Edit teacher"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(teacher)}
                      aria-label={`Delete ${teacher.fullName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Delete teacher"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <ul className="md:hidden divide-y divide-slate-200">
        {teachers.map((teacher) => (
          <li key={teacher.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-display text-xs font-semibold ${
                    MONOGRAM_CLASS[teacher.status]
                  }`}
                >
                  {getInitials(teacher.fullName)}
                </span>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onInspect(teacher)}
                    className="font-display text-base font-semibold text-slate-900 hover:text-blue-700 text-left"
                  >
                    {teacher.fullName}
                  </button>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {teacher.institution} · {getDistrictLabel(teacher.district)}
                  </p>
                </div>
              </div>
              <span className={`text-xs whitespace-nowrap ${STATUS_TEXT_CLASS[teacher.status]}`}>
                {getStatusLabel(teacher.status)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
              {teacher.phone && (
                <>
                  <span className="font-mono tabular-nums text-slate-700">{teacher.phone}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <button
                type="button"
                onClick={() => onToggleVisited(teacher)}
                className={`inline-flex items-center gap-1 font-medium ${
                  teacher.visited ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {teacher.visited ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Visited</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Not Visited</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onInspect(teacher)}
                className="inline-flex items-center gap-1.5 min-h-10 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {teacher.visitReport ? (
                  <>
                    <FileText className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                    <span className="truncate max-w-[150px]">
                      {teacher.visitReport.fileName}
                    </span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload Report</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(teacher)}
                  aria-label={`Edit ${teacher.fullName}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(teacher)}
                  aria-label={`Delete ${teacher.fullName}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
