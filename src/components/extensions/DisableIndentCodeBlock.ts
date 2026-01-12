import { Extension } from '@tiptap/core';

// Private Use Area character that shouldn't appear in normal text
const TAB_PLACEHOLDER = '\uE000';
// Use em-space which doesn't get collapsed like regular whitespace
const TAB_VISUAL = '\u2003\u2003\u2003\u2003'; // 4 em-spaces to visualize a tab

/**
 * Disables markdown-it's indented code block rule and preserves tabs.
 * 
 * Problem: Browser DOM parsing normalizes whitespace including \t
 * Solution:
 * 1. Replace \t with placeholder before markdown-it (prevents stripping)
 * 2. In HTML, replace placeholder with visible em-spaces
 * 3. In updateDOM, wrap tabs in white-space:pre span to prevent browser collapsing
 */
export const DisableIndentCodeBlock = Extension.create({
  name: 'disableIndentCodeBlock',

  addStorage() {
    return {
      markdown: {
        parse: {
          setup(md: any) {
            // Disable the 'code' block rule that converts 4-space/tab indented lines to code blocks
            md.block.ruler.disable('code');

            // Guard: Only patch once per md instance
            if (md.__tabPreservationPatched) {
              return;
            }
            md.__tabPreservationPatched = true;

            // Wrap the render method
            const originalRender = md.render.bind(md);

            md.render = (src: string, env?: any) => {
              if (!src) return originalRender(src, env);

              // Replace tabs with placeholder before markdown-it processes
              const protectedSrc = src.replace(/\t/g, TAB_PLACEHOLDER);

              // Render with protected content
              const html = originalRender(protectedSrc, env);

              // Replace placeholder with em-spaces that won't collapse
              const result = html.replace(
                new RegExp(TAB_PLACEHOLDER, 'g'),
                `<span data-tab="true">${TAB_VISUAL}</span>`
              );

              return result;
            };
          },

          // Transform the DOM after parsing
          updateDOM(element: HTMLElement) {
            // Find all tab spans and replace with white-space:pre wrapped tabs
            const tabSpans = element.querySelectorAll('span[data-tab="true"]');

            tabSpans.forEach((span) => {
              // Use a span with white-space:pre to prevent browser tab collapsing
              const wrapper = document.createElement('span');
              wrapper.style.whiteSpace = 'pre';
              wrapper.textContent = '\t';
              span.parentNode?.replaceChild(wrapper, span);
            });
          },
        },
      },
    };
  },
});
