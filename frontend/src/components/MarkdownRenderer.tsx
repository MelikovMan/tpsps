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
    video({ src, ...props }: any) {
      let videoUrl = src;
    
      // Handle media bucket video URLs
    
      return (
        <video
          controls
          src={videoUrl}
          style={{
            maxWidth: '100%',
            borderRadius: '4px',
            margin: '10px 0',
            maxHeight: '400px'
          }}
          {...props}
        >
          Ваш браузер не поддерживает видео тег.
        </video>
      );
  },
  
  // Add audio element support
  audio({ src, ...props }: any) {
    let audioUrl = src;
    
    // Handle media bucket audio U
    
    return (
      <audio
        controls
        src={audioUrl}
        style={{
          width: '100%',
          maxWidth: '400px',
          margin: '10px 0'
        }}
        {...props}
      >
        Ваш браузер не поддерживает аудио тег.
      </audio>
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