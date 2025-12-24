
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      clearSearch: () => ReturnType;
      findNext: () => ReturnType;
      findPrev: () => ReturnType;
    };
  }
}

export interface SearchOptions {
  decorationClass: string;
}

export const searchPluginKey = new PluginKey('search');

export const Search = Extension.create<SearchOptions>({
  name: 'search',

  addOptions() {
    return {
      decorationClass: 'bg-yellow-200 text-black',
    };
  },

  addCommands() {
    return {
      setSearchTerm: (searchTerm: string) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta('searchTerm', searchTerm);
        }
        return true;
      },
      clearSearch: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta('searchTerm', '');
        }
        return true;
      },
      findNext: () => ({ state, dispatch, view }) => {
        const pluginState = searchPluginKey.getState(state);
        const decorations = pluginState?.decorations;
        if (!decorations) return false;

        const results = decorations.find();
        if (results.length === 0) return false;

        const { selection } = state;
        // Find first result after current selection end
        let next = results.find((d: any) => d.from >= selection.to);
        // Wrap around
        if (!next) {
          next = results[0];
        }

        if (next && dispatch) {
          const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(next.from), 1));
          tr.scrollIntoView();
          view.focus();
          dispatch(tr);
          return true;
        }
        return false;
      },
      findPrev: () => ({ state, dispatch, view }) => {
        const pluginState = searchPluginKey.getState(state);
        const decorations = pluginState?.decorations;
        if (!decorations) return false;

        const results = decorations.find();
        if (results.length === 0) return false;

        const { selection } = state;
        // Find last result before current selection start
        // Iterate backwards
        let prev = null;
        for (let i = results.length - 1; i >= 0; i--) {
          if (results[i].to <= selection.from) {
            prev = results[i];
            break;
          }
        }
        // Wrap around
        if (!prev) {
          prev = results[results.length - 1];
        }

        if (prev && dispatch) {
          const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(prev.from), 1));
          tr.scrollIntoView();
          view.focus();
          dispatch(tr);
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const { decorationClass } = this.options;

    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init() {
            return { term: '', decorations: DecorationSet.empty };
          },
          apply(tr, oldState) {
            const metaTerm = tr.getMeta('searchTerm');
            const currentTerm = metaTerm !== undefined ? metaTerm : oldState.term;

            if (currentTerm !== oldState.term || tr.docChanged) {
              const decorations = currentTerm
                ? findSearchTerm(tr.doc, currentTerm, decorationClass)
                : DecorationSet.empty;

              return { term: currentTerm, decorations };
            }

            return {
              term: oldState.term,
              decorations: oldState.decorations.map(tr.mapping, tr.doc),
            };
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations || DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

function findSearchTerm(doc: any, term: string, className: string): DecorationSet {
  if (!term) return DecorationSet.empty;

  const decorations: Decoration[] = [];
  try {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); // Escape regex

    doc.descendants((node: any, pos: number) => {
      if (node.isText) {
        const text = node.text;
        if (!text) return;

        let match;
        while ((match = regex.exec(text)) !== null) {
          const from = pos + match.index;
          const to = from + match[0].length;
          decorations.push(Decoration.inline(from, to, { class: className }));
        }
      }
    });
  } catch (e) {
    console.error('Search regex error', e);
  }

  return DecorationSet.create(doc, decorations);
}
