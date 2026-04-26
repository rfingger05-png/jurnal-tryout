import { useState, useEffect } from 'react';

export interface TryoutData {
  id: string;
  timestamp: number;
  reading: number;
  listening: number;
  name?: string;
}

export function useTryoutData() {
  const [data, setData] = useState<TryoutData[]>([]);
  const userId = localStorage.getItem('turso-user-id');

  const fetchTryouts = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/tryouts', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTryouts();
  }, [userId]);

  const addTryout = async (tryout: Omit<TryoutData, 'id' | 'timestamp'>): Promise<TryoutData | null> => {
    if (!userId) return null;
    try {
      const res = await fetch('/api/tryouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(tryout)
      });
      if (res.ok) {
        const newTryout = await res.json();
        setData((prev) => [newTryout, ...prev]);
        return newTryout;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const deleteTryout = async (id: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/tryouts/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        setData((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const calculateTotals = (tryout: Omit<TryoutData, 'id' | 'timestamp'>) => {
    const safeReading = Math.min(tryout.reading, 20);
    const safeListening = Math.min(tryout.listening, 20);

    return {
      readingCorrect: safeReading,
      listeningCorrect: safeListening,
      readingScore: safeReading * 2.5,
      listeningScore: safeListening * 2.5,
      totalScore: (safeReading * 2.5) + (safeListening * 2.5),
    };
  };

  return {
    data,
    addTryout,
    deleteTryout,
    calculateTotals,
    fetchTryouts
  };
}
