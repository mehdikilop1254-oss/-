import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import type {
  SchoolDistrict,
  Teacher,
  TeacherStatus,
  VisitReport,
} from './src/types/teacher.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const REPORTS_DIR = path.resolve(DATA_DIR, 'reports');
const DB_FILE = path.resolve(DATA_DIR, 'teachers.json');

const ALLOWED_STATUSES: ReadonlyArray<TeacherStatus> = [
  'tenured',
  'contracted',
  'substitute',
];

const ALLOWED_DISTRICTS: ReadonlyArray<SchoolDistrict> = [
  'tiaret',
  'frenda',
  'ain_el_hadid',
  'takhmaret',
];

const MAX_REPORT_BYTES = 10 * 1024 * 1024; // 10 MB

function ensureDataDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base.slice(0, 120) : 'visit_report.txt';
}

function seedInitialData(): Teacher[] {
  ensureDataDirs();

  const report1Name = 't-seed-1_nadia_benali_visit_report.txt';
  const report1Content = [
    'INSPECTION VISIT REPORT',
    '========================',
    'Teacher: Dr. Nadia Benali',
    'Primary School: Al-Khwarizmi Primary School',
    'District: Tiaret',
    'Status: Tenured',
    'Visit Date: 2026-10-14',
    '',
    'Observations:',
    '- Lesson objectives were clearly stated and aligned with the primary syllabus.',
    '- Strong classroom engagement during reading and arithmetic exercises.',
    '- Assessment records and class registers are up to date.',
    '',
    'Recommendation: Satisfactory — continue mentoring junior staff.',
  ].join('\n');
  fs.writeFileSync(path.join(REPORTS_DIR, report1Name), report1Content, 'utf8');

  const report2Name = 't-seed-3_fatima_zohra_visit_report.txt';
  const report2Content = [
    'INSPECTION VISIT REPORT',
    '========================',
    'Teacher: Fatima Zohra Mansour',
    'Primary School: Emir Abdelkader Primary School',
    'District: Ain El Hadid',
    'Status: Tenured',
    'Visit Date: 2026-10-28',
    '',
    'Observations:',
    '- Bilingual instructional materials well prepared.',
    '- Clear pacing across the session with formative checks.',
    '',
    'Recommendation: Commended for curriculum innovation.',
  ].join('\n');
  fs.writeFileSync(path.join(REPORTS_DIR, report2Name), report2Content, 'utf8');

  const report3Name = 't-seed-5_sofiane_belkacem_visit_report.txt';
  const report3Content = [
    'INSPECTION VISIT REPORT',
    '========================',
    'Teacher: Sofiane Belkacem',
    'Primary School: Ibn Badis Primary School',
    'District: Takhmaret',
    'Status: Contracted',
    'Visit Date: 2026-11-05',
    '',
    'Observations:',
    '- Good rapport with pupils; advised to allocate extra time for guided practice.',
    '- Follow-up observation scheduled for next term.',
  ].join('\n');
  fs.writeFileSync(path.join(REPORTS_DIR, report3Name), report3Content, 'utf8');

  const seeded: Teacher[] = [
    {
      id: 't-seed-1',
      fullName: 'Dr. Nadia Benali',
      institution: 'Al-Khwarizmi Primary School',
      district: 'tiaret',
      status: 'tenured',
      phone: '+213 550 112 233',
      visited: true,
      visitDate: '2026-10-14',
      notes: 'Lead primary teacher. Full inspection completed with mentoring commendation.',
      visitReport: {
        fileName: 'nadia_benali_visit_report.txt',
        storedName: report1Name,
        mimeType: 'text/plain',
        size: Buffer.byteLength(report1Content, 'utf8'),
        uploadedAt: '2026-10-14T11:20:00.000Z',
      },
      createdAt: '2026-09-02T08:30:00.000Z',
      updatedAt: '2026-10-14T11:20:00.000Z',
    },
    {
      id: 't-seed-2',
      fullName: 'Karim Haddad',
      institution: 'Ibn Sina Primary School',
      district: 'frenda',
      status: 'contracted',
      phone: '+213 661 445 566',
      visited: false,
      visitDate: null,
      notes: 'First-year contracted appointment. Scheduled for November classroom visit.',
      visitReport: null,
      createdAt: '2026-09-05T09:15:00.000Z',
      updatedAt: '2026-09-05T09:15:00.000Z',
    },
    {
      id: 't-seed-3',
      fullName: 'Fatima Zohra Mansour',
      institution: 'Emir Abdelkader Primary School',
      district: 'ain_el_hadid',
      status: 'tenured',
      phone: '+213 770 823 410',
      visited: true,
      visitDate: '2026-10-28',
      notes: 'Excellent literacy instruction and student participation.',
      visitReport: {
        fileName: 'fatima_zohra_visit_report.txt',
        storedName: report2Name,
        mimeType: 'text/plain',
        size: Buffer.byteLength(report2Content, 'utf8'),
        uploadedAt: '2026-10-28T14:45:00.000Z',
      },
      createdAt: '2026-09-08T10:00:00.000Z',
      updatedAt: '2026-10-28T14:45:00.000Z',
    },
    {
      id: 't-seed-4',
      fullName: 'Yasmine Ouali',
      institution: 'Al-Khwarizmi Primary School',
      district: 'tiaret',
      status: 'substitute',
      phone: '+213 554 908 112',
      visited: true,
      visitDate: '2026-11-02',
      notes: 'Visited during morning session; awaiting signed report upload.',
      visitReport: null,
      createdAt: '2026-09-12T08:45:00.000Z',
      updatedAt: '2026-11-02T13:10:00.000Z',
    },
    {
      id: 't-seed-5',
      fullName: 'Sofiane Belkacem',
      institution: 'Ibn Badis Primary School',
      district: 'takhmaret',
      status: 'contracted',
      phone: '+213 662 319 840',
      visited: true,
      visitDate: '2026-11-05',
      notes: 'Initial observation complete; follow-up recommended in spring term.',
      visitReport: {
        fileName: 'sofiane_belkacem_visit_report.txt',
        storedName: report3Name,
        mimeType: 'text/plain',
        size: Buffer.byteLength(report3Content, 'utf8'),
        uploadedAt: '2026-11-05T16:00:00.000Z',
      },
      createdAt: '2026-09-15T11:20:00.000Z',
      updatedAt: '2026-11-05T16:00:00.000Z',
    },
    {
      id: 't-seed-6',
      fullName: 'Mehdi Khelifi',
      institution: 'Malek Bennabi Primary School',
      district: 'frenda',
      status: 'substitute',
      phone: '+213 771 540 229',
      visited: false,
      visitDate: null,
      notes: 'Covering leave through February.',
      visitReport: null,
      createdAt: '2026-09-20T09:00:00.000Z',
      updatedAt: '2026-09-20T09:00:00.000Z',
    },
    {
      id: 't-seed-7',
      fullName: 'Samira Bouzid',
      institution: 'Ibn Sina Primary School',
      district: 'ain_el_hadid',
      status: 'tenured',
      phone: '+213 558 672 301',
      visited: false,
      visitDate: null,
      notes: 'Annual pedagogical review pending scheduling.',
      visitReport: null,
      createdAt: '2026-09-22T10:30:00.000Z',
      updatedAt: '2026-09-22T10:30:00.000Z',
    },
  ];

  fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf8');
  return seeded;
}

const SEED_DISTRICT_MAP: Record<string, SchoolDistrict> = {
  't-seed-1': 'tiaret',
  't-seed-2': 'frenda',
  't-seed-3': 'ain_el_hadid',
  't-seed-4': 'tiaret',
  't-seed-5': 'takhmaret',
  't-seed-6': 'frenda',
  't-seed-7': 'ain_el_hadid',
};

function normalizeStoredTeacher(raw: Teacher): {
  teacher: Teacher;
  changed: boolean;
} {
  let changed = false;
  let district = raw.district;
  let institution = raw.institution;

  if (!district || !ALLOWED_DISTRICTS.includes(district)) {
    district = SEED_DISTRICT_MAP[raw.id] ?? 'tiaret';
    changed = true;
  }

  if (
    raw.id.startsWith('t-seed-') &&
    /(Secondary|High|Middle) School$/i.test(institution)
  ) {
    institution = institution.replace(
      /(Secondary|High|Middle) School$/i,
      'Primary School'
    );
    changed = true;
  }

  return {
    teacher: changed ? { ...raw, district, institution } : raw,
    changed,
  };
}

function readTeachers(): Teacher[] {
  ensureDataDirs();
  if (!fs.existsSync(DB_FILE)) {
    return seedInitialData();
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let anyChanged = false;
    const normalized = (parsed as Teacher[]).map((item) => {
      const res = normalizeStoredTeacher(item);
      if (res.changed) anyChanged = true;
      return res.teacher;
    });
    if (anyChanged) {
      writeTeachers(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeTeachers(teachers: Teacher[]): void {
  ensureDataDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(teachers, null, 2), 'utf8');
}

function deleteReportFile(storedName: string | undefined): void {
  if (!storedName) return;
  const fullPath = path.join(REPORTS_DIR, path.basename(storedName));
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

function saveReportFile(
  teacherId: string,
  fileName: string,
  mimeType: string,
  contentBase64: string
): VisitReport {
  ensureDataDirs();
  const cleanName = sanitizeFileName(fileName);
  const storedName = `${teacherId}_${Date.now()}_${cleanName}`;
  const buffer = Buffer.from(contentBase64, 'base64');

  if (buffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }
  if (buffer.length > MAX_REPORT_BYTES) {
    throw new Error('Visit report exceeds the 10 MB size limit.');
  }

  fs.writeFileSync(path.join(REPORTS_DIR, storedName), buffer);

  return {
    fileName: cleanName,
    storedName,
    mimeType: mimeType || 'application/octet-stream',
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
}

async function startServer(): Promise<void> {
  ensureDataDirs();
  if (!fs.existsSync(DB_FILE)) {
    seedInitialData();
  }

  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      next: (err?: unknown) => void
    ) => {
      if (err && typeof err === 'object' && 'status' in err) {
        const status = Number((err as { status?: number }).status) || 400;
        const message =
          status === 413
            ? 'Uploaded report payload exceeds the maximum allowed size.'
            : 'Invalid request payload.';
        res.status(status).json({ error: message });
        return;
      }
      next(err);
    }
  );

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/teachers', (_req: Request, res: Response) => {
    const teachers = readTeachers();
    res.json({ teachers });
  });

  app.post('/api/teachers', (req: Request, res: Response) => {
    const body = req.body ?? {};
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const institution = typeof body.institution === 'string' ? body.institution.trim() : '';
    const district = (body.district ?? 'tiaret') as SchoolDistrict;
    const status = body.status as TeacherStatus;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const visited = Boolean(body.visited);
    const visitDate =
      visited && typeof body.visitDate === 'string' && body.visitDate.trim()
        ? body.visitDate.trim()
        : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (fullName.length < 2 || institution.length < 2) {
      res.status(400).json({
        error: 'Full name and primary school are required (at least 2 characters).',
      });
      return;
    }

    if (phone) {
      const digitCount = (phone.match(/\d/g) ?? []).length;
      if (!/^[+\d(][\d\s\-().]{4,30}$/.test(phone) || digitCount < 6) {
        res.status(400).json({
          error: 'Enter a valid phone number (at least 6 digits) or leave blank.',
        });
        return;
      }
    }

    if (!ALLOWED_DISTRICTS.includes(district)) {
      res.status(400).json({
        error: 'District must be one of: tiaret, frenda, ain_el_hadid, or takhmaret.',
      });
      return;
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({
        error: 'Status must be one of: tenured, contracted, or substitute.',
      });
      return;
    }

    const id = `t-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    let visitReport: VisitReport | null = null;
    if (body.report && typeof body.report.contentBase64 === 'string') {
      try {
        visitReport = saveReportFile(
          id,
          String(body.report.fileName || 'visit_report.pdf'),
          String(body.report.mimeType || 'application/octet-stream'),
          body.report.contentBase64
        );
      } catch (err) {
        res.status(400).json({
          error: err instanceof Error ? err.message : 'Failed to save visit report.',
        });
        return;
      }
    }

    const newTeacher: Teacher = {
      id,
      fullName,
      institution,
      district,
      status,
      phone,
      visited,
      visitDate,
      notes,
      visitReport,
      createdAt: now,
      updatedAt: now,
    };

    const teachers = readTeachers();
    teachers.unshift(newTeacher);
    writeTeachers(teachers);
    res.status(201).json({ teacher: newTeacher });
  });

  app.patch('/api/teachers/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const teachers = readTeachers();
    const index = teachers.findIndex((t) => t.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Teacher record not found.' });
      return;
    }

    const existing = teachers[index];
    const body = req.body ?? {};

    const fullName =
      typeof body.fullName === 'string' ? body.fullName.trim() : existing.fullName;
    const institution =
      typeof body.institution === 'string'
        ? body.institution.trim()
        : existing.institution;
    const district =
      body.district !== undefined
        ? (body.district as SchoolDistrict)
        : existing.district;
    const status =
      body.status !== undefined ? (body.status as TeacherStatus) : existing.status;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : existing.phone;
    const visited =
      typeof body.visited === 'boolean' ? body.visited : existing.visited;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : existing.notes;

    let visitDate = existing.visitDate;
    if (body.visitDate !== undefined) {
      visitDate =
        typeof body.visitDate === 'string' && body.visitDate.trim()
          ? body.visitDate.trim()
          : null;
    }
    if (!visited) {
      visitDate = null;
    }

    if (fullName.length < 2 || institution.length < 2) {
      res.status(400).json({
        error: 'Full name and primary school are required (at least 2 characters).',
      });
      return;
    }

    if (phone) {
      const digitCount = (phone.match(/\d/g) ?? []).length;
      if (!/^[+\d(][\d\s\-().]{4,30}$/.test(phone) || digitCount < 6) {
        res.status(400).json({
          error: 'Enter a valid phone number (at least 6 digits) or leave blank.',
        });
        return;
      }
    }

    if (!ALLOWED_DISTRICTS.includes(district)) {
      res.status(400).json({
        error: 'District must be one of: tiaret, frenda, ain_el_hadid, or takhmaret.',
      });
      return;
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({
        error: 'Status must be one of: tenured, contracted, or substitute.',
      });
      return;
    }

    const updated: Teacher = {
      ...existing,
      fullName,
      institution,
      district,
      status,
      phone,
      visited,
      visitDate,
      notes,
      updatedAt: new Date().toISOString(),
    };

    teachers[index] = updated;
    writeTeachers(teachers);
    res.json({ teacher: updated });
  });

  app.delete('/api/teachers/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const teachers = readTeachers();
    const index = teachers.findIndex((t) => t.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Teacher record not found.' });
      return;
    }

    const [removed] = teachers.splice(index, 1);
    deleteReportFile(removed.visitReport?.storedName);
    writeTeachers(teachers);
    res.json({ deletedId: id });
  });

  app.post('/api/teachers/:id/report', (req: Request, res: Response) => {
    const id = req.params.id;
    const teachers = readTeachers();
    const index = teachers.findIndex((t) => t.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Teacher record not found.' });
      return;
    }

    const body = req.body ?? {};
    if (typeof body.contentBase64 !== 'string' || !body.fileName) {
      res.status(400).json({ error: 'Report file payload is required.' });
      return;
    }

    const existing = teachers[index];
    let savedReport: VisitReport;
    try {
      savedReport = saveReportFile(
        id,
        String(body.fileName),
        String(body.mimeType || 'application/octet-stream'),
        body.contentBase64
      );
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to upload visit report.',
      });
      return;
    }

    deleteReportFile(existing.visitReport?.storedName);

    const markVisited = body.markVisited !== undefined ? Boolean(body.markVisited) : true;
    const nextVisited = markVisited ? true : existing.visited;
    const nextVisitDate =
      typeof body.visitDate === 'string' && body.visitDate.trim()
        ? body.visitDate.trim()
        : existing.visitDate ||
          (nextVisited ? new Date().toISOString().slice(0, 10) : null);

    const nextNotes =
      typeof body.notes === 'string' ? body.notes.trim() : existing.notes;

    const updated: Teacher = {
      ...existing,
      visited: nextVisited,
      visitDate: nextVisitDate,
      notes: nextNotes,
      visitReport: savedReport,
      updatedAt: new Date().toISOString(),
    };

    teachers[index] = updated;
    writeTeachers(teachers);
    res.json({ teacher: updated });
  });

  app.get('/api/teachers/:id/report/download', (req: Request, res: Response) => {
    const id = req.params.id;
    const teachers = readTeachers();
    const teacher = teachers.find((t) => t.id === id);

    if (!teacher || !teacher.visitReport) {
      res.status(404).json({ error: 'Visit report not found.' });
      return;
    }

    const filePath = path.join(
      REPORTS_DIR,
      path.basename(teacher.visitReport.storedName)
    );
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Report file is missing on disk.' });
      return;
    }

    const inline = req.query.inline === '1';
    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader(
      'Content-Type',
      teacher.visitReport.mimeType || 'application/octet-stream'
    );
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${teacher.visitReport.fileName}"`
    );
    res.sendFile(filePath);
  });

  app.delete('/api/teachers/:id/report', (req: Request, res: Response) => {
    const id = req.params.id;
    const teachers = readTeachers();
    const index = teachers.findIndex((t) => t.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Teacher record not found.' });
      return;
    }

    const existing = teachers[index];
    deleteReportFile(existing.visitReport?.storedName);

    const updated: Teacher = {
      ...existing,
      visitReport: null,
      updatedAt: new Date().toISOString(),
    };

    teachers[index] = updated;
    writeTeachers(teachers);
    res.json({ teacher: updated });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teachers Inspection Database server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
