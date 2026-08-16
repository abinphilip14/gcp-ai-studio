'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Zap,
  Database,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  Network,
  FileText,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

interface AnalyticsStats {
  totalQuestions: number;
  totalPDFQueries: number;
  totalGraphQueries: number;
  totalExports: number;
  avgResponseTime: number;
  successRate: number;
  totalTokensConsumed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  totalSessions: number;
  uniqueUsers: number;
  activeUsers24h: number;
  avgQueriesPerSession: number;
  totalPDFs: number;
  totalGraphNodes: number;
  totalGraphRelationships: number;
  totalGraphDocuments: number;
  totalErrors: number;
  errorRate: number;
  avgExecutionTime: number;
  queriesLast24h: number;
  queriesLast7d: number;
  queriesLast30d: number;
  topQueryTypes: Array<{ type: string; count: number }>;
  recentActivity: any[];
}

export default function LandingDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedCounts, setAnimatedCounts] = useState({
    questions: 0,
    tokens: 0,
    users: 0,
    nodes: 0,
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Animate counters
  useEffect(() => {
    if (!stats) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedCounts({
        questions: Math.floor(stats.totalQuestions * progress),
        tokens: Math.floor(stats.totalTokensConsumed * progress),
        users: Math.floor(stats.uniqueUsers * progress),
        nodes: Math.floor(stats.totalGraphNodes * progress),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedCounts({
          questions: stats.totalQuestions,
          tokens: stats.totalTokensConsumed,
          users: stats.uniqueUsers,
          nodes: stats.totalGraphNodes,
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-ford-blue"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-ford-red mx-auto mb-4" />
          <p className="text-ford-gray-600 dark:text-ford-gray-400 text-lg">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ford-blue-50 via-white to-ford-light-blue-50 dark:from-ford-gray-900 dark:via-ford-gray-800 dark:to-ford-gray-900 p-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8 ford-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 ford-gradient-bg rounded-2xl mb-6 shadow-ford-xl">
            <Database className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-ford-blue dark:text-white mb-3 font-ford">
            Ford UCL AI Data Platform
          </h1>
          <p className="text-xl text-ford-gray-600 dark:text-ford-gray-400 font-medium">
            Real-time Analytics & Insights Dashboard
          </p>
          <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-ford-blue-50 dark:bg-ford-gray-800 rounded-full border border-ford-blue-200 dark:border-ford-blue-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-ford-gray-700 dark:text-ford-gray-300">Live Data</span>
          </div>
        </div>

        {/* Key Metrics - Animated Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Questions Answered"
            value={animatedCounts.questions.toLocaleString()}
            icon={<TrendingUp className="w-8 h-8" />}
            gradient="from-ford-blue to-ford-blue-600"
            subtitle={`${stats.queriesLast24h} in last 24h`}
          />
          <MetricCard
            title="Tokens Consumed"
            value={formatNumber(animatedCounts.tokens)}
            icon={<Zap className="w-8 h-8" />}
            gradient="from-ford-orange to-ford-orange-600"
            subtitle={`$${stats.estimatedCost.toFixed(2)} estimated cost`}
          />
          <MetricCard
            title="Active Users"
            value={animatedCounts.users.toLocaleString()}
            icon={<Users className="w-8 h-8" />}
            gradient="from-green-500 to-green-600"
            subtitle={`${stats.activeUsers24h} active today`}
          />
          <MetricCard
            title="Knowledge Nodes"
            value={formatNumber(animatedCounts.nodes)}
            icon={<Network className="w-8 h-8" />}
            gradient="from-ford-light-blue to-ford-light-blue-600"
            subtitle={`${stats.totalGraphRelationships.toLocaleString()} relationships`}
          />
        </div>
      </div>

      {/* Business Metrics */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-ford-blue dark:text-white mb-6 flex items-center font-ford">
          <BarChart3 className="w-7 h-7 mr-3 text-ford-blue" />
          Business Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label="Total Queries"
            value={stats.totalQuestions.toLocaleString()}
            sublabel="SQL + PDF + Graph"
            icon={<Activity className="w-5 h-5 text-ford-blue" />}
          />
          <StatCard
            label="Success Rate"
            value={`${stats.successRate.toFixed(1)}%`}
            sublabel={`${stats.totalErrors} errors`}
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          />
          <StatCard
            label="Avg Response Time"
            value={`${(stats.avgResponseTime / 1000).toFixed(2)}s`}
            sublabel="Query execution"
            icon={<Clock className="w-5 h-5 text-ford-light-blue" />}
          />
          <StatCard
            label="Data Exports"
            value={stats.totalExports.toLocaleString()}
            sublabel="CSV, JSON, Excel"
            icon={<FileText className="w-5 h-5 text-ford-orange" />}
          />
          <StatCard
            label="Avg Queries/Session"
            value={stats.avgQueriesPerSession.toFixed(1)}
            sublabel={`${stats.totalSessions} total sessions`}
            icon={<Users className="w-5 h-5 text-ford-blue-600" />}
          />
          <StatCard
            label="PDF Documents"
            value={stats.totalPDFs.toLocaleString()}
            sublabel={`${stats.totalPDFQueries} PDF queries`}
            icon={<FileText className="w-5 h-5 text-ford-red" />}
          />
        </div>
      </div>

      {/* IT Metrics */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-ford-blue dark:text-white mb-6 flex items-center font-ford">
          <Database className="w-7 h-7 mr-3 text-ford-blue" />
          IT & System Metrics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Consumption Breakdown */}
          <div className="card-ford p-6 hover:shadow-ford-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-ford-blue dark:text-white mb-4 font-ford">
              Token Consumption
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-ford-gray-600 dark:text-ford-gray-400 font-medium">Input Tokens</span>
                  <span className="text-sm font-bold text-ford-blue">{stats.totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-ford-gray-200 dark:bg-ford-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-ford-blue to-ford-blue-600 rounded-full h-3 shadow-sm transition-all duration-500"
                    style={{
                      width: `${(stats.totalInputTokens / stats.totalTokensConsumed) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-ford-gray-600 dark:text-ford-gray-400 font-medium">Output Tokens</span>
                  <span className="text-sm font-bold text-ford-light-blue">{stats.totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-ford-gray-200 dark:bg-ford-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-ford-light-blue to-ford-light-blue-600 rounded-full h-3 shadow-sm transition-all duration-500"
                    style={{
                      width: `${(stats.totalOutputTokens / stats.totalTokensConsumed) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t-2 border-ford-blue-200 dark:border-ford-blue-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-ford-blue dark:text-white flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Estimated Cost
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${stats.estimatedCost.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-ford-gray-500 dark:text-ford-gray-400 mt-1">
                  Based on Gemini 1.5 Pro pricing
                </p>
              </div>
            </div>
          </div>

          {/* Knowledge Graph Stats */}
          <div className="card-ford p-6 hover:shadow-ford-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-ford-blue dark:text-white mb-4 font-ford">
              Knowledge Graph
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-ford-blue-50 dark:bg-ford-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Network className="w-6 h-6 text-ford-light-blue" />
                  <span className="text-sm text-ford-gray-700 dark:text-ford-gray-300 font-medium">Total Entities</span>
                </div>
                <span className="text-2xl font-bold text-ford-blue dark:text-white">
                  {stats.totalGraphNodes.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-ford-blue-50 dark:bg-ford-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="w-6 h-6 text-ford-blue-600" />
                  <span className="text-sm text-ford-gray-700 dark:text-ford-gray-300 font-medium">Relationships</span>
                </div>
                <span className="text-2xl font-bold text-ford-blue dark:text-white">
                  {stats.totalGraphRelationships.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-ford-blue-50 dark:bg-ford-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-green-500" />
                  <span className="text-sm text-ford-gray-700 dark:text-ford-gray-300 font-medium">Documents Indexed</span>
                </div>
                <span className="text-2xl font-bold text-ford-blue dark:text-white">
                  {stats.totalGraphDocuments}
                </span>
              </div>
              <div className="pt-4 border-t-2 border-ford-blue-200 dark:border-ford-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ford-gray-600 dark:text-ford-gray-400 font-medium">Graph Queries</span>
                  <span className="text-2xl font-bold text-ford-light-blue dark:text-ford-light-blue-400">
                    {stats.totalGraphQueries.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trends */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-ford-blue dark:text-white mb-6 flex items-center font-ford">
          <TrendingUp className="w-7 h-7 mr-3 text-ford-blue" />
          Activity Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrendCard
            label="Last 24 Hours"
            value={stats.queriesLast24h.toLocaleString()}
            change={calculateChange(stats.queriesLast24h, stats.queriesLast7d / 7)}
          />
          <TrendCard
            label="Last 7 Days"
            value={stats.queriesLast7d.toLocaleString()}
            change={calculateChange(stats.queriesLast7d, stats.queriesLast30d / 4)}
          />
          <TrendCard
            label="Last 30 Days"
            value={stats.queriesLast30d.toLocaleString()}
            change={null}
          />
        </div>
      </div>

      {/* Query Type Distribution */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-ford-blue dark:text-white mb-6 flex items-center font-ford">
          <BarChart3 className="w-7 h-7 mr-3 text-ford-blue" />
          Query Type Distribution
        </h2>
        <div className="card-ford p-6">
          <div className="space-y-4">
            {stats.topQueryTypes.map((type, index) => (
              <div key={type.type}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-ford-blue dark:text-ford-gray-300 capitalize">
                    {type.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-ford-gray-600 dark:text-ford-gray-400 font-medium">
                    {type.count} ({((type.count / stats.totalQuestions) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-ford-gray-200 dark:bg-ford-gray-700 rounded-full h-4 shadow-inner">
                  <div
                    className={`rounded-full h-4 ${getFordBarColor(index)} shadow-sm transition-all duration-500`}
                    style={{ width: `${(type.count / stats.totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, gradient, subtitle }: MetricCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl shadow-ford-lg p-6 text-white hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className="opacity-90">{icon}</div>
      </div>
      <div className="text-4xl font-bold mb-2 font-ford">{value}</div>
      <div className="text-sm opacity-90 mb-2 font-medium">{title}</div>
      {subtitle && <div className="text-xs opacity-80 font-medium">{subtitle}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sublabel, icon }: StatCardProps) {
  return (
    <div className="card-ford p-6 hover:shadow-ford-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-ford-gray-600 dark:text-ford-gray-400 font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-ford-blue dark:text-white mb-1 font-ford">{value}</div>
      {sublabel && <div className="text-xs text-ford-gray-500 dark:text-ford-gray-400">{sublabel}</div>}
    </div>
  );
}

interface TrendCardProps {
  label: string;
  value: string;
  change: number | null;
}

function TrendCard({ label, value, change }: TrendCardProps) {
  return (
    <div className="card-ford p-6 hover:shadow-ford-lg transition-all duration-200">
      <div className="text-sm text-ford-gray-600 dark:text-ford-gray-400 mb-3 font-medium">{label}</div>
      <div className="text-4xl font-bold text-ford-blue dark:text-white mb-3 font-ford">{value}</div>
      {change !== null && (
        <div className={`text-sm flex items-center font-semibold ${change >= 0 ? 'text-green-600' : 'text-ford-red'}`}>
          <TrendingUp className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(change).toFixed(1)}% vs previous period
        </div>
      )}
    </div>
  );
}

// Helper Functions

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function getFordBarColor(index: number): string {
  const colors = [
    'bg-gradient-to-r from-ford-blue to-ford-blue-600',
    'bg-gradient-to-r from-ford-light-blue to-ford-light-blue-600',
    'bg-gradient-to-r from-ford-orange to-ford-orange-600',
    'bg-gradient-to-r from-green-500 to-green-600',
    'bg-gradient-to-r from-ford-red to-ford-red-600',
    'bg-gradient-to-r from-ford-blue-700 to-ford-blue-800',
  ];
  return colors[index % colors.length];
}

function getBarColor(index: number): string {
  return getFordBarColor(index);
}
