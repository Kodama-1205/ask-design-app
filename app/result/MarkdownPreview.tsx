// app/result/MarkdownPreview.tsx（完成版：Markdown表示 + コードブロックCopy）
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <div style={md.wrap}>
      <ReactMarkdown
        components={{
          h1: (p) => <h1 style={md.h1} {...p} />,
          h2: (p) => <h2 style={md.h2} {...p} />,
          h3: (p) => <h3 style={md.h3} {...p} />,
          p: (p) => <p style={md.p} {...p} />,
          ul: (p) => <ul style={md.ul} {...p} />,
          ol: (p) => <ol style={md.ol} {...p} />,
          li: (p) => <li style={md.li} {...p} />,
          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code style={md.inlineCode} {...props}>
                  {children}
                </code>
              );
            }
            const text = String(children ?? '').replace(/\n$/, '');
            return <CodeBlock text={text} />;
          },
          blockquote: (p) => <blockquote style={md.blockquote} {...p} />,
          a: (p) => <a style={md.a} target="_blank" rel="noreferrer" {...p} />,
          hr: (p) => <hr style={md.hr} {...p} />,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <div style={md.codeBlockWrap}>
      <div style={md.codeTopBar}>
        <span style={md.codeLabel}>code</span>
        <button onClick={onCopy} style={md.codeCopyBtn} type="button">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre style={md.pre}>
        <code style={md.code}>{text}</code>
      </pre>
    </div>
  );
}

const md: Record<string, React.CSSProperties> = {
  wrap: { width: '100%', lineHeight: 1.75, fontSize: 14, color: '#0f172a' },
  h1: { fontSize: 22, fontWeight: 900, margin: '10px 0 10px' },
  h2: { fontSize: 18, fontWeight: 900, margin: '14px 0 10px' },
  h3: { fontSize: 16, fontWeight: 900, margin: '12px 0 8px' },
  p: { margin: '8px 0' },
  ul: { paddingLeft: 18, margin: '8px 0' },
  ol: { paddingLeft: 18, margin: '8px 0' },
  li: { margin: '4px 0' },
  inlineCode: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    background: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: 8,
    fontSize: 13,
  },
  codeBlockWrap: { margin: '10px 0' },
  codeTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0b1220',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: '8px 10px',
  },
  codeLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 800, letterSpacing: 0.3 },
  codeCopyBtn: {
    border: '1px solid rgba(148,163,184,0.3)',
    background: 'transparent',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 800,
  },
  pre: {
    background: '#0b1220',
    padding: 12,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflowX: 'auto',
    margin: 0,
  },
  code: {
    color: '#e2e8f0',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
  },
  blockquote: {
    borderLeft: '4px solid #cbd5e1',
    margin: '10px 0',
    paddingLeft: 10,
    color: '#334155',
  },
  a: { color: '#16a34a', textDecoration: 'underline' },
  hr: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '14px 0' },
};
