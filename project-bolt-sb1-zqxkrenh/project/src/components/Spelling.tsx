import { useState, useEffect, useRef } from 'react';
import { words, type Word } from '@/data/words';
import { useProgress } from '@/hooks/useProgress';
import { Check, X, Volume2, RotateCcw, Sparkles, Keyboard } from 'lucide-react';
import { animateSuccess } from '@/lib/motion';

interface SpellingProps {
  progress: ReturnType<typeof useProgress>;
}

const ROUND_LENGTH = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Spelling({ progress }: SpellingProps) {
  const { recordAnswer } = progress;
  const [roundWords, setRoundWords] = useState<Word[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const successIconRef = useRef<SVGSVGElement>(null);

  const startRound = () => {
    setRoundWords(shuffle(words).slice(0, ROUND_LENGTH));
    setCurrentIdx(0);
    setInput('');
    setResult(null);
    setScore(0);
    setWrongCount(0);
    setFinished(false);
    setShowHint(false);
  };

  useEffect(() => {
    startRound();
  }, []);

  useEffect(() => {
    if (inputRef.current && result === null) {
      inputRef.current.focus();
    }
  }, [currentIdx, result]);

  // 拼写正确：成功图标 scale 0.8 → 1.08 → 1 弹一下
  useEffect(() => {
    if (result === 'correct' && successIconRef.current) {
      animateSuccess(successIconRef.current);
    }
  }, [result]);

  const currentWord = roundWords[currentIdx];

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      speechSynthesis.speak(u);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (result !== null || !currentWord) return;
    const correct = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setResult(correct ? 'correct' : 'wrong');
    recordAnswer(currentWord.id, correct);
    if (correct) setScore(s => s + 1);
    else setWrongCount(w => w + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= ROUND_LENGTH) {
      setFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
      setInput('');
      setResult(null);
      setShowHint(false);
    }
  };

  if (finished) {
    const accuracy = Math.round((score / ROUND_LENGTH) * 100);
    return (
      <div className="max-w-xl mx-auto text-center py-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 mb-6 shadow-lg shadow-accent-600/30">
          <Keyboard size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Round Complete!</h2>
        <p className="text-gray-500 mb-8">You spelled {score} out of {ROUND_LENGTH} words correctly.</p>
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
        <button onClick={startRound} className="btn-primary">
          <RotateCcw size={20} /> New Round
        </button>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium">Word {currentIdx + 1} / {ROUND_LENGTH}</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-success-600 font-semibold">{score} correct</span>
          <span className="text-error-500 font-semibold">{wrongCount} wrong</span>
        </div>
      </div>
      <div className="progress-track mb-8">
        <div className="progress-fill" style={{ width: `${(currentIdx / ROUND_LENGTH) * 100}%` }} />
      </div>

      {/* Prompt card */}
      <div className={`glass-card p-8 mb-6 transition-all ${result === 'correct' ? 'ring-2 ring-success-300/80' : result === 'wrong' ? 'ring-2 ring-error-300/80 animate-shake' : ''}`} key={currentIdx}>
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4 font-medium">Type the word that matches:</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentWord.translation}</h2>
          <p className="text-gray-500 text-sm mb-6">{currentWord.definition}</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => speak(currentWord.word)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium">
              <Volume2 size={18} /> Listen
            </button>
            <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 text-accent-600 hover:bg-accent-100 transition-colors text-sm font-medium">
              <Sparkles size={18} /> {showHint ? 'Hide' : 'Hint'}
            </button>
          </div>
          {showHint && (
            <div className="mt-4 animate-fade-in">
              <p className="text-gray-400 text-sm">
                {currentWord.word.split('').map((ch, i) => (
                  <span key={i}>
                    {i === 0 || i === currentWord.word.length - 1 || i % 3 === 0 ? ch : '_'}
                    {i < currentWord.word.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
              <p className="text-gray-300 text-xs mt-1">{currentWord.phonetic}</p>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={result !== null}
            placeholder="Type the word here..."
            className={`input-premium px-6 py-4 text-lg font-medium text-center border-2 ${
              result === 'correct' ? 'border-success-400 bg-success-50 text-success-700' :
              result === 'wrong' ? 'border-error-400 bg-error-50 text-error-600' :
              'text-slate-900'
            }`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {result === 'correct' && <Check ref={successIconRef} size={24} className="absolute right-5 top-1/2 -translate-y-1/2 text-success-500" />}
          {result === 'wrong' && <X size={24} className="absolute right-5 top-1/2 -translate-y-1/2 text-error-500" />}
        </div>

        {result === null && (
          <button type="submit" className="w-full mt-4 btn-primary">
            Submit Answer
          </button>
        )}
      </form>

      {/* Result feedback */}
      {result !== null && (
        <div className="mt-6 animate-slide-up">
          {result === 'correct' ? (
            <div className="bg-success-50 rounded-2xl p-5 text-center border border-success-200">
              <p className="text-success-700 font-semibold text-lg mb-1">Correct!</p>
              <p className="text-success-600 text-sm">{currentWord.word} — {currentWord.translation}</p>
            </div>
          ) : (
            <div className="bg-error-50 rounded-2xl p-5 text-center border border-error-200">
              <p className="text-error-600 font-semibold text-lg mb-1">The correct answer is:</p>
              <p className="text-error-700 text-xl font-bold">{currentWord.word}</p>
              <p className="text-error-500 text-sm mt-1">{currentWord.example}</p>
            </div>
          )}
          <button onClick={handleNext} className="w-full mt-4 btn-primary">
            {currentIdx + 1 >= ROUND_LENGTH ? 'See Results' : 'Next Word'}
          </button>
        </div>
      )}
    </div>
  );
}
