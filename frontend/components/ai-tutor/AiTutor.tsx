'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  Info,
  CornerDownLeft,
  User,
} from 'lucide-react';

interface AiTutorProps {
  messages: ChatMessage[];
  isChatting: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Why is my circuit producing this result?',
  'What is quantum superposition?',
  'Explain the role of the Hadamard gate.',
  'How does quantum entanglement work?',
  'Explain the CNOT control and target mechanics.',
];

export default function AiTutor({
  messages,
  isChatting,
  onSend,
  onClear,
}: AiTutorProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatting]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isChatting) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* Header */}
      <div className="panel-header justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="font-semibold text-xs tracking-wide">Quantum AI Tutor</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors px-1.5 py-0.5 rounded-[var(--radius-xs)] hover:bg-[var(--color-bg)]"
            title="Clear conversation"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {messages.length === 0 ? (
          <EmptyState onSuggest={onSend} />
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Typing indicator */}
        {isChatting && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] w-fit">
            <Bot className="w-3.5 h-3.5 text-[var(--color-accent)] animate-pulse" />
            <span className="text-xs text-[var(--color-text-muted)]">Gemini is analyzing circuit…</span>
            <div className="flex gap-1 items-center ml-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Context info banner */}
      <div className="px-3.5 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[var(--color-accent)] flex-shrink-0" />
        <span>Active circuit gates & histogram probabilities are shared for live context.</span>
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col gap-1.5">
          <div className="relative flex items-center">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your circuit or quantum concepts…"
              rows={2}
              className="w-full resize-none text-xs border border-[var(--color-border)] rounded-[var(--radius-sm)] p-2.5 pr-10 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] transition-colors leading-relaxed"
              disabled={isChatting}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isChatting}
              className="absolute right-2 bottom-2.5 p-1.5 rounded-[var(--radius-xs)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-subtle)] px-1">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-2.5 h-2.5" /> Enter to send
            </span>
            <span>Powered by Google Gemini</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      className="flex flex-col"
      style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
    >
      <div className="flex items-center gap-1.5 mb-1 px-1">
        {isUser ? (
          <>
            <span className="text-[10px] font-medium text-[var(--color-text-subtle)]">You</span>
            <User className="w-3 h-3 text-[var(--color-text-muted)]" />
          </>
        ) : (
          <>
            <Bot className="w-3 h-3 text-[var(--color-accent)]" />
            <span className="text-[10px] font-semibold text-[var(--color-accent)]">Tutor</span>
          </>
        )}
      </div>
      <div
        className={`chat-bubble ${
          isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex flex-col items-center text-center gap-1.5 px-2">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-[var(--color-text)]">
          Ask Your Quantum Tutor
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Click a prompt below or type your question about circuits and physics.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="text-left text-xs px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-accent-subtle)] hover:border-[var(--color-accent)] transition-all flex items-center justify-between group"
            style={{ color: 'var(--color-text)' }}
          >
            <span className="text-[11px] leading-snug">{q}</span>
            <Sparkles className="w-3 h-3 text-[var(--color-text-subtle)] group-hover:text-[var(--color-accent)] flex-shrink-0 ml-2 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
