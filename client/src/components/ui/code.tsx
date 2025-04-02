import React from 'react';

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  content: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function Code({
  content,
  language = 'text',
  showLineNumbers = true,
  className,
  ...props
}: CodeProps) {
  // Split content into lines for line numbering
  const lines = content.split('\n');
  
  return (
    <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
      {language && (
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          {language}
        </div>
      )}
      <pre
        className={`p-4 overflow-x-auto text-sm bg-gray-50 dark:bg-gray-900 ${className || ''}`}
        {...props}
      >
        <code>
          {showLineNumbers ? (
            lines.map((line, i) => (
              <div key={i} className="table-row">
                <span className="table-cell text-right pr-4 select-none text-gray-400 dark:text-gray-600">
                  {i + 1}
                </span>
                <span className="table-cell">{line}</span>
              </div>
            ))
          ) : (
            content
          )}
        </code>
      </pre>
    </div>
  );
}