import { findChildren } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import Prism from 'prismjs';

// Pre-load commonly used languages
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-hcl';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scala';

// Track loaded languages to avoid re-importing
const loadedLanguages = new Set<string>([
  'markup', 'css', 'clike', 'javascript', 'bash', 'python', 'typescript',
  'json', 'yaml', 'sql', 'go', 'rust', 'java', 'c', 'cpp', 'hcl', 'docker',
  'jsx', 'tsx', 'markdown', 'ruby', 'swift', 'kotlin', 'scala'
]);

// Queue for pending language loads to avoid duplicate imports
const loadingPromises = new Map<string, Promise<void>>();

// Alias mappings for common language names
const languageAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'tsx': 'tsx',
  'jsx': 'jsx',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'shell': 'bash',
  'zsh': 'bash',
  'yml': 'yaml',
  'dockerfile': 'docker',
  'md': 'markdown',
  'html': 'markup',
  'xml': 'markup',
  'svg': 'markup',
  'c++': 'cpp',
  'c#': 'csharp',
  'cs': 'csharp',
  'objective-c': 'objectivec',
  'objc': 'objectivec',
  'tex': 'latex',
  'postgres': 'sql',
  'postgresql': 'sql',
  'mysql': 'sql',
  'plaintext': 'plain',
  'text': 'plain',
  'txt': 'plain',
  'terraform': 'hcl',
  'tf': 'hcl',
  'golang': 'go',
  'rs': 'rust',
  'kt': 'kotlin',
  'swift': 'swift',
  'scala': 'scala',
  'hs': 'haskell',
  'lua': 'lua',
  'r': 'r',
  'ps1': 'powershell',
  'pwsh': 'powershell',
};

// Language dependencies - some languages require others to be loaded first
const languageDependencies: Record<string, string[]> = {
  'typescript': ['javascript'],
  'tsx': ['typescript', 'jsx'],
  'jsx': ['javascript'],
  'cpp': ['c'],
  'csharp': ['clike'],
  'java': ['clike'],
  'kotlin': ['clike'],
  'scala': ['java'],
  'php': ['markup', 'clike'],
  'markdown': ['markup'],
  'scss': ['css'],
  'sass': ['css'],
  'less': ['css'],
  'stylus': ['css'],
  'pug': ['markup', 'javascript'],
  'haml': ['ruby'],
  'objectivec': ['c'],
  'swift': ['clike'],
  'go': ['clike'],
  'rust': ['clike'],
};

function resolveLanguage(lang: string | null): string {
  if (!lang) return 'javascript';
  const lower = lang.toLowerCase().trim();
  return languageAliases[lower] || lower;
}

// Dynamically load a language and its dependencies
async function loadLanguage(lang: string): Promise<void> {
  const resolved = resolveLanguage(lang);

  // Skip if already loaded or is 'plain'
  if (resolved === 'plain' || loadedLanguages.has(resolved)) {
    return;
  }

  // Return existing promise if already loading
  if (loadingPromises.has(resolved)) {
    return loadingPromises.get(resolved);
  }

  // Create loading promise
  const loadPromise = (async () => {
    try {
      // Load dependencies first
      const deps = languageDependencies[resolved] || [];
      for (const dep of deps) {
        if (!loadedLanguages.has(dep)) {
          await loadLanguage(dep);
        }
      }

      // Dynamically import the language
      await import(/* @vite-ignore */ `prismjs/components/prism-${resolved}.js`);
      loadedLanguages.add(resolved);
    } catch (err) {
      // Language not found, silently fail - will fall back to no highlighting
      console.warn(`Prism language "${resolved}" not found`);
    } finally {
      loadingPromises.delete(resolved);
    }
  })();

  loadingPromises.set(resolved, loadPromise);
  return loadPromise;
}

function getLanguageGrammar(language: string): Prism.Grammar | null {
  const resolved = resolveLanguage(language);
  if (resolved === 'plain') return null;
  return Prism.languages[resolved] || null;
}

interface HighlightNode {
  text: string;
  classes: string[];
}

function parseTokens(tokens: (string | Prism.Token)[], className: string[] = []): HighlightNode[] {
  const result: HighlightNode[] = [];

  for (const token of tokens) {
    if (typeof token === 'string') {
      result.push({ text: token, classes: className });
    } else {
      const tokenClasses = [...className, `token`, token.type];
      if (token.alias) {
        if (Array.isArray(token.alias)) {
          tokenClasses.push(...token.alias);
        } else {
          tokenClasses.push(token.alias);
        }
      }

      if (Array.isArray(token.content)) {
        result.push(...parseTokens(token.content, tokenClasses));
      } else if (typeof token.content === 'string') {
        result.push({ text: token.content, classes: tokenClasses });
      } else {
        result.push(...parseTokens([token.content], tokenClasses));
      }
    }
  }

  return result;
}

function getDecorations({ doc, name }: { doc: any; name: string }) {
  const decorations: Decoration[] = [];

  findChildren(doc, (node) => node.type.name === name).forEach((block) => {
    let from = block.pos + 1;
    const language = block.node.attrs.language;
    const grammar = getLanguageGrammar(language);

    if (!grammar) {
      // No grammar available - try to load it for next render
      const resolved = resolveLanguage(language);
      if (resolved !== 'plain' && !loadedLanguages.has(resolved)) {
        loadLanguage(language); // Fire and forget - will highlight on next edit
      }
      return;
    }

    const code = block.node.textContent;

    try {
      const tokens = Prism.tokenize(code, grammar);
      const nodes = parseTokens(tokens);

      for (const node of nodes) {
        const to = from + node.text.length;

        if (node.classes.length > 0) {
          const decoration = Decoration.inline(from, to, {
            class: node.classes.join(' '),
          });
          decorations.push(decoration);
        }

        from = to;
      }
    } catch (err) {
      console.warn(`Prism highlighting failed for language: ${language}`, err);
    }
  });

  return DecorationSet.create(doc, decorations);
}

export function PrismPlugin({ name }: { name: string }) {
  const pluginKey = new PluginKey('prism');

  return new Plugin({
    key: pluginKey,
    state: {
      init: (_, { doc }) => getDecorations({ doc, name }),
      apply: (transaction, decorationSet, oldState, newState) => {
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;
        const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
        const newNodes = findChildren(newState.doc, (node) => node.type.name === name);

        if (
          transaction.docChanged &&
          ([oldNodeName, newNodeName].includes(name) ||
            newNodes.length !== oldNodes.length ||
            transaction.steps.some((step: any) => {
              return (
                step.from !== undefined &&
                step.to !== undefined &&
                oldNodes.some((node) => {
                  return node.pos >= step.from && node.pos + node.node.nodeSize <= step.to;
                })
              );
            }))
        ) {
          return getDecorations({ doc: transaction.doc, name });
        }

        return decorationSet.map(transaction.mapping, transaction.doc);
      },
    },
    props: {
      decorations(state) {
        return pluginKey.getState(state);
      },
    },
  });
}

export default PrismPlugin;
