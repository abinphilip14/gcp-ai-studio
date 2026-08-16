# Analytics & Landing Page Documentation

## Overview

The GCP AI Data App now includes a comprehensive analytics and landing page dashboard that tracks all user interactions, token consumption, and system metrics in real-time.

## Features

### Landing Page Dashboard

The landing page (`/` or Dashboard tab) displays:

#### Business Metrics (Top Cards)
- **Questions Answered**: Total queries across SQL, PDF RAG, and GraphRAG
- **Tokens Consumed**: Total AI tokens used with estimated cost
- **Active Users**: Unique users and sessions tracked
- **Knowledge Nodes**: Total entities in the knowledge graph

#### Business KPIs
- Total Queries (SQL + PDF + Graph combined)
- Success Rate (percentage of successful queries)
- Average Response Time (query execution time)
- Data Exports (CSV, JSON, Excel downloads)
- Average Queries per Session
- PDF Documents uploaded

#### IT & System Metrics

**Token Consumption Breakdown:**
- Input Tokens (sent to AI)
- Output Tokens (received from AI)
- Estimated Cost (based on Gemini 1.5 Pro pricing)

**Knowledge Graph Statistics:**
- Total Entities extracted
- Total Relationships mapped
- Documents Indexed in graph
- Graph Queries executed

#### Activity Trends
- Queries Last 24 Hours
- Queries Last 7 Days
- Queries Last 30 Days
- Trend indicators (% change)

#### Query Type Distribution
- Visual breakdown of query types
- Percentage distribution
- Bar charts by type

### Analytics Tracking

All user interactions are automatically tracked:

1. **SQL Queries** (`/api/query`)
   - Question asked
   - Tokens consumed (input + output)
   - Result count
   - Execution time
   - Success/failure status

2. **PDF Queries** (`/api/pdf/ask`)
   - Question asked
   - Tokens consumed
   - Execution time
   - Success/failure

3. **Graph Building** (`/api/graph/build`)
   - Document processed
   - Entities extracted
   - Relationships extracted
   - Tokens consumed (estimated)
   - Execution time

4. **Graph Queries** (`/api/graph`)
   - Question asked
   - Entities found
   - Tokens consumed
   - Execution time

5. **Data Exports** (`/api/export`)
   - Export format (CSV, JSON, Excel)
   - Row count
   - Session tracked

## Architecture

### Analytics Service (`lib/analytics.ts`)

**Core Functions:**
- `trackEvent()`: Record any analytics event
- `trackQuery()`: Track SQL query
- `trackPDFQuery()`: Track PDF RAG query
- `trackGraphBuild()`: Track graph construction
- `trackGraphQuery()`: Track graph query
- `trackExport()`: Track data export
- `getStats()`: Calculate comprehensive statistics
- `cleanupOldEvents()`: Remove events older than 90 days

**Data Storage:**
- Events stored in JSONL format (one JSON per line)
- Location: `./data/analytics/events.jsonl`
- Append-only for performance
- Automatic session ID generation

**Session Tracking:**
- Client-side: Uses localStorage
- Server-side: Generated per request
- Format: `session_<timestamp>_<random>`
- Persistent across page reloads

### API Endpoint (`/api/analytics`)

**GET /api/analytics**
Returns comprehensive statistics:
```json
{
  "totalQuestions": 150,
  "totalTokensConsumed": 50000,
  "estimatedCost": 12.50,
  "uniqueUsers": 25,
  "totalGraphNodes": 500,
  "successRate": 95.5,
  ...
}
```

**POST /api/analytics**
```json
{
  "action": "cleanup",
  "daysToKeep": 90
}
```

### Dashboard Component (`components/LandingDashboard.tsx`)

**Features:**
- Real-time data refresh (every 30 seconds)
- Animated counters (smooth count-up animation)
- Responsive grid layout
- Dark mode support
- Color-coded metrics
- Gradient backgrounds

**Metrics Cards:**
- MetricCard: Large animated counters with gradients
- StatCard: Standard stat display with icons
- TrendCard: Shows trends with % change indicators

## Setup

### 1. Create Analytics Directory

```bash
mkdir data\analytics
```

Or using PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "data\analytics"
```

### 2. Update Environment Variables

Already included in `.env.example`:
```env
ANALYTICS_PATH=./data/analytics
```

### 3. No Additional Installation

All dependencies already included:
- No external analytics services required
- No database setup needed
- Works out of the box

## Usage

### View Dashboard

1. Navigate to the app: `http://localhost:3000`
2. Click the **Dashboard** tab (or it's the default view)
3. View real-time metrics and statistics

### Metrics Auto-Update

The dashboard automatically:
- Fetches latest stats every 30 seconds
- Animates counters when data changes
- Highlights trends and changes

### Data Retention

By default:
- Events are kept for 90 days
- Automatic cleanup can be triggered via API
- Manual cleanup: `POST /api/analytics` with `action: "cleanup"`

## Metrics Explained

### Business Metrics

**Questions Answered**
- Total of SQL + PDF + Graph queries
- Shows activity level
- Key engagement metric

**Success Rate**
- Percentage of successful queries
- Indicates system reliability
- Target: >95%

**Average Response Time**
- Mean execution time across all queries
- Measured in seconds
- Lower is better (target: <3s)

**Average Queries/Session**
- User engagement indicator
- Higher = more engaged users
- Typical range: 2-10

### IT Metrics

**Token Consumption**
- Input: Tokens sent to Gemini AI
- Output: Tokens received from Gemini
- Total: Input + Output
- Cost: Based on Gemini 1.5 Pro pricing

**Cost Calculation**
```
Input Cost = (Input Tokens / 1000) × $0.00025
Output Cost = (Output Tokens / 1000) × $0.0005
Total Cost = Input Cost + Output Cost
```

**Knowledge Graph Metrics**
- Entities: Unique entities extracted
- Relationships: Connections between entities
- Documents: PDFs indexed in graph
- Density: Relationships / Entities ratio

### System Health

**Error Rate**
- Percentage of failed queries
- Target: <5%
- Monitor for spikes

**Active Users (24h)**
- Users with sessions in last 24 hours
- Indicates daily active usage

## Analytics Data Format

### Event Structure

```json
{
  "type": "query",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_1234567890_abc123",
  "userId": "optional-user-id",
  "metadata": {
    "tokensConsumed": 500,
    "inputTokens": 200,
    "outputTokens": 300,
    "resultCount": 10,
    "executionTime": 1250,
    "error": null
  }
}
```

### Event Types

- `query`: SQL query via BigQuery
- `pdf_query`: PDF RAG query
- `graph_build`: Knowledge graph construction
- `graph_query`: Graph-based query
- `export`: Data export

## Customization

### Add Custom Metrics

Edit `lib/analytics.ts` and add:

```typescript
export interface CustomMetric {
  name: string;
  value: number;
  timestamp: Date;
}

// Track custom metric
async trackCustomMetric(metric: CustomMetric) {
  await this.trackEvent({
    type: 'custom_metric',
    sessionId: 'system',
    metadata: { ...metric },
  });
}
```

### Modify Dashboard Layout

Edit `components/LandingDashboard.tsx`:

```typescript
// Add new metric card
<MetricCard
  title="Custom Metric"
  value={stats.customValue.toLocaleString()}
  icon={<CustomIcon className="w-8 h-8" />}
  gradient="from-pink-500 to-pink-600"
  subtitle="Custom subtitle"
/>
```

### Change Refresh Interval

In `LandingDashboard.tsx`:

```typescript
// Change from 30 seconds to 10 seconds
const interval = setInterval(fetchStats, 10000);
```

### Add User Authentication

Track user-specific metrics:

```typescript
// In API route
const userId = await getUserIdFromSession(request);

await analyticsService.trackQuery({
  sessionId,
  userId, // Add user ID
  ...otherData
});
```

## Performance Considerations

### Event Storage

- JSONL format is efficient for append operations
- Each event is ~200-500 bytes
- 1000 events ≈ 250 KB
- 10,000 events ≈ 2.5 MB

### Cleanup Recommendations

- Run cleanup monthly: `POST /api/analytics { "action": "cleanup", "daysToKeep": 90 }`
- Keep 30-90 days of data for trends
- Archive old data if needed for compliance

### Dashboard Performance

- Stats calculation is in-memory (fast)
- No database queries required
- Client-side animation reduces server load
- Auto-refresh every 30s (adjustable)

## Privacy & Compliance

### Data Collected

**Automatically Tracked:**
- Session IDs (anonymous)
- Timestamps
- Query types
- Token consumption
- Execution times
- Success/failure status

**NOT Tracked:**
- Query content (questions/answers)
- User PII (unless explicitly added)
- IP addresses
- Browser fingerprints

### GDPR Compliance

- No personal data collected by default
- Session IDs are anonymous
- Data retention: 90 days
- Manual data deletion supported

### Adding User Tracking

If you add user authentication:
1. Update privacy policy
2. Add data retention policy
3. Implement user data deletion
4. Add opt-out mechanism

## Monitoring & Alerts

### Key Metrics to Monitor

**Success Rate < 90%**
- Indicates system issues
- Check error logs
- Review failed queries

**Avg Response Time > 5s**
- Performance degradation
- Check Vertex AI quotas
- Review BigQuery costs

**Error Rate > 10%**
- Critical system issues
- Immediate investigation needed

**Token Cost Spike**
- Unusual usage pattern
- Potential abuse
- Review query patterns

### Setting Up Alerts (Manual)

Check stats dashboard regularly for:
- Success rate drops
- Cost increases
- Error rate spikes
- Unusual activity patterns

## Troubleshooting

### Dashboard Shows Zero Metrics

**Cause**: No analytics events tracked yet
**Solution**: 
- Make some queries first
- Check `data/analytics/events.jsonl` exists
- Verify analytics tracking is working

### Events Not Being Tracked

**Cause**: Analytics directory not created
**Solution**:
```bash
mkdir -p data/analytics
```

**Cause**: Write permission issues
**Solution**:
- Check directory permissions
- Ensure app can write to `data/analytics`

### Dashboard Not Updating

**Cause**: API endpoint failing
**Solution**:
- Check browser console for errors
- Verify `/api/analytics` returns data
- Check server logs

### High Token Costs

**Cause**: Too many large queries
**Solution**:
- Review query patterns
- Implement rate limiting
- Add query size limits
- Cache frequent queries

## Future Enhancements

Planned features:
- [ ] Export analytics data to CSV
- [ ] Historical trend charts
- [ ] User cohort analysis
- [ ] Query performance breakdown
- [ ] Cost forecasting
- [ ] Anomaly detection
- [ ] Email alerts for thresholds
- [ ] Integration with Google Analytics
- [ ] A/B testing support
- [ ] Custom dashboard widgets

## API Reference

### GET /api/analytics

Returns comprehensive analytics statistics.

**Response:**
```json
{
  "totalQuestions": 150,
  "totalPDFQueries": 50,
  "totalGraphQueries": 30,
  "totalExports": 20,
  "avgResponseTime": 2500,
  "successRate": 95.5,
  "totalTokensConsumed": 50000,
  "totalInputTokens": 20000,
  "totalOutputTokens": 30000,
  "estimatedCost": 12.50,
  "totalSessions": 45,
  "uniqueUsers": 25,
  "activeUsers24h": 12,
  "avgQueriesPerSession": 3.3,
  "totalPDFs": 15,
  "totalGraphNodes": 500,
  "totalGraphRelationships": 750,
  "totalGraphDocuments": 10,
  "totalErrors": 5,
  "errorRate": 3.3,
  "avgExecutionTime": 2500,
  "queriesLast24h": 25,
  "queriesLast7d": 100,
  "queriesLast30d": 150,
  "topQueryTypes": [
    { "type": "query", "count": 70 },
    { "type": "pdf_query", "count": 50 },
    { "type": "graph_query", "count": 30 }
  ],
  "recentActivity": [...]
}
```

### POST /api/analytics

Perform analytics actions.

**Cleanup Old Events:**
```json
{
  "action": "cleanup",
  "daysToKeep": 90
}
```

**Response:**
```json
{
  "success": true
}
```

## Related Documentation

- [Main README](./README.md)
- [GraphRAG Documentation](./GRAPHRAG.md)
- [Installation Guide](./GRAPHRAG_INSTALL.md)

## Support

For analytics issues:
1. Check this documentation
2. Verify analytics directory exists
3. Check API endpoint `/api/analytics`
4. Review browser console for errors
5. Check server logs for tracking errors
