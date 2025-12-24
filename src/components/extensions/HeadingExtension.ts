import Heading from '@tiptap/extension-heading';
import { ReactNodeViewRenderer } from '@tiptap/react';
import HeadingComponent from '../HeadingComponent';

export const HeadingExtension = Heading.extend({
  addNodeView() {
    return ReactNodeViewRenderer(HeadingComponent);
  },
});
