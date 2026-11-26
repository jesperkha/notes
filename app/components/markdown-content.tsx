import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  a({ href, title, children }) {
    return (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

export function MarkdownContent({
  source,
  className = "markdown-content",
}: {
  source: string;
  className?: string;
}) {
  return (
    <article className={className}>
      {source ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {source}
        </ReactMarkdown>
      ) : (
        <p className="empty-content">Nothing here yet.</p>
      )}
    </article>
  );
}
