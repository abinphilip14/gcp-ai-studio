import fs from 'fs/promises';
import path from 'path';

export interface AnalyticsEvent {
  type: 'query' | 'pdf_upload' | 'pdf_query' | 'graph_build' | 'graph_query' | 'export';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata: {
    tokensConsumed?: number;
    inputTokens?: number;
    outputTokens?: number;
    resultCount?: number;
    executionTime?: number;
    documentId?: string;
    entitiesExtracted?: number;
    relationshipsExtracted?: number;
    format?: string;
    error?: string;
  };
}

export interface AnalyticsStats {
  // Business Metrics
  totalQuestions: number;
  totalPDFQueries: number;
  totalGraphQueries: number;
  totalExports: number;
  avgResponseTime: number;
  successRate: number;
  
  // Token Consumption
  totalTokensConsumed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  
  // User Metrics
  totalSessions: number;
  uniqueUsers: number;
  activeUsers24h: number;
  avgQueriesPerSession: number;
  
  // Knowledge Base Metrics
  totalPDFs: number;
  totalGraphNodes: number;
  totalGraphRelationships: number;
  totalGraphDocuments: number;
  
  // System Metrics
  totalErrors: number;
  errorRate: number;
  avgExecutionTime: number;
  
  // Time-based
  queriesLast24h: number;
  queriesLast7d: number;
  queriesLast30d: number;
  
  // Top Queries
  topQueryTypes: Array<{ type: string; count: number }>;
  recentActivity: AnalyticsEvent[];
}

export class AnalyticsService {
  private analyticsPath: string;
  private eventsFile: string;
  private statsFile: string;

  constructor() {
    this.analyticsPath = process.env.ANALYTICS_PATH || './data/analytics';
    this.eventsFile = path.join(this.analyticsPath, 'events.jsonl');
    this.statsFile = path.join(this.analyticsPath, 'stats.json');
    this.ensureAnalyticsDirectory();
  }

  private async ensureAnalyticsDirectory() {
    try {
      await fs.mkdir(this.analyticsPath, { recursive: true });
    } catch (error) {
      console.error('Error creating analytics directory:', error);
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    try {
      // Append to events file (JSONL format)
      const eventLine = JSON.stringify(fullEvent) + '\n';
      await fs.appendFile(this.eventsFile, eventLine);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track SQL query
   */
  async trackQuery(data: {
    sessionId: string;
    userId?: string;
    tokensConsumed: number;
    inputTokens: number;
    outputTokens: number;
    resultCount: number;
    executionTime: number;
    success: boolean;
  }): Promise<void> {
    await this.trackEvent({
      type: 'query',
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: {
        tokensConsumed: data.tokensConsumed,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        resultCount: data.resultCount,
        executionTime: data.executionTime,
        error: data.success ? undefined : 'Query failed',
      },
    });
  }

  /**
   * Track PDF query (RAG)
   */
  async trackPDFQuery(data: {
    sessionId: string;
    userId?: string;
    tokensConsumed: number;
    inputTokens: number;
    outputTokens: number;
    executionTime: number;
    success: boolean;
  }): Promise<void> {
    await this.trackEvent({
      type: 'pdf_query',
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: {
        tokensConsumed: data.tokensConsumed,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        executionTime: data.executionTime,
        error: data.success ? undefined : 'PDF query failed',
      },
    });
  }

  /**
   * Track graph build
   */
  async trackGraphBuild(data: {
    sessionId: string;
    userId?: string;
    documentId: string;
    tokensConsumed: number;
    entitiesExtracted: number;
    relationshipsExtracted: number;
    executionTime: number;
    success: boolean;
  }): Promise<void> {
    await this.trackEvent({
      type: 'graph_build',
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: {
        documentId: data.documentId,
        tokensConsumed: data.tokensConsumed,
        entitiesExtracted: data.entitiesExtracted,
        relationshipsExtracted: data.relationshipsExtracted,
        executionTime: data.executionTime,
        error: data.success ? undefined : 'Graph build failed',
      },
    });
  }

  /**
   * Track graph query
   */
  async trackGraphQuery(data: {
    sessionId: string;
    userId?: string;
    tokensConsumed: number;
    inputTokens: number;
    outputTokens: number;
    entitiesFound: number;
    executionTime: number;
    success: boolean;
  }): Promise<void> {
    await this.trackEvent({
      type: 'graph_query',
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: {
        tokensConsumed: data.tokensConsumed,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        resultCount: data.entitiesFound,
        executionTime: data.executionTime,
        error: data.success ? undefined : 'Graph query failed',
      },
    });
  }

  /**
   * Track data export
   */
  async trackExport(data: {
    sessionId: string;
    userId?: string;
    format: string;
    rowCount: number;
  }): Promise<void> {
    await this.trackEvent({
      type: 'export',
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: {
        format: data.format,
        resultCount: data.rowCount,
      },
    });
  }

  /**
   * Get all events
   */
  private async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      const content = await fs.readFile(this.eventsFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      return lines.map(line => {
        const event = JSON.parse(line);
        event.timestamp = new Date(event.timestamp);
        return event;
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate comprehensive statistics
   */
  async getStats(graphStats?: {
    totalEntities: number;
    totalRelationships: number;
    documents: number;
  }): Promise<AnalyticsStats> {
    const events = await this.getEvents();
    const now = Date.now();
    const day24h = 24 * 60 * 60 * 1000;
    const day7 = 7 * day24h;
    const day30 = 30 * day24h;

    // Filter by time
    const events24h = events.filter(e => now - e.timestamp.getTime() < day24h);
    const events7d = events.filter(e => now - e.timestamp.getTime() < day7);
    const events30d = events.filter(e => now - e.timestamp.getTime() < day30);

    // Count by type
    const queryEvents = events.filter(e => e.type === 'query');
    const pdfQueryEvents = events.filter(e => e.type === 'pdf_query');
    const graphQueryEvents = events.filter(e => e.type === 'graph_query');
    const graphBuildEvents = events.filter(e => e.type === 'graph_build');
    const exportEvents = events.filter(e => e.type === 'export');

    // Token consumption
    const totalInputTokens = events.reduce((sum, e) => sum + (e.metadata.inputTokens || 0), 0);
    const totalOutputTokens = events.reduce((sum, e) => sum + (e.metadata.outputTokens || 0), 0);
    const totalTokensConsumed = totalInputTokens + totalOutputTokens;

    // Estimate cost (Gemini 1.5 Pro pricing)
    const inputCost = (totalInputTokens / 1000) * 0.00025;
    const outputCost = (totalOutputTokens / 1000) * 0.0005;
    const estimatedCost = inputCost + outputCost;

    // User metrics
    const uniqueSessions = new Set(events.map(e => e.sessionId));
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId));
    const activeSessions24h = new Set(events24h.map(e => e.sessionId));

    // Success rate
    const totalWithErrors = events.filter(e => e.metadata.error).length;
    const successRate = events.length > 0 ? ((events.length - totalWithErrors) / events.length) * 100 : 100;

    // Execution time
    const executionTimes = events
      .filter(e => e.metadata.executionTime)
      .map(e => e.metadata.executionTime!);
    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
      : 0;

    // Top query types
    const typeCounts = new Map<string, number>();
    events.forEach(e => {
      typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
    });
    const topQueryTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Recent activity (last 10 events)
    const recentActivity = events.slice(-10).reverse();

    // PDF count (from events)
    const uniquePDFs = new Set(
      events.filter(e => e.metadata.documentId).map(e => e.metadata.documentId)
    );

    return {
      // Business Metrics
      totalQuestions: queryEvents.length + pdfQueryEvents.length + graphQueryEvents.length,
      totalPDFQueries: pdfQueryEvents.length,
      totalGraphQueries: graphQueryEvents.length,
      totalExports: exportEvents.length,
      avgResponseTime: avgExecutionTime,
      successRate,

      // Token Consumption
      totalTokensConsumed,
      totalInputTokens,
      totalOutputTokens,
      estimatedCost,

      // User Metrics
      totalSessions: uniqueSessions.size,
      uniqueUsers: uniqueUsers.size,
      activeUsers24h: activeSessions24h.size,
      avgQueriesPerSession: uniqueSessions.size > 0
        ? (queryEvents.length + pdfQueryEvents.length + graphQueryEvents.length) / uniqueSessions.size
        : 0,

      // Knowledge Base Metrics
      totalPDFs: uniquePDFs.size,
      totalGraphNodes: graphStats?.totalEntities || 0,
      totalGraphRelationships: graphStats?.totalRelationships || 0,
      totalGraphDocuments: graphStats?.documents || 0,

      // System Metrics
      totalErrors: totalWithErrors,
      errorRate: events.length > 0 ? (totalWithErrors / events.length) * 100 : 0,
      avgExecutionTime,

      // Time-based
      queriesLast24h: events24h.filter(e => ['query', 'pdf_query', 'graph_query'].includes(e.type)).length,
      queriesLast7d: events7d.filter(e => ['query', 'pdf_query', 'graph_query'].includes(e.type)).length,
      queriesLast30d: events30d.filter(e => ['query', 'pdf_query', 'graph_query'].includes(e.type)).length,

      // Top Queries
      topQueryTypes,
      recentActivity,
    };
  }

  /**
   * Get session ID from request headers or generate new one
   */
  static getSessionId(request?: any): string {
    if (typeof window !== 'undefined') {
      // Client-side
      let sessionId = localStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    } else {
      // Server-side - use request headers or generate
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Clear old events (keep last 90 days)
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<void> {
    try {
      const events = await this.getEvents();
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const recentEvents = events.filter(e => e.timestamp.getTime() > cutoffTime);
      
      const content = recentEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(this.eventsFile, content);
    } catch (error) {
      console.error('Error cleaning up events:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
