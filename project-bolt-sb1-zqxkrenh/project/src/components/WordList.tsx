import { useState, useMemo } from 'react';
import { words, type Word } from '@/data/words';
import { useProgress, type WordStatus } from '@/hooks/useProgress';
import { Search, Volume2, Check, X, BookOpen } from 'lucide-react';

interface WordListProps {
  progress: ReturnType<typeof useProgress>;
}

export default function WordList({ progress }: WordListProps) {
  const { getProgress } = progress;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = words;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.translation.includes(search.trim()) ||
        w.definition.toLowerCase().includes(q)
      );
    }
    if (filter !== 'all') {
      result = result.filter(w => getProgress(w.id).status === (filter as WordStatus));
    }
    return result;
  }, [search, filter, getProgress]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      speechSynthesis.speak(u);
    }
  };

  const statusDot: Record<string, string> = {
    new: 'bg-gray-300',
    learning: 'bg-warning-400',
    mastered: 'bg-success-400',
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words, meanings, or definitions..."
          className="input-field pl-12 pr-4 py-3.5"
        />
      </div>

      {/* Filter tabs */}
      <div className="filter-bar mb-6">
        {(['all', 'new', 'learning', 'mastered'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`filter-tab ${filter === f ? 'is-active' : ''}`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center font-medium">{filtered.length} words</span>
      </div>

      {/* Word list */}
      <div className="space-y-2">
        {filtered.map((w) => {
          const p = getProgress(w.id);
          const isExpanded = expandedId === w.id;
          return (
            <div
              key={w.id}
              className={`surface-card transition-all overflow-hidden ${
                isExpanded ? 'border-teal-600/40 shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : 'hover:border-stone-300'
              }`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[p.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{w.word}</h3>
                    <span className="text-xs text-gray-400 font-medium">{w.pos}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{w.translation}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(w.word); }}
                  className="p-2 rounded-full text-gray-300 hover:text-primary-500 hover:bg-primary-50 transition-colors flex-shrink-0"
                >
                  <Volume2 size={18} />
                </button>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  {p.correctCount > 0 && <span className="flex items-center gap-0.5 text-success-500"><Check size={14} />{p.correctCount}</span>}
                  {p.wrongCount > 0 && <span className="flex items-center gap-0.5 text-error-400"><X size={14} />{p.wrongCount}</span>}
                  {p.correctCount === 0 && p.wrongCount === 0 && <span className="text-gray-300">—</span>}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 animate-fade-in">
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-400 mb-2">{w.phonetic}</p>
                    <p className="text-sm text-gray-600 mb-3">{w.definition}</p>
                    <div className="bg-primary-50 rounded-xl p-3">
                      <p className="text-sm text-gray-700 italic mb-1">"{w.example}"</p>
                      <p className="text-xs text-gray-400">{w.exampleTranslation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No words found.</p>
        </div>
      )}
    </div>
  );
}
