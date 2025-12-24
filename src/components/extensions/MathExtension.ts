import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import MathComponent from '../MathComponent';

export const MathExtension = Node.create({
  name: 'math',

  group: 'block',

  // Atom nodes don't have content, they are a single unit.
  // This prevents Tiptap from trying to manage the text cursor inside, 
  // allowing our Textarea to have full control.
  atom: true,

  draggable: true,

  code: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => {
          const raw = element.getAttribute('data-katex');
          if (!raw) return '';
          try {
            // Decode Base64 -> UTF-8 String
            return decodeURIComponent(escape(window.atob(raw)));
          } catch (e) {
            console.error("Math decode error", e);
            return raw; // Fallback? But raw is base64... probably garbage.
          }
        },
        renderHTML: (attributes) => {
          let encoded = '';
          try {
            // Encode UTF-8 String -> Base64
            encoded = window.btoa(unescape(encodeURIComponent(attributes.latex || '')));
          } catch (e) {
            console.error("Math encode error", e);
          }
          return {
            'data-katex': encoded,
          };
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-katex]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /^\$\$\s$/,
        type: this.type,
      }),
    ]
  },
});

