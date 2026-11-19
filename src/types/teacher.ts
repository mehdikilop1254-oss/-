export type TeacherStatus = 'contracted' | 'substitute' | 'tenured';

export type SchoolDistrict =
  | 'tiaret'
  | 'frenda'
  | 'ain_el_hadid'
  | 'takhmaret';

export interface VisitReport {
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  institution: string;
  district: SchoolDistrict;
  status: TeacherStatus;
  phone: string;
  visited: boolean;
  visitDate: string | null;
  notes: string;
  visitReport: VisitReport | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherFormInput {
  fullName: string;
  institution: string;
  district: SchoolDistrict;
  status: TeacherStatus;
  phone: string;
  visited: boolean;
  visitDate: string;
  notes: string;
}

export interface PendingReportUpload {
  fileName: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}

export type VisitFilter = 'all' | 'visited' | 'not_visited';
export type StatusFilter = 'all' | TeacherStatus;
export type DistrictFilter = 'all' | SchoolDistrict;
export type ReportFilter = 'all' | 'with_report' | 'without_report';
export type SortField =
  | 'fullName'
  | 'institution'
  | 'district'
  | 'status'
  | 'visited'
  | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  status: StatusFilter;
  visit: VisitFilter;
  report: ReportFilter;
  institution: string;
  district: DistrictFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

export interface TeacherStats {
  total: number;
  visited: number;
  notVisited: number;
  reportsUploaded: number;
  byStatus: Record<TeacherStatus, number>;
  byDistrict: Record<SchoolDistrict, number>;
}
