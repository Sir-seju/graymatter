import { InputRule, Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import InlineMathComponent from '../InlineMathComponent';

export const InlineMathExtension = Node.create({
  name: 'inlineMath',

  group: 'inline',

  inline: true,

  draggable: true,

  content: 'text*',

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => {
          const raw = element.getAttribute('data-katex');
          if (!raw) return '';
          try {
            return decodeURIComponent(escape(window.atob(raw)));
          } catch {
            return raw;
          }
        },
        renderHTML: (attributes) => {
          let encoded = '';
          try {
            encoded = window.btoa(unescape(encodeURIComponent(attributes.latex || '')));
          } catch (e) { }
          return {
            'data-katex': encoded,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-katex]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathComponent);
  },

  addInputRules() {
    return [
      new InputRule({
        // Matches $content$ where content doesn't start with space
        find: /\$(.+?)\$/,
        handler: ({ state, range, match }) => {
          const content = match[1];
          const start = range.from;
          const end = range.to;

          // Insert the inline math node
          state.tr.replaceWith(start, end, this.type.create({}, state.schema.text(content)));
        },
      }),
    ];
  },
});
