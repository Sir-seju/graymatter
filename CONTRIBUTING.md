# Contributing to GrayMatter

First off, thanks for considering contributing! Every bit helps.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **System info**: macOS version, chip (Intel/Apple Silicon)

### Suggesting Features

Feature requests are welcome! Open an issue with:

- **Clear use case** — why do you need this?
- **Proposed solution** — how do you envision it working?
- **Alternatives considered** — any other ways to solve this?

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Test your changes (`npm run dev`)
4. Update documentation if needed
5. Submit a PR with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/graymatter.git
cd graymatter

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Code Style

- We use TypeScript — embrace the types
- Functional components with hooks
- Tailwind for styling (keep it utility-first)
- Meaningful commit messages

## Project Structure

```
src/
├── components/     # React components
├── App.tsx        # Main app
└── index.css      # Styles + themes

electron/
├── main.ts        # Main process
└── preload.ts     # Preload scripts
```

## Questions?

Open an issue or reach out. Happy coding!
