import type { TeacherStats } from '../types/teacher';

interface StatsStripProps {
  stats: TeacherStats;
}

export function StatsStrip({ stats }: StatsStripProps) {
  const visitCoverage =
    stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0;

  const tenuredPct =
    stats.total > 0 ? (stats.byStatus.tenured / stats.total) * 100 : 0;
  const contractedPct =
    stats.total > 0 ? (stats.byStatus.contracted / stats.total) * 100 : 0;
  const substitutePct =
    stats.total > 0 ? (stats.byStatus.substitute / stats.total) * 100 : 0;

  const reportCoverage =
    stats.visited > 0
      ? Math.round((stats.reportsUploaded / stats.visited) * 100)
      : 0;

  return (
    <section
      aria-label="Faculty inspection summary"
      className="bg-white border border-slate-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/90"
    >
      <div className="px-5 py-4 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Total Teachers</p>
          <p className="mt-1.5 font-editorial text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {stats.total}
          </p>
        </div>
        <div className="mt-3 space-y-1.5">
          <div
            className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex"
            aria-hidden="true"
          >
            <div
              className="h-full bg-slate-800"
              style={{ width: `${tenuredPct}%` }}
            />
            <div
              className="h-full bg-blue-600"
              style={{ width: `${contractedPct}%` }}
            />
            <div
              className="h-full bg-amber-600"
              style={{ width: `${substitutePct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 truncate tabular-nums">
            {stats.byStatus.tenured} Tenured · {stats.byStatus.contracted} Contracted ·{' '}
            {stats.byStatus.substitute} Substitute
          </p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Visited</p>
          <p className="mt-1.5 font-editorial text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {stats.visited}
          </p>
        </div>
        <div className="mt-3 space-y-1.5">
          <div
            className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${visitCoverage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 truncate tabular-nums">
            {visitCoverage}% inspection coverage
          </p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Not Visited</p>
          <p className="mt-1.5 font-editorial text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {stats.notVisited}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500 truncate">
          {stats.notVisited === 0
            ? 'All listed teachers visited'
            : 'Awaiting scheduled classroom visit'}
        </p>
      </div>

      <div className="px-5 py-4 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Reports Uploaded</p>
          <p className="mt-1.5 font-editorial text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {stats.reportsUploaded}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500 truncate tabular-nums">
          {stats.visited > 0
            ? `${reportCoverage}% of visited records documented`
            : 'Attached inspection documents'}
        </p>
      </div>
    </section>
  );
}
