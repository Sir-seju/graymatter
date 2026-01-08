<p align="center">
  <img src="build/icon.png" alt="GrayMatter Logo" width="128" height="128">
</p>

<h1 align="center">GrayMatter</h1>

<p align="center">
  <strong>A beautiful, free markdown editor for people who think in text.</strong>
</p>

<p align="center">
  <a href="#the-story">Story</a> •
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## The Story

I take a lot of notes. Like, *a lot*.

Whether I'm studying for certs, documenting infrastructure, or just dumping thoughts into markdown files, I needed a solid editor. Something that felt native on macOS, rendered markdown beautifully, and had proper syntax highlighting for code blocks.

The problem? Every good markdown editor out there either:
- Costs money (Typora went paid)
- Feels clunky (looking at you, Electron apps from 2015)
- Lacks proper code syntax highlighting
- Doesn't support my beloved dark themes

So I did what any reasonable developer would do at 2 AM instead of sleeping—I built my own.

**GrayMatter** is the result. It's the markdown editor I wanted but couldn't find. Free, fast, and focused on what matters: writing.

---

## Features

- **Live Preview** — What you see is what you get. No split panes, no mental context switching.
- **Beautiful Themes** — Ships with Everforest, Dracula, Nord, and more. Because your eyes deserve nice things.
- **Syntax Highlighting** — 20+ languages pre-loaded (Go, Rust, Python, Terraform, TypeScript, etc.). Your code blocks will look *chef's kiss*.
- **File Management** — Full sidebar with folder tree, search across files, and document outline.
- **Keyboard First** — `⌘+Shift+O` to open folders, `⌘+S` to save, and all the shortcuts you'd expect.
- **Math Support** — KaTeX for when you need to drop some $\LaTeX$ equations.
- **Native Feel** — Proper macOS vibes with traffic lights, transparency, and smooth animations.
- **Drag & Drop** — Reorganize your files right in the sidebar.
- **Focus Mode** — Toggle the sidebar and just write.

---

## Screenshots

*Coming soon — the app is prettier than my ability to take screenshots at this hour.*

---

## Installation

### macOS (Apple Silicon)

1. Download the latest `.dmg` from [Releases](../../releases)
2. Open the DMG and drag GrayMatter to Applications
3. Launch and start writing

### Build from Source

```bash
# Clone the repo
git clone https://github.com/yourusername/graymatter.git
cd graymatter

# Install dependencies
npm install

# Run in development
npm run dev

# Build for macOS
npm run build:mac
```

---

## Development

```bash
# Start development server with hot reload
npm run dev

# Build production app
npm run build:mac

# The built app will be in ./release/
```

### Project Structure

```
graymatter/
├── src/
│   ├── components/     # React components
│   │   ├── Editor.tsx      # Main editor with Tiptap
│   │   ├── Sidebar.tsx     # File tree, search, outline
│   │   └── extensions/     # Custom Tiptap extensions
│   ├── App.tsx         # Main app component
│   └── index.css       # Styles and themes
├── electron/
│   ├── main.ts         # Electron main process
│   └── preload.ts      # Preload scripts
├── build/              # App icons
└── public/             # Static assets
```

---

## Tech Stack

- **[Electron](https://www.electronjs.org/)** — Cross-platform desktop app framework
- **[React](https://react.dev/)** — UI components
- **[Tiptap](https://tiptap.dev/)** — Headless rich text editor (it's amazing)
- **[PrismJS](https://prismjs.com/)** — Syntax highlighting that actually works
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling
- **[KaTeX](https://katex.org/)** — Fast math rendering
- **[Vite](https://vitejs.dev/)** — Build tooling that doesn't make you wait

---

## Themes

GrayMatter comes with carefully crafted themes:

| Theme | Vibe |
|-------|------|
| **Everforest** | Soft green, easy on the eyes, perfect for late nights |
| **Dracula** | The classic purple-pink dark theme |
| **Nord** | Cool, arctic blues |
| **GitHub Dark** | What you'd expect |
| **Solarized** | For the OGs |

---

## Roadmap

- [ ] Windows & Linux builds
- [ ] Vim mode (because muscle memory)
- [ ] Export to PDF
- [ ] iCloud sync
- [ ] Plugin system
- [ ] Custom themes

---

## Contributing

Found a bug? Want a feature? PRs welcome.

1. Fork it
2. Create your branch (`git checkout -b feature/cool-thing`)
3. Commit (`git commit -m 'Add cool thing'`)
4. Push (`git push origin feature/cool-thing`)
5. Open a PR

---

## License

MIT — do whatever you want with it.

---

<p align="center">
  Built with sleep deprivation and good vibes by <a href="https://github.com/yourusername">Uwasan Maku</a>
</p>

<p align="center">
  <sub>If this helped you, star the repo. It makes me mass dopamine.</sub>
</p>
