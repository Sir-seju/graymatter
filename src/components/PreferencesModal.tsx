import { X } from 'lucide-react';
import React, { useState } from 'react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  autoSaveDelay: number;
  setAutoSaveDelay: (delay: number) => void;
  hideScrollbars: boolean;
  setHideScrollbars: (hide: boolean) => void;
}

type SettingsTab = 'General' | 'Editor' | 'Markdown' | 'Spelling' | 'Theme' | 'Image' | 'Key Bindings';

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  autoSave,
  setAutoSave,
  autoSaveDelay,
  setAutoSaveDelay,
  hideScrollbars,
  setHideScrollbars,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const tabs: { name: SettingsTab; icon: React.ReactNode }[] = [
    {
      name: 'General',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      name: 'Editor',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      name: 'Markdown',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8v8" />
          <path d="M6 12l2-4 2 4" />
          <path d="M14 8v8l3-3 3 3V8" />
        </svg>
      ),
    },
    {
      name: 'Spelling',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 11-6 6v3h9l3-3" />
          <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
        </svg>
      ),
    },
    {
      name: 'Theme',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2" />
          <path d="M12 21v2" />
          <path d="m4.22 4.22 1.42 1.42" />
          <path d="m18.36 18.36 1.42 1.42" />
          <path d="M1 12h2" />
          <path d="M21 12h2" />
          <path d="m4.22 19.78 1.42-1.42" />
          <path d="m18.36 5.64 1.42-1.42" />
        </svg>
      ),
    },
    {
      name: 'Image',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      ),
    },
    {
      name: 'Key Bindings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.001" />
          <path d="M10 8h.001" />
          <path d="M14 8h.001" />
          <path d="M18 8h.001" />
          <path d="M8 12h.001" />
          <path d="M12 12h.001" />
          <path d="M16 12h.001" />
          <path d="M7 16h10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-[800px] h-[560px] rounded-xl shadow-2xl overflow-hidden flex"
        style={{
          backgroundColor: 'var(--bg-color)',
          border: '1px solid var(--window-border)',
        }}
      >
        {/* Left sidebar with tabs */}
        <div
          className="w-[200px] flex flex-col"
          style={{
            backgroundColor: 'var(--side-bar-bg-color)',
            borderRight: '1px solid var(--window-border)',
          }}
        >
          {/* Header with traffic lights */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff4f47] transition-colors flex items-center justify-center group"
              >
                <X size={8} className="opacity-0 group-hover:opacity-100 text-[#820005]" />
              </button>
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
          </div>

          {/* Title */}
          <div className="px-4 py-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
              Preferences
            </h2>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <input
              type="text"
              placeholder="Search preferences"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--item-hover-bg-color)',
                color: 'var(--text-color)',
                border: '1px solid transparent',
              }}
            />
          </div>

          {/* Tabs */}
          <div className="flex-1 px-2 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  activeTab === tab.name ? 'bg-blue-500/20' : 'hover:bg-gray-500/10'
                }`}
                style={{
                  color: activeTab === tab.name ? '#3b82f6' : 'var(--text-color)',
                }}
              >
                <span style={{ opacity: activeTab === tab.name ? 1 : 0.6 }}>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--window-border)' }}
          >
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
              {activeTab}
            </h3>
          </div>

          {/* Content body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'General' && (
              <div className="space-y-6">
                {/* Auto Save Section */}
                <section>
                  <h4 className="text-sm font-semibold mb-3 opacity-70" style={{ color: 'var(--text-color)' }}>
                    Auto Save:
                  </h4>
                  <div
                    className="rounded-lg p-4 space-y-4"
                    style={{ backgroundColor: 'var(--side-bar-bg-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                        Automatically save document changes:
                      </span>
                      <button
                        onClick={() => setAutoSave(!autoSave)}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          autoSave ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                            autoSave ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                        Delay following document edit before automatically saving:
                      </span>
                      <span className="text-sm opacity-70" style={{ color: 'var(--text-color)' }}>
                        {autoSaveDelay} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="500"
                      value={autoSaveDelay}
                      onChange={(e) => setAutoSaveDelay(parseInt(e.target.value))}
                      className="w-full accent-green-500"
                    />
                  </div>
                </section>

                {/* Window Section */}
                <section>
                  <h4 className="text-sm font-semibold mb-3 opacity-70" style={{ color: 'var(--text-color)' }}>
                    Window:
                  </h4>
                  <div
                    className="rounded-lg p-4 space-y-4"
                    style={{ backgroundColor: 'var(--side-bar-bg-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                        Hide scrollbars:
                      </span>
                      <button
                        onClick={() => setHideScrollbars(!hideScrollbars)}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          hideScrollbars ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                            hideScrollbars ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs opacity-50" style={{ color: 'var(--text-color)' }}>
                      Use Cmd+/- to zoom in and out
                    </p>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'Editor' && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold mb-3 opacity-70" style={{ color: 'var(--text-color)' }}>
                    Font:
                  </h4>
                  <div
                    className="rounded-lg p-4 space-y-4"
                    style={{ backgroundColor: 'var(--side-bar-bg-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                        Font Size:
                      </span>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="12"
                          max="24"
                          value={fontSize}
                          onChange={(e) => setFontSize(parseInt(e.target.value))}
                          className="w-32 accent-green-500"
                        />
                        <span className="text-sm w-12 text-right" style={{ color: 'var(--text-color)' }}>
                          {fontSize}px
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'Theme' && (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold mb-3 opacity-70" style={{ color: 'var(--text-color)' }}>
                    Theme Selection:
                  </h4>
                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: 'var(--side-bar-bg-color)' }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {['night', 'dracula', 'monokai', 'solarizedDark', 'solarizedLight', 'everforest'].map((themeName) => (
                        <button
                          key={themeName}
                          onClick={() => setTheme(themeName)}
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                            theme === themeName ? 'ring-2 ring-blue-500' : ''
                          }`}
                          style={{
                            backgroundColor: theme === themeName ? 'var(--item-hover-bg-color)' : 'var(--bg-color)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--window-border)',
                          }}
                        >
                          {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab !== 'General' && activeTab !== 'Editor' && activeTab !== 'Theme' && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm opacity-50" style={{ color: 'var(--text-color)' }}>
                  {activeTab} settings coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
