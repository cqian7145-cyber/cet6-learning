import { useState, useEffect, useMemo } from 'react';
import { words, type Word } from '@/data/words';
import { useProgress, type WordStatus } from '@/hooks/useProgress';
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Volume2, BookOpen } from 'lucide-react';

interface FlashcardProps {
  progress: ReturnType<typeof useProgress>;
}

export default function Flashcard({ progress }: FlashcardProps) {
  const { markAsStudied, recordAnswer, getProgress } = progress;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentWord = words[index];

  const wordProgress = getProgress(currentWord.id);

  // Filter modes
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');

  const filteredWords = useMemo(() => {
    if (filter === 'all') return words;
    return words.filter(w => {
      const p = getProgress(w.id);
      return p.status === (filter as WordStatus);
    });
  }, [filter, getProgress]);

  const filteredIndex = useMemo(() => {
    const wi = filteredWords.findIndex(w => w.id === currentWord.id);
    return wi >= 0 ? wi : 0;
  }, [filteredWords, currentWord.id]);

  useEffect(() => {
    if (filteredWords.length > 0) {
      const w = filteredWords[Math.min(filteredIndex, filteredWords.length - 1)];
      if (w.id !== currentWord.id) {
        setIndex(words.findIndex(word => word.id === w.id));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWords]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const goNext = () => {
    setFlipped(false);
    setDirection('forward');
    setTimeout(() => {
      setIndex(prev => {
        const next = (prev + 1) % words.length;
        markAsStudied(words[next].id);
        return next;
      });
    }, 150);
  };

  const goPrev = () => {
    setFlipped(false);
    setDirection('backward');
    setTimeout(() => {
      setIndex(prev => (prev - 1 + words.length) % words.length);
    }, 150);
  };

  const handleAnswer = (correct: boolean) => {
    recordAnswer(currentWord.id, correct);
    setTimeout(goNext, 400);
  };

  const statusColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600',
    learning: 'bg-warning-100 text-warning-700',
    mastered: 'bg-success-100 text-success-700',
  };

  const statusLabels: Record<string, string> = {
    new: 'New',
    learning: 'Learning',
    mastered: 'Mastered',
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {(['all', 'new', 'learning', 'mastered'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            {f === 'all' ? 'All Words' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium">
          {filteredWords.length > 0 ? filteredIndex + 1 : 0} / {filteredWords.length}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[wordProgress.status]}`}>
          {statusLabels[wordProgress.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${filteredWords.length > 0 ? ((filteredIndex + 1) / filteredWords.length) * 100 : 0}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="flip-card mb-6" style={{ height: '420px' }}>
        <div className={`flip-card-inner relative w-full h-full ${flipped ? 'is-flipped' : ''}`}>
          {/* Front face - English */}
          <div className="flip-card-face absolute inset-0 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 cursor-pointer"
               onClick={() => setFlipped(true)}>
            <div className="absolute top-5 left-5">
              <span className="text-xs font-semibold text-primary-400 bg-primary-50 px-3 py-1 rounded-full">
                {currentWord.pos}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 hover:bg-primary-50 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Volume2 size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                {currentWord.word}
              </h2>
              <p className="text-lg text-gray-400 font-medium mb-8">{currentWord.phonetic}</p>
              <div className="flex items-center gap-2 text-primary-400 animate-fade-in">
                <BookOpen size={18} />
                <span className="text-sm font-medium">Tap to reveal meaning</span>
              </div>
            </div>
          </div>

          {/* Back face - Chinese + example */}
          <div className="flip-card-face flip-card-back absolute inset-0 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 cursor-pointer"
               onClick={() => setFlipped(false)}>
            <div className="text-center w-full">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentWord.translation}</h2>
              <p className="text-sm text-gray-500 mb-6">{currentWord.definition}</p>
              <div className="bg-primary-50 rounded-2xl p-5 text-left">
                <p className="text-gray-700 text-base italic mb-2">"{currentWord.example}"</p>
                <p className="text-gray-400 text-sm">{currentWord.exampleTranslation}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
                className="mt-5 flex items-center gap-2 text-primary-500 hover:text-primary-600 text-sm font-medium mx-auto"
              >
                <Volume2 size={16} /> Pronounce
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={goPrev}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-500 transition-all shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex gap-3 flex-1 justify-center">
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-error-50 text-error-600 font-semibold hover:bg-error-100 transition-all border border-error-200"
          >
            <X size={20} /> Don't Know
          </button>
          <button
          onClick={() => setFlipped(!flipped)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-50 text-primary-600 font-semibold hover:bg-primary-100 transition-all border border-primary-200"
          >
          <RotateCcw size={20} /> Flip
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-success-50 text-success-600 font-semibold hover:bg-success-100 transition-all border border-success-200"
          >
            <Check size={20} /> Know It
          </button>
        </div>

        <button
          onClick={goNext}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-500 transition-all shadow-sm"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {filteredWords.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No words in this category yet.</p>
        </div>
      )}
    </div>
  );
}
