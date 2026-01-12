import { Extension } from '@tiptap/core';

/**
 * Tab Extension for TipTap
 *
 * Inserts an actual tab character (\t) that:
 * 1. Shows as indentation in preview mode (via CSS white-space: pre-wrap + tab-size)
 * 2. Persists in the markdown source as a tab character
 * 3. Can be deleted with backspace or Shift+Tab
 */

const TAB_CHAR = '\t';

export const TabExtension = Extension.create({
  name: 'tabExtension',

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;

        // Check if we're in a list item
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'listItem' || node.type.name === 'taskItem') {
            return false; // Let list handle Tab
          }
        }

        // Check if we're in a code block - insert 4 spaces there
        if ($from.parent.type.name === 'codeBlock' || $from.parent.type.spec.code) {
          view.dispatch(state.tr.insertText('    '));
          return true;
        }

        // Insert actual tab character using transaction
        view.dispatch(state.tr.insertText(TAB_CHAR));
        return true;
      },

      'Shift-Tab': ({ editor }) => {
        const { state, view } = editor;
        const { $from, empty } = state.selection;

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'listItem' || node.type.name === 'taskItem') {
            return false;
          }
        }

        if (empty) {
          const pos = $from.pos;
          const start = $from.start();
          const textBefore = state.doc.textBetween(start, pos, '\0', '\0');

          if (textBefore.endsWith(TAB_CHAR)) {
            view.dispatch(state.tr.delete(pos - 1, pos));
            return true;
          }
        }

        return true;
      },

      Backspace: ({ editor }) => {
        const { state, view } = editor;
        const { $from, empty } = state.selection;

        if (empty) {
          const pos = $from.pos;
          const start = $from.start();
          const textBefore = state.doc.textBetween(start, pos, '\0', '\0');

          // Delete tab character
          if (textBefore.endsWith(TAB_CHAR)) {
            view.dispatch(state.tr.delete(pos - 1, pos));
            return true;
          }
        }

        return false;
      },
    };
  },
});
