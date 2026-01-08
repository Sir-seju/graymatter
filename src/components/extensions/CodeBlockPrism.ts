import CodeBlock from '@tiptap/extension-code-block';
import { PrismPlugin } from './PrismPlugin';

export const CodeBlockPrism = CodeBlock.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      PrismPlugin({
        name: this.name,
      }),
    ];
  },
});

export default CodeBlockPrism;
