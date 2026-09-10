import { useState, useMemo, useEffect } from 'react';
import { words, type Word } from '@/data/words';
import { useProgress } from '@/hooks/useProgress';
import { Check, X, Volume2, Trophy, RotateCcw, ChevronRight } from 'lucide-react';

interface QuizProps {
  progress: ReturnType<typeof useProgress>;
}

const QUIZ_LENGTH = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: Word, count: number): Word[] {
  const pool = words.filter(w => w.id !== correct.id);
  return shuffle(pool).slice(0, count);
}

export default function Quiz({ progress }: QuizProps) {
  const { recordAnswer } = progress;
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState<'cn-to-en' | 'en-to-cn'>('en-to-cn');

  const startQuiz = () => {
    setQuizWords(shuffle(words).slice(0, QUIZ_LENGTH));
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setWrongCount(0);
    setFinished(false);
  };

  useEffect(() => {
    startQuiz();
  }, []);

  const currentWord = quizWords[currentIdx];
  const options = useMemo(() => {
    if (!currentWord) return [];
    const distractors = pickDistractors(currentWord, 3);
    return shuffle([currentWord, ...distractors]);
  }, [currentWord]);

  if (finished) {
    const accuracy = Math.round((score / QUIZ_LENGTH) * 100);
    return (
      <div className="max-w-xl mx-auto text-center py-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 mb-6 shadow-lg shadow-primary-600/30">
          <Trophy size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 mb-8">You answered {score} out of {QUIZ_LENGTH} correctly.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-3xl font-bold text-primary-600">{accuracy}%</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Accuracy</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-3xl font-bold text-success-600">{score}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Correct</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-3xl font-bold text-error-500">{wrongCount}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Wrong</p>
          </div>
        </div>

        <button
          onClick={startQuiz}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30"
        >
          <RotateCcw size={20} /> New Quiz
        </button>
      </div>
    );
  }

  if (!currentWord) return null;

  const handleSelect = (wordId: number) => {
    if (selected !== null) return;
    setSelected(wordId);
    const correct = wordId === currentWord.id;
    recordAnswer(currentWord.id, correct);
    if (correct) setScore(s => s + 1);
    else setWrongCount(w => w + 1);
    setTimeout(() => {
      if (currentIdx + 1 >= QUIZ_LENGTH) {
        setFinished(true);
      } else {
        setCurrentIdx(i => i + 1);
        setSelected(null);
      }
    }, 1200);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      speechSynthesis.speak(u);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setMode('en-to-cn')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${mode === 'en-to-cn' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
          >
            English → Chinese
          </button>
          <button
            onClick={() => setMode('cn-to-en')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${mode === 'cn-to-en' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
          >
            Chinese → English
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium">Question {currentIdx + 1} / {QUIZ_LENGTH}</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-success-600 font-semibold">{score} correct</span>
          <span className="text-error-500 font-semibold">{wrongCount} wrong</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${((currentIdx) / QUIZ_LENGTH) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 mb-6 animate-slide-up" key={currentIdx}>
        <p className="text-center text-sm text-gray-400 mb-4 font-medium">What does this mean?</p>
        {mode === 'en-to-cn' ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="text-4xl font-bold text-gray-900">{currentWord.word}</h2>
              <button onClick={() => speak(currentWord.word)} className="p-2 rounded-full bg-primary-50 text-primary-500 hover:bg-primary-100 transition-colors">
                <Volume2 size={22} />
              </button>
            </div>
            <p className="text-gray-400 text-sm">{currentWord.phonetic} · {currentWord.pos}</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{currentWord.translation}</h2>
            <p className="text-gray-400 text-sm">{currentWord.definition}</p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt.id === currentWord.id;
          const isSelected = selected === opt.id;
          let cls = 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-md text-gray-700';
          if (selected !== null) {
            if (isCorrect) cls = 'bg-success-50 border-success-300 text-success-700';
            else if (isSelected) cls = 'bg-error-50 border-error-300 text-error-600';
            else cls = 'bg-white border-gray-200 text-gray-400';
          }
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={selected !== null}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${cls}`}
            >
              <span className="font-medium">
                {mode === 'en-to-cn' ? opt.translation : opt.word}
              </span>
              {selected !== null && isCorrect && <Check size={20} className="text-success-500" />}
              {selected !== null && isSelected && !isCorrect && <X size={20} className="text-error-500" />}
            </button>
          );
        })}
      </div>

      {/* Next hint */}
      {selected !== null && (
        <div className="text-center mt-6 text-sm text-gray-400 animate-fade-in flex items-center justify-center gap-1">
          <ChevronRight size={16} /> Next question...
        </div>
      )}
    </div>
  );
}
