# KaTeX Math Implementation Issues

## Current Problems

### 1. Block Math (`$$`)
- **Issue**: Shows only rendered output, no source editing UI
- **Expected (MarkText)**: Shows `$$` marker on top line, editable source code area, then rendered preview below
- **Screenshot shows**: MarkText has a clear input box with the LaTeX source visible and editable

### 2. Inline Math (`$`)
- **Issue**: Auto-pairing `$` works but conversion to math node is unreliable
- **Issue**: UI is not smooth - the preview rendering feels janky
- **Expected (MarkText)**: Smooth inline display with `$source$` followed by rendered preview

---

## MarkText Reference Files to Study

### Block Math (Display Math)
- `marktext_reference/src/muya/lib/contentState/mathCtrl.js` - Math block creation/handling
- `marktext_reference/src/muya/lib/parser/render/renderBlock/renderLeafBlock.js` - How math blocks render
- `marktext_reference/src/muya/lib/ui/mathRender/` - Math rendering UI components

### Inline Math
- `marktext_reference/src/muya/lib/contentState/inputCtrl.js` - Contains `BRACKET_HASH` for auto-pairing (`$: '$'`)
- `marktext_reference/src/muya/lib/parser/render/renderInlines/` - Inline rendering logic
- `marktext_reference/src/muya/lib/inlineRenderer/renderer.js` - Inline math rendering

### Key Pattern from MarkText
```javascript
// From inputCtrl.js - bracket auto-pairing
const BRACKET_HASH = {
  '{': '}', '[': ']', '(': ')', '*': '*',
  _: '_', '"': '"', "'": "'", $: '$', '~': '~'
}
```

---

## What Needs Fixing

### Block Math Fix
1. Show `$$` marker at top (non-editable)
2. Show editable `<textarea>` or contenteditable area for LaTeX source
3. Show rendered KaTeX preview below the source
4. Handle focus/blur states for editing

### Inline Math Fix
1. Fix the inputRule to reliably convert `$content$` → inlineMath node
2. Make the node editable inline (click to edit source)
3. Smooth UI transition between editing and preview states
4. Proper cursor positioning after node creation

---

## Files to Modify in Typora Clone

- `src/components/MathComponent.tsx` - Block math display
- `src/components/InlineMathComponent.tsx` - Inline math display
- `src/components/extensions/MathExtension.ts` - Block math node definition
- `src/components/extensions/InlineMathExtension.ts` - Inline math node definition
- `src/components/Editor.tsx` - Keyboard handling for `$` auto-pair
