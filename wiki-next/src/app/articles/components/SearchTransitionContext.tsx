'use client';

import { createContext, useContext, useTransition, ReactNode } from 'react';

interface TransitionContextType {
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <TransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useSearchTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useSearchTransition must be used within TransitionProvider');
  return ctx;
}