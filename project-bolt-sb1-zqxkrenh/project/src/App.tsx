import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { words } from '@/data/words';
import Flashcard from '@/components/Flashcard';
import Quiz from '@/components/Quiz';
import Spelling from '@/components/Spelling';
import WordList from '@/components/WordList';
import Dashboard from '@/components/Dashboard';
import { Layers, ListChecks, Keyboard, BookOpen, BarChart3, GraduationCap, Flame } from 'lucide-react';

type Tab = 'flashcards' | 'quiz' | 'spelling' | 'wordlist' | 'dashboard';

const tabs: { id: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'flashcards', label: 'Flashcards', shortLabel: 'Cards', icon: <Layers size={18} strokeWidth={2.25} /> },
  { id: 'quiz', label: 'Quiz', shortLabel: 'Quiz', icon: <ListChecks size={18} strokeWidth={2.25} /> },
  { id: 'spelling', label: 'Spelling', shortLabel: 'Spell', icon: <Keyboard size={18} strokeWidth={2.25} /> },
  { id: 'wordlist', label: 'Word List', shortLabel: 'List', icon: <BookOpen size={18} strokeWidth={2.25} /> },
  { id: 'dashboard', label: 'Progress', shortLabel: 'Stats', icon: <BarChart3 size={18} strokeWidth={2.25} /> },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('flashcards');
  const progress = useProgress();
  const masteredCount = words.filter(w => progress.getProgress(w.id).status === 'mastered').length;
  const masteredPct = Math.round((masteredCount / words.length) * 100);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 app-header">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-800 text-white">
                <GraduationCap size={20} strokeWidth={2.25} />
              </div>
              <div>
                <h1 className="font-bold text-stone-900 text-base sm:text-lg leading-tight tracking-tight">
                  CET-6 Vocabulary
                  <span className="hidden sm:inline font-normal text-stone-400 ml-2 text-sm">六级核心词汇</span>
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">300 词 · 本地进度</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="section-label block">Mastered</span>
                <span className="text-sm font-bold text-teal-800 tabular-nums">{masteredPct}%</span>
              </div>
              <div
                key={progress.stats.streak}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-200 animate-streak-pop"
              >
                <Flame size={16} className="text-amber-600" />
                <span className="text-sm font-bold text-stone-800 tabular-nums">{progress.stats.streak}</span>
                <span className="text-xs text-stone-500 hidden min-[380px]:inline">天</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 hidden sm:block">
          <div className="nav-rail">
            <div
              className="nav-rail-indicator"
              style={{
                width: `calc((100% - 8px) / ${tabs.length})`,
                left: `calc(4px + ${activeIndex} * ((100% - 8px) / ${tabs.length}))`,
              }}
              aria-hidden
            />
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-2 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto animate-page-enter" key={activeTab}>
          {activeTab === 'flashcards' && <Flashcard progress={progress} />}
          {activeTab === 'quiz' && <Quiz progress={progress} />}
          {activeTab === 'spelling' && <Spelling progress={progress} />}
          {activeTab === 'wordlist' && <WordList progress={progress} />}
          {activeTab === 'dashboard' && <Dashboard progress={progress} />}
        </div>
      </main>

      <nav className="sm:hidden sticky bottom-0 z-20 app-header border-t pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around px-1 py-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 min-w-[4rem] rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-teal-800 bg-white border border-stone-200 shadow-sm scale-105'
                  : 'text-stone-400'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>

      <footer className="text-center py-8 text-xs text-stone-400 pb-24 sm:pb-8">
        <p>CET-6 Vocabulary Trainer · Progress saved on this device</p>
      </footer>
    </div>
  );
}

export default App;
