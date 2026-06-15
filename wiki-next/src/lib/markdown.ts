// lib/markdown.ts
import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';
import { marked } from 'marked';

// Настройка Turndown (HTML → Markdown)
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});
turndownService.use(gfm);

// Правило для кастомных шаблонов ({{template}})
turndownService.addRule('template', {
  filter: (node) => node.getAttribute('data-template') !== null,
  replacement: (node) => {
    const el = node as HTMLElement;
    const name = el.getAttribute('data-name') || '';
    const paramsJson = el.getAttribute('data-params') || '{}';
    const params = JSON.parse(paramsJson);
    const paramStr = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
    return `{{${name}${paramStr ? '|' + paramStr : ''}}}`;
  },
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

// Настройка marked (Markdown → HTML)
marked.setOptions({
  breaks: true,
  gfm: true,
});

export async function markdownToHtml(markdown: string): Promise<string> {
  return marked.parse(markdown);
}