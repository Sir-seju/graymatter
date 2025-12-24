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
  },
  night: {
    '--bg-color': '#363B40',
    '--text-color': '#b8bfc6',
    '--side-bar-bg-color': '#2E3033',
    '--window-border': '#555555',
    '--active-file-bg-color': '#222222',
    '--active-file-text-color': '#ffffff',
    '--item-hover-bg-color': '#70717d',
    '--control-text-color': '#b7b7b7',
    '--primary-color': '#6dc1e7',
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
  const isDark = ['night', 'nord'].includes(themeName);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
