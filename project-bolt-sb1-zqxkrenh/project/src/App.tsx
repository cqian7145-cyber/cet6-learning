import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import Flashcard from '@/components/Flashcard';
import Quiz from '@/components/Quiz';
import Spelling from '@/components/Spelling';
import WordList from '@/components/WordList';
import Dashboard from '@/components/Dashboard';
import { Layers, ListChecks, Keyboard, BookOpen, BarChart3, GraduationCap } from 'lucide-react';

type Tab = 'flashcards' | 'quiz' | 'spelling' | 'wordlist' | 'dashboard';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'flashcards', label: 'Flashcards', icon: <Layers size={20} /> },
  { id: 'quiz', label: 'Quiz', icon: <ListChecks size={20} /> },
  { id: 'spelling', label: 'Spelling', icon: <Keyboard size={20} /> },
  { id: 'wordlist', label: 'Word List', icon: <BookOpen size={20} /> },
  { id: 'dashboard', label: 'Progress', icon: <BarChart3 size={20} /> },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('flashcards');
  const progress = useProgress();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-600/20">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-none">CET-6 Vocabulary</h1>
                <p className="text-xs text-gray-400 mt-0.5">Master 300 essential words</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-medium">{progress.stats.streak}</span>
              <span className="text-accent-400">day streak</span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="max-w-5xl mx-auto px-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        {activeTab === 'flashcards' && <Flashcard progress={progress} />}
        {activeTab === 'quiz' && <Quiz progress={progress} />}
        {activeTab === 'spelling' && <Spelling progress={progress} />}
        {activeTab === 'wordlist' && <WordList progress={progress} />}
        {activeTab === 'dashboard' && <Dashboard progress={progress} />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden bg-white border-t border-gray-100 sticky bottom-0">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 px-3 transition-colors ${
                activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        <p>CET-6 Vocabulary Trainer · Your progress is saved locally</p>
      </footer>
    </div>
  );
}

export default App;
