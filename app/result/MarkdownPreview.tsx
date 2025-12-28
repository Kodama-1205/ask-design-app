'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

type Props = {
  markdown: string;
};

const md = {
  root: {
    fontSize: 14,
    lineHeight: 1.75,
    color: '#111827',
    wordBreak: 'break-word' as const,
  },
  h1: {
    fontSize: 22,
    fontWeight: 800,
    margin: '18px 0 10px',
    letterSpacing: '-0.01em',
  },
  h2: {
    fontSize: 18,
    fontWeight: 800,
    margin: '16px 0 8px',
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: 16,
    fontWeight: 800,
    margin: '14px 0 6px',
  },
  p: {
    margin: '10px 0',
    color: '#111827',
  },
  ul: {
    margin: '10px 0',
    paddingLeft: 18,
  },
  ol: {
    margin: '10px 0',
    paddingLeft: 20,
  },
  li: {
    margin: '6px 0',
  },
  a: {
    color: '#16a34a',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  inlineCode: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
    padding: '2px 6px',
    borderRadius: 8,
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
  },
  pre: {
    margin: '12px 0',
    padding: 12,
    borderRadius: 16,
    background: '#0b1220',
    border: '1px solid #111827',
    overflowX: 'auto' as const,
  },
  code: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
    color: '#e5e7eb',
    whiteSpace: 'pre' as const,
  },
  blockquote: {
    margin: '12px 0',
    padding: '8px 12px',
    borderLeft: '4px solid #a7f3d0',
    background: '#ecfdf5',
    borderRadius: 12,
    color: '#064e3b',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '14px 0',
  },
};

export default function MarkdownPreview({ markdown }: Props) {
  const value = markdown ?? '';

  return (
    <div style={md.root}>
      <ReactMarkdown
        components={{
          h1: (p) => <h1 style={md.h1} {...p} />,
          h2: (p) => <h2 style={md.h2} {...p} />,
          h3: (p) => <h3 style={md.h3} {...p} />,
          p: (p) => <p style={md.p} {...p} />,
          ul: (p) => <ul style={md.ul} {...p} />,
          ol: (p) => <ol style={md.ol} {...p} />,
          li: (p) => <li style={md.li} {...p} />,
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noreferrer" style={md.a} {...props}>
              {children}
            </a>
          ),
          blockquote: (p) => <blockquote style={md.blockquote} {...p} />,
          hr: (p) => <hr style={md.hr} {...p} />,

          // ✅ ここが今回の修正点（inline を使わない）
          code: ({ className, children, ...props }) => {
            const raw = String(children ?? '');
            const text = raw.replace(/\n$/, '');
            const isBlock = /\n/.test(raw) || (className?.includes('language-') ?? false);

            if (!isBlock) {
              return (
                <code style={md.inlineCode} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <pre style={md.pre}>
                <code className={className} style={md.code} {...props}>
                  {text}
                </code>
              </pre>
            );
          },
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
