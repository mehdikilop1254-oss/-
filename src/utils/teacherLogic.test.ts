import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTeachersCsv,
  calculateTeacherStats,
  filterAndSortTeachers,
  formatFileSize,
  getDistrictLabel,
  getInitials,
  getStatusLabel,
  getUniqueInstitutions,
  validateTeacherInput,
} from './teacherLogic';
import type { FilterState, Teacher } from '../types/teacher';

const sampleTeachers: Teacher[] = [
  {
    id: 't-1',
    fullName: 'Dr. Nadia Benali',
    institution: 'Al-Khwarizmi Primary School',
    district: 'tiaret',
    status: 'tenured',
    phone: '+213 550 112 233',
    visited: true,
    visitDate: '2026-10-14',
    notes: 'Strong classroom management and lesson plan structure.',
    visitReport: {
      fileName: 'nadia_benali_inspection.pdf',
      storedName: 't-1_nadia_benali_inspection.pdf',
      mimeType: 'application/pdf',
      size: 245760,
      uploadedAt: '2026-10-14T10:30:00.000Z',
    },
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-14T10:30:00.000Z',
  },
  {
    id: 't-2',
    fullName: 'Karim Haddad',
    institution: 'Ibn Sina Primary School',
    district: 'frenda',
    status: 'contracted',
    phone: '0661-44-55-66',
    visited: false,
    visitDate: null,
    notes: '',
    visitReport: null,
    createdAt: '2026-09-05T08:00:00.000Z',
    updatedAt: '2026-09-05T08:00:00.000Z',
  },
  {
    id: 't-3',
    fullName: 'Yasmine Ouali',
    institution: 'Al-Khwarizmi Primary School',
    district: 'ain_el_hadid',
    status: 'substitute',
    phone: '0770 99 88 77',
    visited: true,
    visitDate: '2026-11-02',
    notes: 'Covering semester 1 classes.',
    visitReport: null,
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-11-02T14:00:00.000Z',
  },
];

const defaultFilters: FilterState = {
  search: '',
  status: 'all',
  visit: 'all',
  report: 'all',
  institution: 'all',
  district: 'all',
  sortField: 'fullName',
  sortDirection: 'asc',
};

test('getStatusLabel and getDistrictLabel map statuses and 4 districts cleanly', () => {
  assert.equal(getStatusLabel('tenured'), 'Tenured');
  assert.equal(getStatusLabel('contracted'), 'Contracted');
  assert.equal(getStatusLabel('substitute'), 'Substitute');

  assert.equal(getDistrictLabel('tiaret'), 'Tiaret');
  assert.equal(getDistrictLabel('frenda'), 'Frenda');
  assert.equal(getDistrictLabel('ain_el_hadid'), 'Ain El Hadid');
  assert.equal(getDistrictLabel('takhmaret'), 'Takhmaret');
});

test('validateTeacherInput catches missing or invalid fields including district', () => {
  const emptyErrors = validateTeacherInput({
    fullName: '',
    institution: 'A',
    status: 'contracted',
    phone: '123',
    visited: false,
    visitDate: '',
    notes: '',
  });
  assert.ok(emptyErrors.fullName);
  assert.ok(emptyErrors.institution);
  assert.ok(emptyErrors.district);
  assert.ok(emptyErrors.phone);

  const validErrors = validateTeacherInput({
    fullName: 'Amine Khelifi',
    institution: 'Central Primary School',
    district: 'takhmaret',
    status: 'tenured',
    phone: '+213 551 234 567',
    visited: true,
    visitDate: '2026-11-10',
    notes: 'Completed review.',
  });
  assert.deepEqual(validErrors, {});

  const optionalPhoneErrors = validateTeacherInput({
    fullName: 'Leila Mansouri',
    institution: 'El-Amir Primary School',
    district: 'tiaret',
    status: 'contracted',
    phone: '',
    visited: false,
    visitDate: '',
    notes: '',
  });
  assert.deepEqual(optionalPhoneErrors, {});

  const formattedPhoneErrors = validateTeacherInput({
    fullName: 'Leila Mansouri',
    institution: 'El-Amir Primary School',
    district: 'tiaret',
    status: 'contracted',
    phone: '(0550) 11-22-33',
    visited: false,
    visitDate: '',
    notes: '',
  });
  assert.deepEqual(formattedPhoneErrors, {});
});

test('calculateTeacherStats computes totals, visits, reports, status and district counts', () => {
  const stats = calculateTeacherStats(sampleTeachers);
  assert.equal(stats.total, 3);
  assert.equal(stats.visited, 2);
  assert.equal(stats.notVisited, 1);
  assert.equal(stats.reportsUploaded, 1);
  assert.deepEqual(stats.byStatus, {
    tenured: 1,
    contracted: 1,
    substitute: 1,
  });
  assert.deepEqual(stats.byDistrict, {
    tiaret: 1,
    frenda: 1,
    ain_el_hadid: 1,
    takhmaret: 0,
  });
});

test('filterAndSortTeachers searches by name, primary school, district, and phone', () => {
  const byName = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    search: 'nadia',
  });
  assert.equal(byName.length, 1);
  assert.equal(byName[0].id, 't-1');

  const bySchool = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    search: 'khwarizmi',
  });
  assert.equal(bySchool.length, 2);

  const byDistrictQuery = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    search: 'ain el hadid',
  });
  assert.equal(byDistrictQuery.length, 1);
  assert.equal(byDistrictQuery[0].id, 't-3');

  const byNormalizedPhone = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    search: '0661445566',
  });
  assert.equal(byNormalizedPhone.length, 1);
  assert.equal(byNormalizedPhone[0].id, 't-2');

  const byLocalZeroAgainstIntl = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    search: '0550112233',
  });
  assert.equal(byLocalZeroAgainstIntl.length, 1);
  assert.equal(byLocalZeroAgainstIntl[0].id, 't-1');
});

test('filterAndSortTeachers filters by status, visit status, district, and report presence', () => {
  const contracted = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    status: 'contracted',
  });
  assert.deepEqual(
    contracted.map((t) => t.id),
    ['t-2']
  );

  const frenda = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    district: 'frenda',
  });
  assert.deepEqual(
    frenda.map((t) => t.id),
    ['t-2']
  );

  const visitedWithoutReport = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    visit: 'visited',
    report: 'without_report',
  });
  assert.deepEqual(
    visitedWithoutReport.map((t) => t.id),
    ['t-3']
  );
});

test('formatFileSize formats bytes, KB, and MB deterministically', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(1048576), '1.00 MB');
});

test('buildTeachersCsv includes Primary School and District headers and escapes quotes', () => {
  const csv = buildTeachersCsv([
    {
      ...sampleTeachers[0],
      notes: 'Great class, "top" engagement',
    },
  ]);
  assert.match(csv, /^Full Name,Primary School,District,Employment Status/);
  assert.match(csv, /Tiaret/);
  assert.match(csv, /"Great class, ""top"" engagement"/);
});

test('getInitials strips titles and extracts two-letter monograms', () => {
  assert.equal(getInitials('Dr. Nadia Benali'), 'NB');
  assert.equal(getInitials('Fatima Zohra Mansour'), 'FM');
  assert.equal(getInitials('Karim'), 'KA');
});

test('getUniqueInstitutions and primary school filter work cleanly', () => {
  const institutions = getUniqueInstitutions(sampleTeachers);
  assert.deepEqual(institutions, [
    'Al-Khwarizmi Primary School',
    'Ibn Sina Primary School',
  ]);
  const filtered = filterAndSortTeachers(sampleTeachers, {
    ...defaultFilters,
    institution: 'Ibn Sina Primary School',
  });
  assert.deepEqual(
    filtered.map((t) => t.id),
    ['t-2']
  );
});
