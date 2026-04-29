import { Node } from '@tiptap/core';

export interface TemplateOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    template: {
      insertTemplate: (options: { name: string; params: Record<string, string> }) => ReturnType;
    };
  }
}

export const TemplateNode = Node.create<TemplateOptions>({
  name: 'template',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      name: { default: '' },
      params: { default: '{}' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-template]' }];
  },

  renderHTML({ node }) {
    const { name, params } = node.attrs;
    const paramStr = Object.entries(JSON.parse(params))
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
    return [
      'span',
      {
        'data-template': '',
        class: 'template-marker',
        'data-name': name,
        'data-params': params,
      },
      `{{${name}${paramStr ? '|' + paramStr : ''}}}`,
    ];
  },

  addCommands() {
    return {
      insertTemplate:
        ({ name, params }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'template',
            attrs: {
              name,
              params: JSON.stringify(params),
            },
          });
        },
    };
  },
});