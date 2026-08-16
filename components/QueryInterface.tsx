'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, Download, Clock, TrendingUp } from 'lucide-react';
import { queryHistoryService, QueryHistory } from '@/lib/query-history';
import ResultsTable from './ResultsTable';
import QueryHistoryPanel from './QueryHistoryPanel';

interface QueryInterfaceProps {
  selectedDataset: string;
  onDatasetChange: (dataset: string) => void;
}

export default function QueryInterface({ selectedDataset, onDatasetChange }: QueryInterfaceProps) {
  const [question, setQuestion] = useState('');
  const [datasets, setDatasets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/datasets');
      const data = await response.json();
      setDatasets(data.datasets);
      if (data.datasets.length > 0 && !selectedDataset) {
        onDatasetChange(data.datasets[0]);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !selectedDataset) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          datasetId: selectedDataset,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to process query');
      }

      const data = await response.json();
      setResults(data);

      // Add to history
      queryHistoryService.addToHistory({
        question,
        sql: data.sql,
        resultCount: data.resultCount,
        executionTime: data.executionTime,
        saved: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    if (!results?.results) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: results.results,
          format,
          filename: `query_results_${Date.now()}`,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_results.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Query Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Input Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Dataset
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => onDatasetChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Choose a dataset...</option>
                {datasets.map((dataset) => (
                  <option key={dataset} value={dataset}>
                    {dataset}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ask a Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What were the top 10 products by revenue last month?"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim() || !selectedDataset}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Run Query</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* SQL and Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generated SQL
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{results.executionTime}ms</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{results.resultCount} rows</span>
                  </div>
                </div>
              </div>
              
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-800 dark:text-gray-200">{results.sql}</code>
              </pre>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {results.explanation}
              </p>
            </div>

            {/* Insights */}
            {results.insights && results.insights.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {results.insights.map((insight: string, i: number) => (
                    <li key={i} className="text-blue-800 dark:text-blue-300 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Results
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
              <ResultsTable data={results.results} />
            </div>

            {/* Follow-up Questions */}
            {results.followUpQuestions && results.followUpQuestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Suggested Follow-up Questions
                </h3>
                <div className="space-y-2">
                  {results.followUpQuestions.map((q: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(q)}
                      className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Query History Sidebar */}
      <div className="lg:col-span-1">
        <QueryHistoryPanel onSelectQuery={(q) => setQuestion(q.question)} />
      </div>
    </div>
  );
}
