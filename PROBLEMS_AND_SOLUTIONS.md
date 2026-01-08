# Issue Log: Problems & Solutions

**Generated**: January 7, 2026
**Purpose**: This document tracks the specific UI/UX issues reported by the user and the engineering solutions implemented to resolve them.

---

## 🎨 Visual Styling & Theming

### 1. "Blockquotes look wrong / Missing Green Border"
- **User Complaint**: "The blockquotes don't match the screenshot. They are missing the green border and the background box."
- **Root Cause**: The Night theme definition was missing the `--blockquote-border-color` variable, defaulting it to a generic gray.
- **Solution**:
  - Added `--blockquote-border-color` to `themeDefinitions.ts`.
  - Set the value to **Lime Green (`#abf374`)** specifically for the Night theme.
  - Enforced a translucent black background (`rgba(0,0,0,0.3)`) in `index.css` with `!important` to ensure visibility.

### 2. "Bold text is invisible / dim"
- **User Complaint**: "Bold text is not recognized, dim, and difficult to read in the Night theme."
- **Root Cause**: Default syntax highlighting colors were overriding the bold styling, and the theme contrast was too low.
- **Solution**:
  - Enforced `color: #ffffff !important` for `strong` tags in `index.css`.
  - Brightened the global Night theme text color from `#b8bfc6` to `#f3f4f5` for higher contrast.

### 3. "Source Mode is unreadable"
- **User Complaint**: "Source mode (Ctrl+Shift+U) is blurry, dim, and unreadable."
- **Root Cause**: The raw text editor was using hardcoded Tailwind utility classes (`text-gray-800 dark:text-gray-200`) which didn't match the active theme's variables.
- **Solution**:
  - Updated `Editor.tsx` to use the CSS variable `color: var(--text-color)`.
  - This ensures Source Mode acts as a "transparent" layer inheriting the exact high-contrast theme colors.

### 4. "Sidebar Font Size Inconsistency"
- **User Complaint**: "File names are bigger than folder names."
- **Root Cause**: Files were styled with `text-sm` (14px) while folders were using `text-xs` (12px) in `Sidebar.tsx`.
- **Solution**:
  - Standardized all sidebar items (files and folders) to `text-sm` (14px) for a consistent, readable look.

---

## 📐 Layout & Responsiveness

### 5. "Traffic Lights covering text (OTES)"
- **User Complaint**: "The 'FILES' header text is cut off by the traffic lights."
- **Root Cause**: The Files and Outline headers lacked sufficient left padding (`pl-3`), causing overlap with the macOS window controls.
- **Solution**:
  - Increased padding to `pl-8` for both Files and Outline tab headers in `Sidebar.tsx`.
  - Increased top padding (`pt-10`) for the Icon rail to clear the traffic lights area completely.

### 6. "Editor looks squished / Bad Resizing"
- **User Complaint**: "The layout resizes unintuitively and squishes the text."
- **Root Cause**: The editor container had a rigid `max-width: min(75%)` rule and excessive static padding (80px).
- **Solution**:
  - Removed the `min(75%)` constraint allowing the editor to breathe.
  - Implemented **Media Queries** in `index.css` (`@media (max-width: 800px)`) to automatically reduce horizontal padding from 60px to 30px on smaller windows.

---

## ⌨️ Editor Behavior

### 7. "Multi-line Bold/Text Folding"
- **User Complaint**: "Multi-line comments are folding into one line; bold doesn't work across lines."
- **Root Cause**: The Markdown parser was configured with `breaks: false` (default), causing single line breaks to be ignored (standard markdown behavior, but unexpected for note-taking).
- **Solution**:
  - Enabled `breaks: true` in `Editor.tsx` configuration. This treats newlines as hard breaks (`<br>`), preserving the visual structure of notes and allowing formatting to span lines.
