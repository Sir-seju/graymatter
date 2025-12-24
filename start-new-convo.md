# Project Status Summary: Typora Clone

**Current Project Location**: `/Users/josh/Downloads/typora`
*(Moved from Desktop to avoid iCloud sync issues)*

## 🚀 Recent Accomplishments
1.  **Environment Stabilization**: Successfully restored the development environment after the move. Recreated missing configuration (`package.json`, `vite.config.ts`, `tsconfig.json`) and source files (`main.tsx`, `index.css`, `vite-env.d.ts`).
2.  **Build Verification**: The project now compiles successfully (`npm run build`).
3.  **Preferences Window**: Implemented `PreferencesModal.tsx` and integrated it into `App.tsx` and the native menu (Cmd+,). Ready for testing.
4.  **Sidebar Repair**: Restored and fixed `Sidebar.tsx`, ensuring proper IPC calls (`readDir`, `openFolder`).
5.  **Editor Extensions**: Restored `MathExtension.ts` (using `MathComponent.tsx` for React rendering) and fixed `SearchExtension.ts`.

## 📂 Key Files & Structure
*   **`src/App.tsx`**: Core application logic. Manages Tabs, Sidebar state, Search state, and now **Preferences** state (`theme`, `fontSize`).
*   **`src/components/Editor.tsx`**: The Tiptap editor instance. Handles Markdown parsing, lowlight syntax highlighting, image drag-and-drop, and now receives theme/font props.
*   **`src/components/PreferencesModal.tsx`**: (New) UI for changing Theme and Font Size.
*   **`src/components/Sidebar.tsx`**: File explorer component. Uses `window.electron.readDir` and `openFolder`.
*   **`electron/main.ts`**: Main Electron process. Handles file system IPC (`read-file`, `write-file`, `read-dir`, etc.) and Menu creation. Updated to fix syntax errors.
*   **`electron/preload.ts`**: Exposes IPC methods to the renderer. Updated to include `readDir` and `openFolder`.

## 📝 Current Task List (from task.md)

- [/] UI/UX Polish
    - [/] Fix Sidebar/Traffic Light overlap issue (Partially fixed, button alignment needs tweak)
    - [x] Wire Application Menu listeners
    - [x] Fix "Close Side Panel" button clickable area
    - [x] Make Source Mode readable
    - [x] Implement "New File"
    - [x] Fix Context Menu Actions
    - [x] Enable App Reload (Cmd+R)
    - [x] Fix Sidebar State Persistence
    - [x] Fix Open Folder Icon Alignment
    - [x] Optimize Night Theme Code Blocks
    - [x] Fix Save Bug
    - [x] Undo/Redo Support
    - [x] Fix Newsprint Theme Code Blocks
    - [x] Expand Source Mode Width
    - [x] Implement Drag & Drop (File Move)
    - [x] Verify Rename Functionality
    - [x] Implement Sidebar Folder Persistence
    - [x] Implement image drag & drop
- [ ] Editor Enhancements
    - [x] Add Code Syntax Highlighting & Language Selector
    - [x] Add Math (KaTeX) support
    - [x] **Editor Tabs (Multi-file Support)**
- [x] **Polish Code Block UI**
- [x] **Implement Header Renaming**
- [x] **Add Word Count Display**
- [x] **Display Block Metadata**
- [ ] **Search Functionality** (Basic backend/extension done, UI needs next/prev implementation)
- [/] **Preferences Window** (Code restored, needs verification)
- [ ] Application Features
    - [ ] Implement Find/Replace
    - [/] Add Preferences Window (Code restored, needs verification)

## ⏭️ Next Steps
1.  **Verify Preferences**: Run the app and test if changing standard/font size works via the new Modal.
2.  **Search UI**: Implement the Next/Previous buttons in `SearchBox.tsx`.
3.  **Image Drag & Drop**: Verify functionality in the restored environment.
