export interface QueryHistory {
  id: string;
  question: string;
  sql: string;
  timestamp: Date;
  resultCount: number;
  executionTime: number;
  saved: boolean;
  name?: string;
}

export class QueryHistoryService {
  private storageKey = 'query_history';
  private savedQueriesKey = 'saved_queries';

  /**
   * Add query to history
   */
  addToHistory(query: Omit<QueryHistory, 'id' | 'timestamp'>): QueryHistory {
    const historyItem: QueryHistory = {
      ...query,
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    if (typeof window !== 'undefined') {
      const history = this.getHistory();
      history.unshift(historyItem);
      
      // Keep only last 100 queries
      const trimmedHistory = history.slice(0, 100);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedHistory));
    }

    return historyItem;
  }

  /**
   * Get query history
   */
  getHistory(limit?: number): QueryHistory[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      const history: QueryHistory[] = stored ? JSON.parse(stored) : [];
      
      // Convert timestamp strings back to Date objects
      const parsed = history.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));

      return limit ? parsed.slice(0, limit) : parsed;
    } catch (error) {
      console.error('Error reading query history:', error);
      return [];
    }
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Save a query for later use
   */
  saveQuery(queryId: string, name: string): void {
    if (typeof window === 'undefined') return;

    const history = this.getHistory();
    const query = history.find(q => q.id === queryId);
    
    if (query) {
      query.saved = true;
      query.name = name;
      
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      
      const savedQueries = this.getSavedQueries();
      savedQueries.push(query);
      localStorage.setItem(this.savedQueriesKey, JSON.stringify(savedQueries));
    }
  }

  /**
   * Get saved queries
   */
  getSavedQueries(): QueryHistory[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.savedQueriesKey);
      const queries: QueryHistory[] = stored ? JSON.parse(stored) : [];
      
      return queries.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Error reading saved queries:', error);
      return [];
    }
  }

  /**
   * Remove saved query
   */
  removeSavedQuery(queryId: string): void {
    if (typeof window === 'undefined') return;

    const savedQueries = this.getSavedQueries().filter(q => q.id !== queryId);
    localStorage.setItem(this.savedQueriesKey, JSON.stringify(savedQueries));
    
    // Update history
    const history = this.getHistory();
    const query = history.find(q => q.id === queryId);
    if (query) {
      query.saved = false;
      query.name = undefined;
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    }
  }

  /**
   * Search history
   */
  searchHistory(searchTerm: string): QueryHistory[] {
    const history = this.getHistory();
    const lowerSearch = searchTerm.toLowerCase();
    
    return history.filter(query =>
      query.question.toLowerCase().includes(lowerSearch) ||
      query.sql.toLowerCase().includes(lowerSearch) ||
      query.name?.toLowerCase().includes(lowerSearch)
    );
  }
}

export const queryHistoryService = new QueryHistoryService();
