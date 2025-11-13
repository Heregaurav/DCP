import React, { useState, useEffect, useRef } from "react";
import DynamicControlPanel from "./components/DynamicControlPanel/DynamicControlPanel";
import DataTable from "./components/DataTable";
import LoadingIndicator from "./components/LoadingIndicator";
import EditableTable from './components/Table/EditableTable';
import Error from "./components/Error";
import { useUndoRedo } from './hooks/useUndoRedo';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const workerRef = useRef(null);

  // --- NEW: Undo/Redo for display data ---
  const {
    state: displayData,
    setState: setDisplayData,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
    historySize,
  } = useUndoRedo(null, 50); // Keep last 50 states

  const [isEditMode, setIsEditMode] = useState(false);

  const [formattingMap, setFormattingMap] = useState({});
  const [groupedData, setGroupedData] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./worker/processor.js", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      console.log("Message from worker:", type);

      if (type === "SUCCESS_ANALYSIS") {
        setDataSummary(payload.summary);
        setDisplayData(payload.previewData);
        resetHistory(payload.previewData); // Reset history on new file
        setHiddenColumns(payload.hiddenColumns || []);
        setFormattingMap(payload.formattingMap || {});
        setGroupedData(null);
        setPivotData(null);
        setChartData(null);
        setError(null);
        setSuccessMessage("File loaded successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (type === "SUCCESS_UPDATE") {
        setDisplayData(payload.previewData);

        if (payload.summary) {
          setDataSummary(payload.summary);
        }

        if (payload.hiddenColumns) {
          setHiddenColumns(payload.hiddenColumns);
        }

        if (payload.formattingMap) {
          setFormattingMap(payload.formattingMap);
        }

        setGroupedData(null);
        setPivotData(null);
        setChartData(null);

        if (payload.message) {
          setSuccessMessage(payload.message);
          setTimeout(() => setSuccessMessage(null), 3000);
        }

        console.log(`✅ Data updated — rows shown: ${payload?.rowCount ?? payload.previewData.length}`);
      } else if (type === "SUCCESS_AGGREGATIONS") {
        console.log("✅ Aggregations computed:", payload.aggregations);
      } else if (type === "SUCCESS_DOWNLOAD") {
        console.log("✅ CSV download triggered from worker");

        if (!payload?.csvString || payload.csvString.trim() === "") {
          setError({
            title: "Download Error",
            message: "CSV file is empty or could not be generated. Please reapply filters or try again.",
          });
          setIsProcessing(false);
          return;
        }

        const blob = new Blob([payload.csvString], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `processed_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccessMessage("CSV downloaded successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log("💾 CSV downloaded successfully.");
      } else if (type === "SUCCESS_GROUPING") {
        setGroupedData(payload.groupedData);
        setDisplayData(null);
        setPivotData(null);
        setChartData(null);
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (type === "SUCCESS_PIVOT") {
        setPivotData(payload.pivotData);
        setDisplayData(null);
        setGroupedData(null);
        setChartData(null);
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (type === "SUCCESS_CHART_DATA") {
        setChartData(payload.chartData);
        setDisplayData(null);
        setGroupedData(null);
        setPivotData(null);
      } else if (type === "SUCCESS_PARSE_FILE_2") {
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (type === "ERROR") {
        setError({ title: "Processing Error", message: payload.message });
      }

      setIsProcessing(false);
    };

    workerRef.current.onerror = (err) => {
      console.error("Worker error:", err);
      setError({ title: "Worker Failed", message: err.message });
      setIsProcessing(false);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Sending file to worker...");
    setIsProcessing(true);
    setDataSummary(null);
    setDisplayData(null);
    resetHistory(null);
    setHiddenColumns([]);
    setError(null);
    setSuccessMessage(null);

    setFormattingMap({});
    setGroupedData(null);
    setPivotData(null);
    setChartData(null);
    setIsEditMode(false);

    workerRef.current.postMessage({
      type: "PARSE_FILE",
      payload: { file },
    });
  };

  const handleProcessRequest = (type, payload) => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    if (
      ![
        "GROUP_AND_AGGREGATE",
        "GENERATE_PIVOT_TABLE",
        "GET_CHART_DATA",
      ].includes(type)
    ) {
      setGroupedData(null);
      setPivotData(null);
      setChartData(null);
    }

    workerRef.current.postMessage({
      type,
      payload,
    });
  };

  handleProcessRequest.worker = workerRef.current;

  const handleDataChange = (updatedData) => {
    console.log("Data updated in EditableTable:", updatedData);
    setDisplayData(updatedData); // This will add to history automatically
    
    workerRef.current.postMessage({
      type: "UPDATE_DATA_FROM_EDIT",
      payload: { data: updatedData },
    });
    
    setSuccessMessage("Cell updated successfully!");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const toggleEditMode = () => {
    if (!displayData || displayData.length === 0) {
      setError({
        title: "No Data",
        message: "Please load data before enabling edit mode.",
      });
      return;
    }
    setIsEditMode(!isEditMode);
  };

  // --- NEW: Undo/Redo handlers ---
  const handleUndo = () => {
    if (!canUndo) return;
    
    const previousState = undo();
    if (previousState) {
      // Sync with worker
      workerRef.current.postMessage({
        type: "UPDATE_DATA_FROM_EDIT",
        payload: { data: previousState },
      });
      setSuccessMessage("Undo successful!");
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;
    
    const nextState = redo();
    if (nextState) {
      // Sync with worker
      workerRef.current.postMessage({
        type: "UPDATE_DATA_FROM_EDIT",
        payload: { data: nextState },
      });
      setSuccessMessage("Redo successful!");
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Y or Cmd+Y for Redo (alternative)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo]);

  let content = (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
      <p className="text-gray-500 text-center">
        Please upload a CSV file to begin.
      </p>
    </div>
  );

  if (isProcessing) {
    content = <LoadingIndicator text="Processing... please wait." />;
  } else if (error) {
    content = (
      <Error
        title={error.title}
        message={error.message}
        onClose={() => setError(null)}
      />
    );
  } else if (displayData) {
    content = isEditMode ? (
      <EditableTable
        data={displayData}
        summary={dataSummary}
        hiddenColumns={hiddenColumns}
        onDataChange={handleDataChange}
      />
    ) : (
      <DataTable
        headers={dataSummary.headers.filter((h) => !hiddenColumns.includes(h))}
        data={displayData}
        totalRows={dataSummary.totalRows}
        formattingMap={formattingMap}
      />
    );
  } else if (dataSummary && !groupedData && !pivotData && !chartData) {
    content = (
      <DataTable
        headers={dataSummary.headers.filter((h) => !hiddenColumns.includes(h))}
        data={[]}
        totalRows={0}
        formattingMap={formattingMap}
      />
    );
  } else if (dataSummary) {
    content = (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">
          {groupedData ? "Grouping results shown below." : ""}
          {pivotData ? "Pivot table results shown below." : ""}
          {chartData ? "Chart data shown below." : ""}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 font-inter">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">
          Dynamic CSV Processor
        </h1>

        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-700 hover:text-green-900"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload Section */}
          <section className="file-upload-section mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              1. Upload Your Data
            </h2>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-50 transition bg-white">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <svg
                  className="w-12 h-12 mb-3 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm font-medium">
                  Click or drag & drop your CSV file
                </p>
                <p className="text-xs text-gray-400">
                  Processing happens in your browser
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </section>

          {/* Data Summary Stats */}
          {dataSummary && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Dataset Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Rows:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {dataSummary.totalRows}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Columns:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {dataSummary.headers.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Visible:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {dataSummary.headers.length - hiddenColumns.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Hidden:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {hiddenColumns.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Control Panel */}
          {dataSummary && (
            <DynamicControlPanel
              summary={dataSummary}
              isProcessing={isProcessing}
              onProcess={handleProcessRequest}
              hiddenColumns={hiddenColumns}
              worker={handleProcessRequest.worker}
              data={displayData}
            />
          )}

          {/* NEW: Undo/Redo & Edit Mode Controls */}
          {dataSummary && displayData && !groupedData && !pivotData && !chartData && (
            <div className="mt-6 mb-4">
              {/* Undo/Redo Bar */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Undo (Ctrl+Z)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="Redo (Ctrl+Shift+Z)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                    </svg>
                    Redo
                  </button>
                  <div className="ml-4 text-sm text-gray-600">
                    <span className="font-medium">{historySize}</span> {historySize === 1 ? 'change' : 'changes'} in history
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Shortcuts: Ctrl+Z (Undo) | Ctrl+Shift+Z or Ctrl+Y (Redo)
                </div>
              </div>

              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isEditMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {isEditMode ? '✏️ Edit Mode Active' : '👁️ View Mode'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {isEditMode 
                        ? 'Double-click any cell to edit. Changes are saved automatically and can be undone.' 
                        : 'Enable edit mode to modify cell values directly in the table.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleEditMode}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isEditMode
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isEditMode ? '🔒 Lock Table' : '🔓 Enable Editing'}
                </button>
              </div>
            </div>
          )}

          {/* Data Display Section */}
          <section id="data-content" className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                3. {isEditMode ? 'Edit Your Data' : 'View Your Data'}
              </h2>
              {displayData && displayData.length > 0 && (
                <span className="text-sm text-gray-600">
                  Showing {displayData.length} of {dataSummary?.totalRows || 0} rows
                </span>
              )}
            </div>
            {content}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
