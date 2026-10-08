import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Info,
  Dumbbell
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Coverage() {
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoverage = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getCoverage();
        setCoverage(res);
      } catch (err) {
        console.error('Failed to load coverage', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoverage();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-zinc-900 rounded-xl w-1/3" />
        <div className="h-80 bg-zinc-900 rounded-2xl" />
      </div>
    );
  }

  const coverageEntries = Object.entries(coverage || {});
  const behindSchedule = coverageEntries.filter(
    ([_, val]) => val.planned > 0 && val.completed < val.planned
  );
  const onTrackCount = coverageEntries.filter(
    ([_, val]) => val.planned > 0 && val.completed >= val.planned
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
          Weekly Muscle Volume Coverage
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Real-time planned vs completed sets for the current week (Monday – Sunday).
        </p>
      </div>

      {/* Behind Schedule Warning Alert */}
      {behindSchedule.length > 0 ? (
        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-yellow-400">
            <AlertTriangle size={17} /> {behindSchedule.length} Body Part{behindSchedule.length > 1 ? 's' : ''} Behind Schedule This Week
          </div>
          <p>
            You have not completed the target sets for:{' '}
            <span className="font-bold text-zinc-100">
              {behindSchedule.map(([bp, v]) => `${bp.toUpperCase()} (${v.completed}/${v.planned} sets)`).join(', ')}
            </span>
            . Consider adding volume to your next session.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={18} />
          <span>All targeted muscle groups are fully on schedule this week! Exceptional volume consistency.</span>
        </div>
      )}

      {/* Main Coverage Cards */}
      <Card title="Muscle Group Breakdown" subtitle="Optimal hypertrophy target: 10–20 direct working sets per week">
        <div className="space-y-5 mt-2">
          {coverageEntries.map(([part, stats]) => {
            const planned = stats.planned || 0;
            const completed = stats.completed || 0;
            const percent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : (completed > 0 ? 100 : 0);

            let statusColor = 'bg-emerald-500';
            let badgeVariant = 'success';
            let statusText = 'On Track';

            if (stats.status === 'danger' || (planned > 0 && percent < 50)) {
              statusColor = 'bg-red-500';
              badgeVariant = 'danger';
              statusText = 'Behind';
            } else if (stats.status === 'warning' || (planned > 0 && percent < 100)) {
              statusColor = 'bg-yellow-500';
              badgeVariant = 'warning';
              statusText = 'In Progress';
            } else if (planned === 0 && completed === 0) {
              statusColor = 'bg-zinc-700';
              badgeVariant = 'default';
              statusText = 'Not Scheduled';
            }

            return (
              <div key={part} className="space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold capitalize text-zinc-200 text-sm">{part}</span>
                    <Badge variant={badgeVariant} size="xs">
                      {statusText}
                    </Badge>
                  </div>
                  <div className="text-zinc-400 font-semibold">
                    <span className="text-zinc-100 font-bold">{completed}</span>
                    {planned > 0 && <span> / {planned} sets</span>}
                    {planned > 0 && <span className="text-zinc-400 text-[11px] ml-1.5">({percent}%)</span>}
                  </div>
                </div>

                <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full ${statusColor} rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* AI Coach Volume Recommendation */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-950/40 to-zinc-900 border border-blue-500/30 flex gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-400">Coach Volume Analysis</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {behindSchedule.length > 0 
              ? `Prioritize hitting your remaining ${behindSchedule.map(([bp]) => bp).join(' and ')} sets before the week resets on Sunday night to ensure balanced muscular development and prevent imbalances.`
              : 'Your weekly volume distribution is well-balanced across push, pull, and leg muscle groups. Keep maintaining this consistency!'}
          </p>
          <div className="pt-2">
            <Link to="/workout">
              <span className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                Log a session to fill gaps →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
