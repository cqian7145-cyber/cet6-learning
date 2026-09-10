import { useMemo } from 'react';
import { words } from '@/data/words';
import { useProgress, type StudyStats, type ProgressData } from '@/hooks/useProgress';
import { Flame, Target, TrendingUp, BookOpen, CheckCircle2, RotateCcw, Award, BarChart3 } from 'lucide-react';

interface DashboardProps {
  progress: ReturnType<typeof useProgress>;
}

export default function Dashboard({ progress }: DashboardProps) {
  const { stats, getProgress, resetProgress } = progress;

  const stats_map = useMemo(() => {
    let mastered = 0, learning = 0, newCount = 0;
    for (const w of words) {
      const s = getProgress(w.id).status;
      if (s === 'mastered') mastered++;
      else if (s === 'learning') learning++;
      else newCount++;
    }
    return { mastered, learning, newCount };
  }, [getProgress]);

  const accuracy = stats.totalStudied > 0 ? Math.round((stats.totalCorrect / stats.totalStudied) * 100) : 0;
  const progressPct = Math.round((stats_map.mastered / words.length) * 100);

  const recentWords = useMemo(() => {
    return words
      .map(w => ({ ...w, p: getProgress(w.id) }))
      .filter(w => w.p.lastReviewed !== null)
      .sort((a, b) => (b.p.lastReviewed ?? 0) - (a.p.lastReviewed ?? 0))
      .slice(0, 8);
  }, [getProgress]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Flame size={24} />} value={stats.streak} label="Day Streak" color="accent" />
        <StatCard icon={<Target size={24} />} value={`${accuracy}%`} label="Accuracy" color="primary" />
        <StatCard icon={<TrendingUp size={24} />} value={stats.totalStudied} label="Total Attempts" color="success" />
        <StatCard icon={<BookOpen size={24} />} value={stats_map.mastered} label="Words Mastered" color="warning" />
      </div>

      {/* Progress ring + breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Overall progress */}
        <div className="glass-card p-8 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-400 mb-6">Overall Progress</h3>
          <div className="relative">
            <svg width="160" height="160" className="transform -rotate-90">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="68" fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle
                cx="80" cy="80" r="68" fill="none" stroke="url(#progressGradient)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 68}
                strokeDashoffset={2 * Math.PI * 68 * (1 - progressPct / 100)}
                className="progress-ring__circle"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-gray-900">{progressPct}%</span>
              <span className="text-xs text-gray-400 font-medium">Mastered</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">{stats_map.mastered} of {words.length} words</p>
        </div>

        {/* Word status breakdown */}
        <div className="glass-card p-8">
          <h3 className="section-label mb-6">Word Status Breakdown</h3>
          <div className="space-y-5">
            <StatusBar label="Mastered" count={stats_map.mastered} total={words.length} color="bg-success-500" textColor="text-success-600" />
            <StatusBar label="Learning" count={stats_map.learning} total={words.length} color="bg-warning-400" textColor="text-warning-600" />
            <StatusBar label="New" count={stats_map.newCount} total={words.length} color="bg-gray-300" textColor="text-gray-500" />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Award size={18} className="text-accent-400" />
              <span className="font-medium">Keep going!</span>
            </div>
            <button
              onClick={() => { if (confirm('Reset all progress? This cannot be undone.')) resetProgress(); }}
              className="flex items-center gap-1.5 text-sm text-error-400 hover:text-error-500 font-medium transition-colors"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={18} className="text-primary-500" />
          <h3 className="text-sm font-semibold text-gray-400">Recently Studied</h3>
        </div>
        {recentWords.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentWords.map(w => (
              <div key={w.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">{w.word}</p>
                  {w.p.status === 'mastered' ? (
                    <CheckCircle2 size={16} className="text-success-400 flex-shrink-0" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-warning-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{w.translation}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Start studying to see your recent activity here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
  };
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color, textColor }: { label: string; count: number; total: number; color: string; textColor: string; }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        <span className="text-sm text-gray-400 font-medium">{count}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
