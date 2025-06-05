import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export default function MarkdownRenderer({
  content,
  className = ''
}: MarkdownRendererProps) {
  const components = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <code className={className} {...props}>
          {children}
        </code>
      ) : (
        <code className="bg-gray-100 px-1 rounded" {...props}>
          {children}
        </code>
      );
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            {children}
          </table>
        </div>
      );
    }
  }), []);

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const MemoizedMarkdown = memo(MarkdownRenderer,(prevProps,nextProps)=>{
    return prevProps.content === nextProps.content 
    && prevProps.className === nextProps.className;
})