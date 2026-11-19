import { useEffect, useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import type {
  PendingReportUpload,
  SchoolDistrict,
  Teacher,
  TeacherFormInput,
  TeacherStatus,
} from '../types/teacher';
import {
  ALLOWED_DISTRICTS,
  ALLOWED_STATUSES,
  STATUS_DESCRIPTIONS,
  formatFileSize,
  getDistrictLabel,
  getStatusLabel,
  validateTeacherInput,
} from '../utils/teacherLogic';
import { fileToPendingReport } from '../utils/api';

interface TeacherFormModalProps {
  open: boolean;
  editingTeacher: Teacher | null;
  onClose: () => void;
  onSubmit: (
    input: TeacherFormInput,
    report: PendingReportUpload | null
  ) => Promise<void>;
}

const INITIAL_FORM: TeacherFormInput = {
  fullName: '',
  institution: '',
  district: 'tiaret',
  status: 'tenured',
  phone: '',
  visited: false,
  visitDate: '',
  notes: '',
};

const FIELD_ELEMENT_IDS: Record<string, string> = {
  fullName: 'teacher-fullname',
  institution: 'teacher-primary-school',
  district: 'teacher-district',
  phone: 'teacher-phone',
  visitDate: 'teacher-visit-date',
};

export function TeacherFormModal({
  open,
  editingTeacher,
  onClose,
  onSubmit,
}: TeacherFormModalProps) {
  const [form, setForm] = useState<TeacherFormInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingReport, setPendingReport] =
    useState<PendingReportUpload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingTeacher) {
      setForm({
        fullName: editingTeacher.fullName,
        institution: editingTeacher.institution,
        district: editingTeacher.district ?? 'tiaret',
        status: editingTeacher.status,
        phone: editingTeacher.phone ?? '',
        visited: editingTeacher.visited,
        visitDate: editingTeacher.visitDate ?? '',
        notes: editingTeacher.notes ?? '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setPendingReport(null);
    setErrors({});
    setServerError(null);
  }, [open, editingTeacher]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        report: 'File size must not exceed 10 MB.',
      }));
      return;
    }
    try {
      const prepared = await fileToPendingReport(file);
      setPendingReport(prepared);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.report;
        return next;
      });
      if (!form.visited) {
        setForm((prev) => ({
          ...prev,
          visited: true,
          visitDate: prev.visitDate || new Date().toISOString().slice(0, 10),
        }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        report: err instanceof Error ? err.message : 'Unable to read file.',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTeacherInput(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors).find(
        (k) => k in FIELD_ELEMENT_IDS
      );
      if (firstKey) {
        const el = document.getElementById(FIELD_ELEMENT_IDS[firstKey]);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      } else {
        scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(form, pendingReport);
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Failed to save teacher record.'
      );
      scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const validationErrorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-form-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/45"
        onClick={() => {
          if (!submitting) onClose();
        }}
        aria-hidden="true"
      />
      <div className="animate-modal-in relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <h2
            id="teacher-form-title"
            className="font-editorial text-xl font-semibold text-slate-900"
          >
            {editingTeacher ? 'Edit Teacher Record' : 'Add New Teacher'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          id="teacher-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col min-h-0 flex-1"
        >
          <div
            ref={scrollBodyRef}
            className="overflow-y-auto px-6 py-5 space-y-4 flex-1"
          >
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            <div>
              <label
                htmlFor="teacher-fullname"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="teacher-fullname"
                type="text"
                required
                aria-invalid={Boolean(errors.fullName)}
                value={form.fullName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, fullName: e.target.value }));
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="e.g. Dr. Nadia Benali"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="teacher-primary-school"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Primary School <span className="text-red-600">*</span>
                </label>
                <input
                  id="teacher-primary-school"
                  type="text"
                  required
                  aria-invalid={Boolean(errors.institution)}
                  value={form.institution}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, institution: e.target.value }));
                    if (errors.institution)
                      setErrors((prev) => ({ ...prev, institution: '' }));
                  }}
                  placeholder="e.g. Al-Khwarizmi Primary School"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                {errors.institution && (
                  <p className="mt-1 text-xs text-red-600">{errors.institution}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="teacher-district"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  School District <span className="text-red-600">*</span>
                </label>
                <select
                  id="teacher-district"
                  required
                  value={form.district}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      district: e.target.value as SchoolDistrict,
                    }));
                    if (errors.district)
                      setErrors((prev) => ({ ...prev, district: '' }));
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                >
                  {ALLOWED_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {getDistrictLabel(dist)}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600">{errors.district}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="teacher-phone"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Phone Number <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <input
                id="teacher-phone"
                type="tel"
                aria-invalid={Boolean(errors.phone)}
                value={form.phone}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, phone: e.target.value }));
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="e.g. +213 550 112 233"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-800 mb-1.5">
                Employment Status <span className="text-red-600">*</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ALLOWED_STATUSES.map((status: TeacherStatus) => {
                  const selected = form.status === status;
                  return (
                    <label
                      key={status}
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? 'border-blue-600 bg-blue-50/70'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="teacher-status"
                          value={status}
                          checked={selected}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, status }))
                          }
                          className="text-blue-700 focus:ring-blue-600"
                        />
                        <span className="text-sm font-medium text-slate-900">
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <span className="mt-1 text-xs text-slate-500 pl-5">
                        {STATUS_DESCRIPTIONS[status]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.visited}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        visited: checked,
                        visitDate: checked
                          ? prev.visitDate || new Date().toISOString().slice(0, 10)
                          : '',
                      }));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Teacher has been visited
                  </span>
                </label>
                <p className="mt-1 text-xs text-slate-500 pl-6">
                  Toggle whether an inspection visit was completed.
                </p>
              </div>

              {form.visited && (
                <div>
                  <label
                    htmlFor="teacher-visit-date"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    Visit Date
                  </label>
                  <input
                    id="teacher-visit-date"
                    type="date"
                    value={form.visitDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, visitDate: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="teacher-notes"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Inspection Notes
              </label>
              <textarea
                id="teacher-notes"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Optional classroom observation notes or scheduling details..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            {!editingTeacher && (
              <div className="pt-2 border-t border-slate-100">
                <label
                  htmlFor="initial-report-upload"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Visit Report Attachment (Optional)
                </label>
                <label
                  htmlFor="initial-report-upload"
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm text-slate-600 min-w-0">
                    <FileUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                    <span className="truncate">
                      {pendingReport
                        ? `${pendingReport.fileName} (${formatFileSize(pendingReport.size)})`
                        : 'Choose PDF, Word, text, or image report...'}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-blue-700 whitespace-nowrap shrink-0">
                    Browse File
                  </span>
                </label>
                <input
                  id="initial-report-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                {errors.report && (
                  <p className="mt-1 text-xs text-red-600">{errors.report}</p>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {validationErrorCount > 0 && (
                <p role="alert" className="text-xs font-medium text-red-600 truncate">
                  Please fix {validationErrorCount} highlighted{' '}
                  {validationErrorCount === 1 ? 'field' : 'fields'}.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                {submitting
                  ? 'Saving...'
                  : editingTeacher
                    ? 'Save Changes'
                    : 'Add Teacher'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
