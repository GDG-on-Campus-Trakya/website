"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const MarkdownRenderer = ({ content, className = "" }) => {
  const components = {
    h1: ({ node, ...props }) => (
      <h1 className="font-display text-3xl font-bold mt-6 mb-4 text-ink" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="font-display text-2xl font-bold mt-5 mb-3 text-ink" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="font-display text-xl font-semibold mt-4 mb-2 text-ink" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="font-display text-lg font-semibold mt-3 mb-2 text-ink" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="font-semibold mt-2 mb-1 text-ink" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="font-semibold text-sm text-ink-2" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="text-ink mb-4 leading-relaxed" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
      />
    ),
    code: ({ node, inline, ...props }) => {
      if (inline) {
        return (
          <code
            className="bg-paper-2 border border-rule text-ink px-1.5 py-0.5 rounded-sm font-outlier text-sm"
            {...props}
          />
        );
      }
      return <code {...props} />;
    },
    pre: ({ node, ...props }) => (
      <pre className="bg-paper-2 border border-rule rounded p-4 overflow-x-auto mb-4 font-outlier text-sm text-ink" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside text-ink mb-4 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside text-ink mb-4 space-y-1" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="text-ink" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-2 border-ink pl-4 py-1 my-4 text-ink-2 italic" {...props} />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-6 border-rule" {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-rule" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-paper-2" {...props} />
    ),
    tbody: ({ node, ...props }) => (
      <tbody className="divide-y divide-rule" {...props} />
    ),
    tr: ({ node, ...props }) => (
      <tr className="divide-x divide-rule" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="text-left px-3 py-2 text-ink font-semibold" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-3 py-2 text-ink-2" {...props} />
    ),
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
