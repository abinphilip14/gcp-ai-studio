'use client';

import { useState, useEffect } from 'react';
import { Clock, Star, Trash2 } from 'lucide-react';
import { queryHistoryService, QueryHistory } from '@/lib/query-history';

interface QueryHistoryPanelProps {
  onSelectQuery: (query: QueryHistory) => void;
}

export default function QueryHistoryPanel({ onSelectQuery }: QueryHistoryPanelProps) {
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');

  useEffect(() => {
    loadHistory();
    
    // Refresh history every 5 seconds to catch updates
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = () => {
    const recent = queryHistoryService.getHistory(20);
    setHistory(recent);
  };

  const savedQueries = history.filter(q => q.saved);
  const recentQueries = history.filter(q => !q.saved);

  const handleSave = (queryId: string) => {
    const name = prompt('Enter a name for this saved query:');
    if (name) {
      queryHistoryService.saveQuery(queryId, name);
      loadHistory();
    }
  };

  const handleRemoveSaved = (queryId: string) => {
    if (confirm('Remove this saved query?')) {
      queryHistoryService.removeSavedQuery(queryId);
      loadHistory();
    }
  };

  const displayQueries = activeTab === 'saved' ? savedQueries : recentQueries;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-6">
      <div className="flex space-x-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'recent'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'saved'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Saved ({savedQueries.length})
        </button>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
        {displayQueries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {activeTab === 'saved' ? 'No saved queries yet' : 'No recent queries'}
          </p>
        ) : (
          displayQueries.map((query) => (
            <div
              key={query.id}
              className="group p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => onSelectQuery(query)}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {query.name || query.question}
                </p>
                {activeTab === 'recent' && !query.saved && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(query.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                  </button>
                )}
                {query.saved && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSaved(query.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(query.timestamp)}</span>
                </div>
                <span>{query.resultCount} rows</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
