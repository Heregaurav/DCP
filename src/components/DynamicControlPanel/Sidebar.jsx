import React from 'react';

function Sidebar({ isOpen, toggleSidebar, activeTool, setActiveTool, hasData }) {
  const tools = [
    { id: 'sort', name: 'Sort Data', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M11 18h2"/></svg>
      ), component: 'SortControls' },
    { id: 'filter', name: 'Filter Data', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H3l8 10v6l2-1v-5z"/></svg>
      ), component: 'FilterControls' },
    { id: 'columns', name: 'Manage Columns', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
      ), component: 'ColumnManagement' },
    { id: 'cleaning', name: 'Data Cleaning', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l18-18"/></svg>
      ), component: 'DataCleaning' },
    { id: 'statistics', name: 'Statistics', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-8"/><path d="M18 20v-4"/><path d="M6 20v-12"/></svg>
      ), component: 'Statistics' },
    { id: 'advanced', name: 'Advanced Tools', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.66 18.7l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.3 4.3A2 2 0 1 1 7.12 1.47l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 10.6 1H13.4a1.65 1.65 0 0 0 1.51.8h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20 4.3l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      ), component: 'AdvancedTools' },
    { id: 'grouping', name: 'Grouping', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>
      ), component: 'GroupingForm' },
    { id: 'pivot', name: 'Pivot Table', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h8v8H3z"/><path d="M13 3h8v8h-8z"/><path d="M3 13h8v8H3z"/><path d="M13 13h8v8h-8z"/></svg>
      ), component: 'PivotTableForm' },
    { id: 'merge', name: 'Merge Files', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14l-4 4"/><path d="M14 10l4-4"/><path d="M20 7v6a4 4 0 0 1-4 4H8"/></svg>
      ), component: 'MergeForm' },
    { id: 'formula', name: 'Formula Column', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5"/><path d="M7 15l5-5"/></svg>
      ), component: 'FormulaColumnForm' },
    { id: 'formatting', name: 'Formatting', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>
      ), component: 'ConditionalFormattingForm' },
    { id: 'download', name: 'Download', icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M21 21H3"/></svg>
      ), component: 'DownloadSection' }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Tools</h2>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!hasData && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Upload a CSV file to access tools
            </div>
          )}

          <nav className="space-y-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  if (hasData) {
                    setActiveTool(tool.id);
                    toggleSidebar();
                  }
                }}
                disabled={!hasData}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTool === tool.id
                    ? 'tool-active'
                    : hasData
                    ? 'text-gray-700 hover:bg-[rgba(0,0,0,0.04)]'
                    : 'tool-disabled'
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                <span className="font-medium">{tool.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
