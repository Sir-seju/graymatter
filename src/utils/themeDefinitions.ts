// Theme CSS variable definitions
// 6 curated themes: Everforest, Night, Dracula, Monokai, Solarized Dark, Solarized Light

export interface ThemeVariables {
  '--bg-color': string;
  '--text-color': string;
  '--side-bar-bg-color': string;
  '--window-border': string;
  '--active-file-bg-color': string;
  '--active-file-text-color': string;
  '--item-hover-bg-color': string;
  '--control-text-color': string;
  '--primary-color': string;
  '--code-block-bg': string;
  '--blockquote-border-color'?: string;
  '--heading-color'?: string;
}

export const themes: Record<string, ThemeVariables> = {
  everforest: {
    '--bg-color': '#2d353b',
    '--text-color': '#d3c6aa',
    '--side-bar-bg-color': '#232a2e',
    '--window-border': '#404c51',
    '--active-file-bg-color': '#3d484d',
    '--active-file-text-color': '#d3c6aa',
    '--item-hover-bg-color': '#343f44',
    '--control-text-color': '#9da9a0',
    '--primary-color': '#a7c080',
    '--code-block-bg': '#272e33',
    '--blockquote-border-color': '#a7c080',
    '--heading-color': '#d3c6aa',
  },
  night: {
    '--bg-color': '#363B40',
    '--text-color': '#f3f4f5',
    '--side-bar-bg-color': '#2E3033',
    '--window-border': '#4a4f54',
    '--active-file-bg-color': '#222222',
    '--active-file-text-color': '#ffffff',
    '--item-hover-bg-color': '#484e55',
    '--control-text-color': '#b7b7b7',
    '--primary-color': '#6dc1e7',
    '--code-block-bg': '#2b2e31',
    '--blockquote-border-color': '#6dc1e7',
    '--heading-color': '#ffffff',
  },
  dracula: {
    '--bg-color': '#282a36',
    '--text-color': '#f8f8f2',
    '--side-bar-bg-color': '#21222c',
    '--window-border': '#44475a',
    '--active-file-bg-color': '#44475a',
    '--active-file-text-color': '#f8f8f2',
    '--item-hover-bg-color': '#383a46',
    '--control-text-color': '#6272a4',
    '--primary-color': '#bd93f9',
    '--code-block-bg': '#1e1f29',
    '--blockquote-border-color': '#bd93f9',
    '--heading-color': '#f8f8f2',
  },
  monokai: {
    '--bg-color': '#272822',
    '--text-color': '#f8f8f2',
    '--side-bar-bg-color': '#1e1f1c',
    '--window-border': '#3e3d32',
    '--active-file-bg-color': '#3e3d32',
    '--active-file-text-color': '#f8f8f2',
    '--item-hover-bg-color': '#35342a',
    '--control-text-color': '#75715e',
    '--primary-color': '#a6e22e',
    '--code-block-bg': '#1e1f1c',
    '--blockquote-border-color': '#a6e22e',
    '--heading-color': '#f8f8f2',
  },
  solarizedDark: {
    '--bg-color': '#002b36',
    '--text-color': '#839496',
    '--side-bar-bg-color': '#073642',
    '--window-border': '#586e75',
    '--active-file-bg-color': '#073642',
    '--active-file-text-color': '#93a1a1',
    '--item-hover-bg-color': '#094652',
    '--control-text-color': '#657b83',
    '--primary-color': '#268bd2',
    '--code-block-bg': '#073642',
    '--blockquote-border-color': '#268bd2',
    '--heading-color': '#93a1a1',
  },
  solarizedLight: {
    '--bg-color': '#fdf6e3',
    '--text-color': '#657b83',
    '--side-bar-bg-color': '#eee8d5',
    '--window-border': '#93a1a1',
    '--active-file-bg-color': '#eee8d5',
    '--active-file-text-color': '#586e75',
    '--item-hover-bg-color': '#f5efdc',
    '--control-text-color': '#839496',
    '--primary-color': '#268bd2',
    '--code-block-bg': '#eee8d5',
    '--blockquote-border-color': '#268bd2',
    '--heading-color': '#586e75',
  },
};

// Display names for UI
export const themeDisplayNames: Record<string, string> = {
  everforest: 'Everforest',
  night: 'Night',
  dracula: 'Dracula',
  monokai: 'Monokai',
  solarizedDark: 'Solarized Dark',
  solarizedLight: 'Solarized Light',
};

export const themeNames = Object.keys(themes);

export function applyTheme(themeName: string): void {
  const vars = themes[themeName] || themes.everforest;
  const root = document.documentElement;

  // Apply CSS variables
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Remove all theme classes first
  themeNames.forEach(name => {
    root.classList.remove(`theme-${name}`);
  });

  // Add current theme class for CSS scoping
  root.classList.add(`theme-${themeName}`);

  // Toggle dark class for Tailwind
  const isDark = ['night', 'dracula', 'solarizedDark', 'monokai', 'everforest'].includes(themeName);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
