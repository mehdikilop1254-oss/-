import { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileUp,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  X,
} from 'lucide-react';
import type { Teacher, TeacherFormInput, TeacherStatus } from '../types/teacher';
import {
  formatFileSize,
  getDistrictLabel,
  getInitials,
  getStatusLabel,
} from '../utils/teacherLogic';
import { fileToPendingReport, getReportDownloadUrl } from '../utils/api';

const DRAWER_MONOGRAM_CLASS: Record<TeacherStatus, string> = {
  tenured: 'bg-slate-100 text-slate-800 border-slate-200',
  contracted: 'bg-blue-50 text-blue-800 border-blue-200/80',
  substitute: 'bg-amber-50 text-amber-800 border-amber-200/80',
};

interface TeacherDetailDrawerProps {
  teacher: Teacher | null;
  onClose: () => void;
  onEditDetails: (teacher: Teacher) => void;
  onUpdateVisit: (id: string, patch: Partial<TeacherFormInput>) => Promise<void>;
  onUploadReport: (
    id: string,
    file: File,
    options: { markVisited: boolean; visitDate?: string; notes?: string }
  ) => Promise<void>;
  onRemoveReport: (id: string) => Promise<void>;
  onRequestDelete: (teacher: Teacher) => void;
}

export function TeacherDetailDrawer({
  teacher,
  onClose,
  onEditDetails,
  onUpdateVisit,
  onUploadReport,
  onRemoveReport,
  onRequestDelete,
}: TeacherDetailDrawerProps) {
  const [visited, setVisited] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingReport, setRemovingReport] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!teacher) return;
    setVisited(teacher.visited);
    setVisitDate(teacher.visitDate ?? '');
    setNotes(teacher.notes ?? '');
    setError(null);
    setTextPreview(null);

    if (
      teacher.visitReport &&
      (teacher.visitReport.mimeType.startsWith('text/') ||
        teacher.visitReport.fileName.endsWith('.txt') ||
        teacher.visitReport.fileName.endsWith('.md'))
    ) {
      fetch(getReportDownloadUrl(teacher.id, true))
        .then((res) => (res.ok ? res.text() : null))
        .then((txt) => {
          if (txt !== null) setTextPreview(txt);
        })
        .catch(() => {});
    }
  }, [teacher]);

  if (!teacher) return null;

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVisit(true);
    setError(null);
    try {
      await onUpdateVisit(teacher.id, {
        visited,
        visitDate: visited ? visitDate : '',
        notes,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update visit details.'
      );
    } finally {
      setSavingVisit(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Visit report cannot exceed 10 MB.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Validate readable before delegating
      await fileToPendingReport(file);
      await onUploadReport(teacher.id, file, {
        markVisited: true,
        visitDate: visitDate || new Date().toISOString().slice(0, 10),
        notes,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload visit report.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReport = async () => {
    setRemovingReport(true);
    setError(null);
    try {
      await onRemoveReport(teacher.id);
      setTextPreview(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove visit report.'
      );
    } finally {
      setRemovingReport(false);
    }
  };

  const isImageReport =
    teacher.visitReport?.mimeType.startsWith('image/') ?? false;
  const isPdfReport =
    teacher.visitReport?.mimeType === 'application/pdf' ||
    teacher.visitReport?.fileName.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-teacher-name"
    >
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="animate-drawer-in relative z-10 w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              aria-hidden="true"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-display text-sm font-semibold ${
                DRAWER_MONOGRAM_CLASS[teacher.status]
              }`}
            >
              {getInitials(teacher.fullName)}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                {getStatusLabel(teacher.status)} · Inspection Dossier
              </p>
              <h2
                id="drawer-teacher-name"
                className="mt-0.5 font-editorial text-xl font-semibold text-slate-900 truncate"
              >
                {teacher.fullName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEditDetails(teacher)}
              aria-label={`Edit details for ${teacher.fullName}`}
              className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close teacher detail drawer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Core Identity Details */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-200 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Primary School</span>
              </dt>
              <dd className="mt-1 font-medium text-slate-900">
                {teacher.institution}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span>District</span>
              </dt>
              <dd className="mt-1 font-medium text-slate-900">
                {getDistrictLabel(teacher.district)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Phone Number</span>
              </dt>
              <dd className="mt-1 font-mono text-slate-900 tabular-nums">
                {teacher.phone || <span className="font-sans text-slate-400">Not provided</span>}
              </dd>
            </div>
          </dl>

          {/* Inspection Visit Form */}
          <form onSubmit={handleSaveVisit} className="space-y-4 pb-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Inspection Visit Record
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  visited ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {visited ? (
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
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setVisited(true);
                  if (!visitDate) {
                    setVisitDate(new Date().toISOString().slice(0, 10));
                  }
                }}
                className={`h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  visited
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Visited
              </button>
              <button
                type="button"
                onClick={() => {
                  setVisited(false);
                  setVisitDate('');
                }}
                className={`h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  !visited
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Not Visited
              </button>
            </div>

            {visited && (
              <div>
                <label
                  htmlFor="drawer-visit-date"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Visit Date
                </label>
                <input
                  id="drawer-visit-date"
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="drawer-notes"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Inspector Notes
              </label>
              <textarea
                id="drawer-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record pedagogical observations, strengths, or follow-up actions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingVisit}
                className="h-9 px-4 rounded-lg bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {savingVisit ? 'Saving...' : 'Save Visit Status'}
              </button>
            </div>
          </form>

          {/* Visit Report Upload & Preview Section */}
          <section aria-label="Visit report document" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Visit Report Document
              </h3>
              {teacher.visitReport && (
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {formatFileSize(teacher.visitReport.size)}
                </span>
              )}
            </div>

            {teacher.visitReport ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText
                      className="h-5 w-5 text-blue-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {teacher.visitReport.fileName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        Uploaded {teacher.visitReport.uploadedAt.slice(0, 10)} ·{' '}
                        {formatFileSize(teacher.visitReport.size)}
                      </p>
                    </div>
                  </div>
                </div>

                {textPreview !== null && (
                  <pre className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {textPreview}
                  </pre>
                )}

                {isImageReport && (
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <img
                      src={getReportDownloadUrl(teacher.id, true)}
                      alt={`Visit report preview for ${teacher.fullName}`}
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                )}

                {isPdfReport && (
                  <iframe
                    title={`Visit report PDF preview for ${teacher.fullName}`}
                    src={getReportDownloadUrl(teacher.id, true)}
                    className="w-full h-56 rounded-lg border border-slate-200 bg-white"
                  />
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={getReportDownloadUrl(teacher.id)}
                    download={teacher.visitReport.fileName}
                    className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-blue-700 text-xs font-medium text-white hover:bg-blue-800 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Download Report</span>
                  </a>

                  <label
                    htmlFor="drawer-replace-report"
                    className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{uploading ? 'Uploading...' : 'Replace File'}</span>
                  </label>
                  <input
                    id="drawer-replace-report"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                    className="sr-only"
                  />

                  <button
                    type="button"
                    onClick={handleRemoveReport}
                    disabled={removingReport}
                    className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{removingReport ? 'Removing...' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                className={`rounded-xl border border-dashed p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-300 bg-slate-50/60'
                }`}
              >
                <FileUp
                  className="mx-auto h-7 w-7 text-slate-400"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {uploading
                    ? 'Uploading visit report...'
                    : 'Upload inspection visit report'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Drag and drop or select a PDF, Word, text, or scanned image (max 10 MB). Uploading automatically marks the teacher as visited.
                </p>
                <label
                  htmlFor="drawer-upload-report"
                  className="mt-4 inline-flex h-9 items-center gap-2 px-4 rounded-lg bg-blue-700 text-xs font-medium text-white hover:bg-blue-800 cursor-pointer transition-colors"
                >
                  <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Select Report File</span>
                </label>
                <input
                  id="drawer-upload-report"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="sr-only"
                />
              </div>
            )}
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onRequestDelete(teacher)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Delete Teacher</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
