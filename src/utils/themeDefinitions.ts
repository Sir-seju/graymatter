// Theme CSS variable definitions based on Typora themes
// These define the visual appearance for each theme

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
}

export const themes: Record<string, ThemeVariables> = {
  system: {
    '--bg-color': '#ffffff',
    '--text-color': '#333333',
    '--side-bar-bg-color': '#fafafa',
    '--window-border': '#e5e5e5',
    '--active-file-bg-color': '#e8e8e8',
    '--active-file-text-color': '#333333',
    '--item-hover-bg-color': '#f0f0f0',
    '--control-text-color': '#666666',
    '--primary-color': '#4a89dc',
    '--code-block-bg': '#f5f5f5',
    '--blockquote-border-color': '#dfe2e5',
  },
  night: {
    '--bg-color': '#363B40',
    '--text-color': '#f3f4f5',
    '--side-bar-bg-color': '#2E3033',
    '--window-border': '#555555',
    '--active-file-bg-color': '#222222',
    '--active-file-text-color': '#ffffff',
    '--item-hover-bg-color': '#484e55',
    '--control-text-color': '#b7b7b7',
    '--primary-color': '#6dc1e7',
    '--code-block-bg': '#282a36',
    '--blockquote-border-color': '#abf374', // Lime Green from screenshot
  },
  github: {
    '--bg-color': '#ffffff',
    '--text-color': '#24292e',
    '--side-bar-bg-color': '#f6f8fa',
    '--window-border': '#e1e4e8',
    '--active-file-bg-color': '#e1e4e8',
    '--active-file-text-color': '#24292e',
    '--item-hover-bg-color': '#f0f0f0',
    '--control-text-color': '#586069',
    '--primary-color': '#0366d6',
    '--code-block-bg': '#f6f8fa',
    '--blockquote-border-color': '#dfe2e5',
  },
  nord: {
    '--bg-color': '#2E3440',
    '--text-color': '#ECEFF4',
    '--side-bar-bg-color': '#3B4252',
    '--window-border': '#4C566A',
    '--active-file-bg-color': '#434C5E',
    '--active-file-text-color': '#ECEFF4',
    '--item-hover-bg-color': '#4C566A',
    '--control-text-color': '#D8DEE9',
    '--primary-color': '#88C0D0',
    '--code-block-bg': '#3B4252',
    '--blockquote-border-color': '#81A1C1',
  },
  pixyll: {
    '--bg-color': '#ffffff',
    '--text-color': '#333333',
    '--side-bar-bg-color': '#f9f9f9',
    '--window-border': '#dddddd',
    '--active-file-bg-color': '#eeeeee',
    '--active-file-text-color': '#333333',
    '--item-hover-bg-color': '#f0f0f0',
    '--control-text-color': '#666666',
    '--primary-color': '#6a9fb5',
    '--code-block-bg': '#f4f4f4',
    '--blockquote-border-color': '#eeeeee',
  },
  whitey: {
    '--bg-color': '#ffffff',
    '--text-color': '#2c3e50',
    '--side-bar-bg-color': '#f7f7f7',
    '--window-border': '#eeeeee',
    '--active-file-bg-color': '#e0e0e0',
    '--active-file-text-color': '#2c3e50',
    '--item-hover-bg-color': '#f0f0f0',
    '--control-text-color': '#7f8c8d',
    '--primary-color': '#3498db',
    '--code-block-bg': '#f8f8f8',
    '--blockquote-border-color': '#111',
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
    '--code-block-bg': '#1e1f29', // Slightly darker than editor bg for contrast
    '--blockquote-border-color': '#bd93f9',
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
  },
  everforest: {
    '--bg-color': '#2e353a',
    '--text-color': '#d3c6aa',
    '--side-bar-bg-color': '#363f44',
    '--window-border': '#444c50',
    '--active-file-bg-color': '#495156',
    '--active-file-text-color': '#d3c6aa',
    '--item-hover-bg-color': '#3f484d',
    '--control-text-color': '#9da9a0',
    '--primary-color': '#a7c080',
    '--code-block-bg': '#363f44',
    '--blockquote-border-color': '#a7c080',
  },
};

export const themeNames = Object.keys(themes);

export function applyTheme(themeName: string): void {
  const vars = themes[themeName] || themes.system;
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
  const isDark = ['night', 'nord', 'dracula', 'solarizedDark', 'monokai'].includes(themeName);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
