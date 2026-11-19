import type {
  PendingReportUpload,
  Teacher,
  TeacherFormInput,
} from '../types/teacher';

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const res = await fetch('/api/teachers');
  const data = await parseJsonOrThrow<{ teachers: Teacher[] }>(res);
  return data.teachers;
}

export async function createTeacher(
  input: TeacherFormInput,
  report?: PendingReportUpload | null
): Promise<Teacher> {
  const res = await fetch('/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      report: report ?? null,
    }),
  });
  const data = await parseJsonOrThrow<{ teacher: Teacher }>(res);
  return data.teacher;
}

export async function updateTeacher(
  id: string,
  patch: Partial<TeacherFormInput>
): Promise<Teacher> {
  const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonOrThrow<{ teacher: Teacher }>(res);
  return data.teacher;
}

export async function deleteTeacher(id: string): Promise<string> {
  const res = await fetch(`/api/teachers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const data = await parseJsonOrThrow<{ deletedId: string }>(res);
  return data.deletedId;
}

export async function uploadTeacherReport(
  id: string,
  report: PendingReportUpload,
  options?: { markVisited?: boolean; visitDate?: string; notes?: string }
): Promise<Teacher> {
  const res = await fetch(`/api/teachers/${encodeURIComponent(id)}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...report,
      markVisited: options?.markVisited ?? true,
      visitDate: options?.visitDate,
      notes: options?.notes,
    }),
  });
  const data = await parseJsonOrThrow<{ teacher: Teacher }>(res);
  return data.teacher;
}

export async function removeTeacherReport(id: string): Promise<Teacher> {
  const res = await fetch(`/api/teachers/${encodeURIComponent(id)}/report`, {
    method: 'DELETE',
  });
  const data = await parseJsonOrThrow<{ teacher: Teacher }>(res);
  return data.teacher;
}

export function getReportDownloadUrl(id: string, inline = false): string {
  const suffix = inline ? '?inline=1' : '';
  return `/api/teachers/${encodeURIComponent(id)}/report/download${suffix}`;
}

export function fileToPendingReport(file: File): Promise<PendingReportUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read file contents.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      const contentBase64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        contentBase64,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}
