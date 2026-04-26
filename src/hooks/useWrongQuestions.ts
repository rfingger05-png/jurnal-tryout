import { useState, useEffect } from 'react';

export interface WrongQuestion {
  id: string;
  timestamp: number;
  category: 'reading' | 'listening';
  question: string;
  notes: string;
  tryout_id?: string;
}

export function useWrongQuestions() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const userId = localStorage.getItem('turso-user-id');

  const fetchQuestions = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/questions', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const json = await res.json();
        setQuestions(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [userId]);

  const addQuestion = async (newQuestion: Omit<WrongQuestion, 'id' | 'timestamp'>) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(newQuestion)
      });
      if (res.ok) {
        const savedQ = await res.json();
        setQuestions((prev) => [savedQ, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    questions,
    addQuestion,
    deleteQuestion,
  };
}
