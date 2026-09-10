import { useState, useEffect, useCallback } from 'react';

export type WordStatus = 'new' | 'learning' | 'mastered';

export interface WordProgress {
  status: WordStatus;
  correctCount: number;
  wrongCount: number;
  lastReviewed: number | null;
}

export interface ProgressData {
  [wordId: number]: WordProgress;
}

export interface StudyStats {
  totalStudied: number;
  totalCorrect: number;
  totalWrong: number;
  streak: number;
  lastStudyDate: string | null;
}

const PROGRESS_KEY = 'cet6_progress';
const STATS_KEY = 'cet6_stats';

function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) as ProgressData : {};
  } catch {
    return {};
  }
}

function loadStats(): StudyStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw) as StudyStats;
  } catch { /* ignore */ }
  return { totalStudied: 0, totalCorrect: 0, totalWrong: 0, streak: 0, lastStudyDate: null };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress);
  const [stats, setStats] = useState<StudyStats>(loadStats);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  const recordAnswer = useCallback((wordId: number, correct: boolean) => {
    setProgress(prev => {
      const existing = prev[wordId] ?? { status: 'new' as WordStatus, correctCount: 0, wrongCount: 0, lastReviewed: null };
      const correctCount = existing.correctCount + (correct ? 1 : 0);
      const wrongCount = existing.wrongCount + (correct ? 0 : 1);
      let status: WordStatus = 'learning';
      if (correctCount >= 3 && correctCount > wrongCount) status = 'mastered';
      else if (existing.status === 'new') status = 'learning';
      else status = existing.status;
      return {
        ...prev,
        [wordId]: { status, correctCount, wrongCount, lastReviewed: Date.now() },
      };
    });
    setStats(prev => {
      const today = todayStr();
      let streak = prev.streak;
      if (prev.lastStudyDate === today) {
        // same day, keep streak
      } else if (prev.lastStudyDate && daysBetween(prev.lastStudyDate, today) === 1) {
        streak = prev.streak + 1;
      } else {
        streak = 1;
      }
      return {
        totalStudied: prev.totalStudied + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        totalWrong: prev.totalWrong + (correct ? 0 : 1),
        streak,
        lastStudyDate: today,
      };
    });
  }, []);

  const markAsStudied = useCallback((wordId: number) => {
    setProgress(prev => {
      if (prev[wordId]) return prev;
      return {
        ...prev,
        [wordId]: { status: 'learning' as WordStatus, correctCount: 0, wrongCount: 0, lastReviewed: Date.now() },
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({});
    setStats({ totalStudied: 0, totalCorrect: 0, totalWrong: 0, streak: 0, lastStudyDate: null });
  }, []);

  const getProgress = useCallback((wordId: number): WordProgress => {
    return progress[wordId] ?? { status: 'new' as WordStatus, correctCount: 0, wrongCount: 0, lastReviewed: null };
  }, [progress]);

  return { progress, stats, recordAnswer, markAsStudied, resetProgress, getProgress };
}
