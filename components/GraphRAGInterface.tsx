'use client';

import { useState, useEffect } from 'react';
import { Network, Send, Loader2, FileText, BarChart3 } from 'lucide-react';
import GraphVisualizer from './GraphVisualizer';

interface PDFDocument {
  id: string;
  filename: string;
  pageCount: number;
}

interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  entitiesByType: Record<string, number>;
  documents: number;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  properties: any;
}

export default function GraphRAGInterface() {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [building, setBuilding] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [activeTab, setActiveTab] = useState<'query' | 'visualize' | 'stats'>('query');

  useEffect(() => {
    fetchDocuments();
    fetchGraphData();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/pdf');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const fetchGraphData = async () => {
    try {
      const response = await fetch('/api/graph');
      const data = await response.json();
      setStats(data.stats);
      setGraphData(data.visualization);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    }
  };

  const buildGraph = async (documentId: string) => {
    setBuilding(true);
    try {
      const response = await fetch('/api/graph/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      if (response.ok) {
        await fetchGraphData();
        alert('Graph built successfully!');
      }
    } catch (err) {
      console.error('Error building graph:', err);
      alert('Failed to build graph');
    } finally {
      setBuilding(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);

    try {
      const response = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          documentIds: selectedDocs.size > 0 ? Array.from(selectedDocs) : undefined,
        }),
      });

      const data = await response.json();
      setAnswer(data);
    } catch (err) {
      console.error('Error asking question:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{stats.totalEntities}</div>
              <div className="text-sm opacity-90">Entities</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{stats.totalRelationships}</div>
              <div className="text-sm opacity-90">Relationships</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{stats.documents}</div>
              <div className="text-sm opacity-90">Documents</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{Object.keys(stats.entitiesByType).length}</div>
              <div className="text-sm opacity-90">Entity Types</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('query')}
            className={`flex-1 px-4 py-2 rounded-md transition-all ${
              activeTab === 'query'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Query
          </button>
          <button
            onClick={() => setActiveTab('visualize')}
            className={`flex-1 px-4 py-2 rounded-md transition-all ${
              activeTab === 'visualize'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Visualize
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2 rounded-md transition-all ${
              activeTab === 'stats'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Query Tab */}
        {activeTab === 'query' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Query Knowledge Graph
              </h2>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What organizations are mentioned in the documents? How are they related?"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
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
                      <span>Ask Question</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Answer */}
            {answer && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Answer
                  </h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {answer.answer}
                    </p>
                  </div>
                </div>

                {answer.relevantEntities && answer.relevantEntities.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Relevant Entities ({answer.relevantEntities.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {answer.relevantEntities.slice(0, 20).map((entity: Entity) => (
                        <span
                          key={entity.id}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                          title={entity.type}
                        >
                          {entity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {answer.graphContext && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Graph Context
                    </h3>
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {answer.graphContext}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Visualize Tab */}
        {activeTab === 'visualize' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-[600px]">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Knowledge Graph Visualization
            </h2>
            <div className="h-[calc(100%-3rem)]">
              <GraphVisualizer nodes={graphData.nodes} edges={graphData.edges} />
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Graph Statistics
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entities by Type
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.entitiesByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2"
                            style={{ width: `${(count / stats.totalEntities) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Documents</span>
          </h2>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No documents uploaded yet
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.pageCount} pages
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={() => toggleDocSelection(doc.id)}
                      className="mt-1"
                    />
                  </div>
                  <button
                    onClick={() => buildGraph(doc.id)}
                    disabled={building}
                    className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm rounded-md transition-colors flex items-center justify-center space-x-1"
                  >
                    {building ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Building...</span>
                      </>
                    ) : (
                      <>
                        <Network className="w-3 h-3" />
                        <span>Build Graph</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {selectedDocs.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected for querying
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
