import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Teacher } from '../types/teacher';

interface DeleteConfirmModalProps {
  teacher: Teacher | null;
  onCancel: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteConfirmModal({
  teacher,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!teacher) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(teacher.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/45"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="animate-modal-in relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="delete-dialog-title"
                className="font-display text-base font-semibold text-slate-900"
              >
                Delete Teacher Record
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close delete confirmation"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Are you sure you want to permanently remove{' '}
          <span className="font-semibold text-slate-900">{teacher.fullName}</span>{' '}
          ({teacher.institution})
          {teacher.visitReport
            ? ' and their attached visit report file'
            : ''}
          ?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="h-9 px-4 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
