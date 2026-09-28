'use client';

// components/auth/RootProviders.tsx
// Client-side provider tree — keeps layout.tsx as a server component.
// Owns the global AuthModal so any part of the app can trigger it.

import { useState, useCallback, createContext, useContext } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import AuthModal from './AuthModal';


// Modal trigger context — lets children open the modal with a custom prompt

interface ModalContextValue {
  openAuthModal: (prompt?: string) => void;
}

const ModalContext = createContext<ModalContextValue>({ openAuthModal: () => {} });

export function useAuthModal() {
  return useContext(ModalContext);
}


// Root provider tree

export default function RootProviders({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalPrompt, setModalPrompt] = useState<string | undefined>(undefined);

  const openAuthModal = useCallback((prompt?: string) => {
    setModalPrompt(prompt);
    setModalOpen(true);
  }, []);

  return (
    <ModalContext.Provider value={{ openAuthModal }}>
      <AuthProvider onAuthModalRequest={() => openAuthModal()}>
        {children}
        <AuthModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          prompt={modalPrompt}
        />
      </AuthProvider>
    </ModalContext.Provider>
  );
}
