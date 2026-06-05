import { create } from 'zustand'
import type { Question, Test, TestType } from '../types'

interface TestFlowState {
  currentTest: Test | null
  questions: Question[]
  testType: TestType
  setCurrentTest: (test: Test | null) => void
  setQuestions: (questions: Question[]) => void
  addQuestion: (question: Question) => void
  updateQuestion: (index: number, question: Question) => void
  removeQuestion: (index: number) => void
  setTestType: (type: TestType) => void
  reset: () => void
}

export const useTestFlowStore = create<TestFlowState>((set) => ({
  currentTest: null,
  questions: [],
  testType: 'chapterwise',

  setCurrentTest: (test) => set({ currentTest: test }),
  setQuestions: (questions) => set({ questions }),
  addQuestion: (question) =>
    set((state) => ({ questions: [...state.questions, question] })),
  updateQuestion: (index, question) =>
    set((state) => {
      const questions = [...state.questions]
      questions[index] = question
      return { questions }
    }),
  removeQuestion: (index) =>
    set((state) => ({
      questions: state.questions.filter((_, i) => i !== index),
    })),
  setTestType: (type) => set({ testType: type }),
  reset: () =>
    set({ currentTest: null, questions: [], testType: 'chapterwise' }),
}))
