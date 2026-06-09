# SMARTSHEETS

A next-generation Personal Spreadsheet + Document + Knowledge Vault platform — designed for individual users who need a private, secure workspace to store, edit, organize, protect, and manage information.

> Inspired by Google Sheets, Google Docs, Notion, and Obsidian — with unique features like Smart Cell Lock System, Instant Copy, and Knowledge Vault.

## Features

### Workspace Types
- **Spreadsheet Workspace** — Full-featured grid with formulas, cell styles, locking, checkboxes, and multiple sheets
- **Document Workspace** — Rich block-based editor with headings, lists, checklists, code blocks, quotes, and slash commands
- **Hybrid Workspace** — Modular pages combining spreadsheet blocks, document blocks, code blocks, checklists, prompts, and reference links

### Flagship Features
- **Smart Cell Lock System** — 4 lock levels: Soft (1-click unlock), Protected (confirmation), Vault (password), Permanent (recovery only)
- **Instant Copy System** — Hover-to-copy on any cell with format options (plain text, formula, markdown, JSON, CSV)
- **Knowledge Vault** — Everything is searchable, recoverable, and version-tracked
- **Recovery Center** — Deleted files and folders go to Recovery Vault for safe restoration

### Theming
- Dark Mode (default hacker-terminal aesthetic)
- Light Mode (paper-like high-contrast)
- Persisted in localStorage

### Additional Features
- Nested folder organization with pinning, favorites, archiving, and locking
- Tag system with filtering
- Global fuzzy search with typo tolerance (Levenshtein)
- Activity audit trail
- Copy history registry
- Command palette (Ctrl+K / Ctrl+/)
- Formula engine (SUM, AVERAGE, COUNT, MAX, MIN, CONCAT, UPPER, LOWER, LEN)
- Cross-sheet references
- Circular dependency detection
- localStorage persistence with JSON backup export

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| State | React hooks + localStorage |
| Server | Express (optional, for serving) |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run lint
```

## Project Structure

```
src/
├── App.tsx                    # Main app with routing, theme, state management
├── index.css                  # Global styles, dark/light theme overrides
├── main.tsx                   # React entry point
├── types.ts                   # TypeScript interfaces and enums
├── components/
│   ├── Header.tsx             # Top toolbar with search, theme toggle, unlock mode
│   ├── Sidebar.tsx            # Folder/file explorer, tags, shortcuts
│   ├── Dashboard.tsx          # Analytics dashboard with lock stats, activity logs
│   ├── RecoveryVault.tsx      # Trash/recovery center
│   ├── SpreadsheetWorkspace.tsx  # Spreadsheet grid editor
│   ├── DocumentWorkspace.tsx  # Block-based document editor
│   ├── HybridWorkspace.tsx    # Hybrid modular page builder
│   └── CommandPalette.tsx     # Command palette overlay
└── utils/
    ├── formulas.ts            # Formula parser and evaluator
    └── search.ts              # Fuzzy search engine
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove build artifacts |

## License

Apache-2.0
