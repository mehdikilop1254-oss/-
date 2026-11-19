import type {
  FilterState,
  SchoolDistrict,
  Teacher,
  TeacherFormInput,
  TeacherStats,
  TeacherStatus,
} from '../types/teacher';

export const STATUS_LABELS: Record<TeacherStatus, string> = {
  tenured: 'Tenured',
  contracted: 'Contracted',
  substitute: 'Substitute',
};

export const STATUS_DESCRIPTIONS: Record<TeacherStatus, string> = {
  tenured: 'Permanent civil-service appointment',
  contracted: 'Fixed-term contractual appointment',
  substitute: 'Temporary replacement appointment',
};

export const ALLOWED_STATUSES: readonly TeacherStatus[] = [
  'tenured',
  'contracted',
  'substitute',
] as const;

export const DISTRICT_LABELS: Record<SchoolDistrict, string> = {
  tiaret: 'Tiaret',
  frenda: 'Frenda',
  ain_el_hadid: 'Ain El Hadid',
  takhmaret: 'Takhmaret',
};

export const ALLOWED_DISTRICTS: readonly SchoolDistrict[] = [
  'tiaret',
  'frenda',
  'ain_el_hadid',
  'takhmaret',
] as const;

export function getStatusLabel(status: TeacherStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getDistrictLabel(district: SchoolDistrict): string {
  return DISTRICT_LABELS[district] ?? district;
}

export function getInitials(fullName: string): string {
  const cleaned = fullName
    .replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, '')
    .trim();
  if (!cleaned) return 'TR';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getUniqueInstitutions(teachers: readonly Teacher[]): string[] {
  const set = new Set<string>();
  for (const t of teachers) {
    const inst = t.institution.trim();
    if (inst) set.add(inst);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, '').toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function validateTeacherInput(
  input: Partial<TeacherFormInput>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fullName = (input.fullName ?? '').trim();
  const institution = (input.institution ?? '').trim();
  const phone = (input.phone ?? '').trim();

  if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (fullName.length > 120) {
    errors.fullName = 'Full name cannot exceed 120 characters.';
  }

  if (institution.length < 2) {
    errors.institution = 'Primary school name must be at least 2 characters.';
  } else if (institution.length > 150) {
    errors.institution = 'Primary school name cannot exceed 150 characters.';
  }

  if (!input.district || !ALLOWED_DISTRICTS.includes(input.district)) {
    errors.district = 'Select a valid district.';
  }

  if (!input.status || !ALLOWED_STATUSES.includes(input.status)) {
    errors.status = 'Select a valid employment status.';
  }

  if (phone) {
    const digitCount = (phone.match(/\d/g) ?? []).length;
    if (!/^[+\d(][\d\s\-().]{4,30}$/.test(phone) || digitCount < 6) {
      errors.phone = 'Enter a valid phone number (at least 6 digits) or leave blank.';
    }
  }

  if (input.visited && input.visitDate) {
    const parsed = Date.parse(input.visitDate);
    if (Number.isNaN(parsed)) {
      errors.visitDate = 'Enter a valid visit date.';
    }
  }

  return errors;
}

export function calculateTeacherStats(teachers: readonly Teacher[]): TeacherStats {
  const byStatus: Record<TeacherStatus, number> = {
    tenured: 0,
    contracted: 0,
    substitute: 0,
  };

  const byDistrict: Record<SchoolDistrict, number> = {
    tiaret: 0,
    frenda: 0,
    ain_el_hadid: 0,
    takhmaret: 0,
  };

  let visited = 0;
  let reportsUploaded = 0;

  for (const teacher of teachers) {
    if (teacher.status in byStatus) {
      byStatus[teacher.status] += 1;
    }
    if (teacher.district in byDistrict) {
      byDistrict[teacher.district] += 1;
    }
    if (teacher.visited) {
      visited += 1;
    }
    if (teacher.visitReport) {
      reportsUploaded += 1;
    }
  }

  return {
    total: teachers.length,
    visited,
    notVisited: teachers.length - visited,
    reportsUploaded,
    byStatus,
    byDistrict,
  };
}

export function filterAndSortTeachers(
  teachers: readonly Teacher[],
  filters: FilterState
): Teacher[] {
  const query = filters.search.trim().toLowerCase();
  const normalizedQueryPhone = normalizePhone(filters.search);

  const filtered = teachers.filter((teacher) => {
    if (filters.status !== 'all' && teacher.status !== filters.status) {
      return false;
    }

    if (filters.visit === 'visited' && !teacher.visited) {
      return false;
    }
    if (filters.visit === 'not_visited' && teacher.visited) {
      return false;
    }

    if (filters.report === 'with_report' && !teacher.visitReport) {
      return false;
    }
    if (filters.report === 'without_report' && teacher.visitReport) {
      return false;
    }

    if (
      filters.institution &&
      filters.institution !== 'all' &&
      teacher.institution !== filters.institution
    ) {
      return false;
    }

    if (
      filters.district &&
      filters.district !== 'all' &&
      teacher.district !== filters.district
    ) {
      return false;
    }

    if (query.length > 0) {
      const nameMatch = teacher.fullName.toLowerCase().includes(query);
      const schoolMatch = teacher.institution.toLowerCase().includes(query);
      const districtMatch = getDistrictLabel(teacher.district)
        .toLowerCase()
        .includes(query);
      const statusMatch = getStatusLabel(teacher.status).toLowerCase().includes(query);
      const normalizedTeacherPhone = normalizePhone(teacher.phone);
      const queryWithoutLeadingZero = normalizedQueryPhone.replace(/^0+/, '');
      const phoneMatch =
        teacher.phone.toLowerCase().includes(query) ||
        (normalizedQueryPhone.length > 0 &&
          normalizedTeacherPhone.includes(normalizedQueryPhone)) ||
        (queryWithoutLeadingZero.length >= 6 &&
          normalizedTeacherPhone.includes(queryWithoutLeadingZero));

      if (
        !nameMatch &&
        !schoolMatch &&
        !districtMatch &&
        !statusMatch &&
        !phoneMatch
      ) {
        return false;
      }
    }

    return true;
  });

  const dir = filters.sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (filters.sortField) {
      case 'fullName':
        return a.fullName.localeCompare(b.fullName) * dir;
      case 'institution':
        return a.institution.localeCompare(b.institution) * dir;
      case 'district':
        return (
          getDistrictLabel(a.district).localeCompare(
            getDistrictLabel(b.district)
          ) * dir
        );
      case 'status':
        return getStatusLabel(a.status).localeCompare(getStatusLabel(b.status)) * dir;
      case 'visited':
        return (Number(a.visited) - Number(b.visited)) * dir;
      case 'updatedAt':
      default:
        return (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * dir;
    }
  });
}

function escapeCsvCell(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildTeachersCsv(teachers: readonly Teacher[]): string {
  const headers = [
    'Full Name',
    'Primary School',
    'District',
    'Employment Status',
    'Phone Number',
    'Visited',
    'Visit Date',
    'Visit Report File',
    'Notes',
  ];

  const rows = teachers.map((t) => [
    escapeCsvCell(t.fullName),
    escapeCsvCell(t.institution),
    escapeCsvCell(getDistrictLabel(t.district)),
    escapeCsvCell(getStatusLabel(t.status)),
    escapeCsvCell(t.phone),
    escapeCsvCell(t.visited ? 'Yes' : 'No'),
    escapeCsvCell(t.visitDate ?? ''),
    escapeCsvCell(t.visitReport?.fileName ?? ''),
    escapeCsvCell(t.notes ?? ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
