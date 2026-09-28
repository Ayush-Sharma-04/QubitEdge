'use client';

import dynamic from 'next/dynamic';

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-surface)' }}>
      {/* Monaco Editor fills the full panel */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="python"
          theme="vs-light"
          value={code}
          onChange={(v) => onChange(v ?? '')}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
          }}
        />
      </div>
    </div>
  );
}
