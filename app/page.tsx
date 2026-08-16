'use client';

import { useState } from 'react';
import QueryInterface from '@/components/QueryInterface';
import PDFInterface from '@/components/PDFInterface';
import DataDictionary from '@/components/DataDictionary';
import GraphRAGInterface from '@/components/GraphRAGInterface';
import LandingDashboard from '@/components/LandingDashboard';
import { Database, FileText, BookOpen, Network, Home } from 'lucide-react';

type Tab = 'home' | 'query' | 'pdf' | 'dictionary' | 'graphrag';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedDataset, setSelectedDataset] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-ford-blue-50 via-white to-ford-light-blue-50 dark:from-ford-gray-900 dark:via-ford-gray-800 dark:to-ford-gray-900">
      {/* Header */}
      <header className="ford-gradient-bg shadow-ford-lg border-b-4 border-ford-red sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-ford-lg ford-pulse">
                <svg viewBox="0 0 100 100" className="w-10 h-10">
                  <text x="50" y="65" textAnchor="middle" fill="#003478" fontSize="48" fontWeight="bold" fontFamily="Arial">F</text>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-ford">
                  Ford UCL AI Data Platform
                </h1>
                <p className="text-sm text-ford-blue-100 font-medium">
                  University Credit Lab - AI-Powered Analytics & Knowledge Discovery
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                <p className="text-xs text-white/80">Powered by</p>
                <p className="text-sm font-bold text-white">Google Cloud AI</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sticky top-24 z-40 bg-gradient-to-br from-ford-blue-50 via-white to-ford-light-blue-50 dark:from-ford-gray-900 dark:via-ford-gray-800 dark:to-ford-gray-900 pb-4">
        <div className="card-ford p-1.5 grid grid-cols-2 lg:grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
              activeTab === 'home'
                ? 'ford-gradient-bg text-white shadow-ford-lg scale-105'
                : 'text-ford-gray-600 dark:text-ford-gray-300 hover:bg-ford-blue-50 dark:hover:bg-ford-gray-700 hover:text-ford-blue'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-ford">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
              activeTab === 'query'
                ? 'bg-ford-blue text-white shadow-ford-lg scale-105'
                : 'text-ford-gray-600 dark:text-ford-gray-300 hover:bg-ford-blue-50 dark:hover:bg-ford-gray-700 hover:text-ford-blue'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="font-ford">SQL Query</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
              activeTab === 'pdf'
                ? 'bg-ford-light-blue text-white shadow-ford-lg scale-105'
                : 'text-ford-gray-600 dark:text-ford-gray-300 hover:bg-ford-blue-50 dark:hover:bg-ford-gray-700 hover:text-ford-blue'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-ford">PDF RAG</span>
          </button>
          <button
            onClick={() => setActiveTab('graphrag')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
              activeTab === 'graphrag'
                ? 'bg-ford-blue-600 text-white shadow-ford-lg scale-105'
                : 'text-ford-gray-600 dark:text-ford-gray-300 hover:bg-ford-blue-50 dark:hover:bg-ford-gray-700 hover:text-ford-blue'
            }`}
          >
            <Network className="w-5 h-5" />
            <span className="font-ford">GraphRAG</span>
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
              activeTab === 'dictionary'
                ? 'bg-ford-blue-700 text-white shadow-ford-lg scale-105'
                : 'text-ford-gray-600 dark:text-ford-gray-300 hover:bg-ford-blue-50 dark:hover:bg-ford-gray-700 hover:text-ford-blue'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-ford">Dictionary</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={activeTab === 'home' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {activeTab === 'home' && <LandingDashboard />}
        {activeTab === 'query' && (
          <QueryInterface
            selectedDataset={selectedDataset}
            onDatasetChange={setSelectedDataset}
          />
        )}
        {activeTab === 'pdf' && <PDFInterface />}
        {activeTab === 'graphrag' && <GraphRAGInterface />}
        {activeTab === 'dictionary' && (
          <DataDictionary
            selectedDataset={selectedDataset}
            onDatasetChange={setSelectedDataset}
          />
        )}
      </main>
    </div>
  );
}
