import Link from 'next/link';
import React, { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
import { processSourceReferences } from './source-reference';
import { cn } from '@/lib/utils';

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-6 my-4 space-y-2" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-0.5 pl-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-disc list-outside ml-6 my-4 space-y-2" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  p: ({ node, children, ...props }) => {
    // Check if children contains source references
    const childrenArray = React.Children.toArray(children);
    const hasSourceReference = childrenArray.some(
      child => typeof child === 'string' && child.includes('[Source')
    );

    if (hasSourceReference) {
      // Process the paragraph text to replace source references with components
      const processedChildren = childrenArray.map((child, index) => {
        if (typeof child === 'string' && child.includes('[Source')) {
          return <React.Fragment key={index}>{processSourceReferences(child)}</React.Fragment>;
        }
        return child;
      });

      return (
        <p {...props}>
          {processedChildren}
        </p>
      );
    }

    return <p {...props}>{children}</p>;
  },
};

const remarkPlugins = [remarkGfm];

// Update interface to support multiple ways to pass markdown content
interface MarkdownProps {
  children?: string;
  content?: string;
  className?: string;
  // Explicitly omit props we don't need to avoid hydration issues
  [key: string]: any;
}

const NonMemoizedMarkdown = ({
  children,
  content,
  className,
  ...props // Capture other props but don't use them
}: MarkdownProps) => {
  // Use either content or children, prioritizing children
  const markdownText = children || content || '';

  // Pre-process the markdown to handle source references
  const processedMarkdown = useMemo(() => {
    if (!markdownText) return '';

    // Check if the markdown contains source references
    if (markdownText.includes('[Source')) {
      // We'll let the paragraph component handle it
      return markdownText;
    }

    return markdownText;
  }, [markdownText]);

  return (
    <div className={cn("w-full", className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {processedMarkdown}
      </ReactMarkdown>
    </div>
  );
};

// Update memo comparison to check for either children or content
export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => {
    const prevText = prevProps.children || prevProps.content || '';
    const nextText = nextProps.children || nextProps.content || '';
    return prevText === nextText && prevProps.className === nextProps.className;
  }
);
