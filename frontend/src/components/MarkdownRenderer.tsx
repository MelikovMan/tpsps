import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Link } from 'react-router-dom';

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
    },
    img({ src, alt, title, ...props }: any) {
      // Обрабатываем относительные пути
      let imageUrl = src;
      
      // Если это путь к медиа из нашей системы
      if (src && src.startsWith('/media/')) {
        const mediaId = src.split('/')[2];
        imageUrl = `${import.meta.env.VITE_API_URL}/media/${mediaId}/url`;
      }
      
      return (
        <img 
          src={imageUrl} 
          alt={alt} 
          title={title}
          style={{ maxWidth: '100%', borderRadius: '4px', margin: '10px 0' }}
          {...props}
        />
      );
    },
    
    // Обработчик для ссылок
    a({ href, children, ...props }: any) {
      // Обработка внутренних ссылок на статьи
      if (href && href.startsWith('/articles/')) {
        return (
          <Link to={href} {...props}>
            {children}
          </Link>
        );
      }
      
      // Внешние ссылки открываем в новой вкладке
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#228be6', textDecoration: 'underline' }}
            {...props}
          >
            {children}
          </a>
        );
      }
      
      return <a href={href} {...props}>{children}</a>;
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