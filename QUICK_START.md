# Quick Start Guide

## Complete Setup in 10 Steps

### Step 1: Install Dependencies

```bash
cd "C:\Users\pabin\OneDrive - azureford\SDS AI Copilot\gcp-ai-data-app"
npm install
npm install graphology uuid
```

### Step 2: Create Data Directories

```powershell
New-Item -ItemType Directory -Force -Path "data\pdfs"
New-Item -ItemType Directory -Force -Path "data\vectordb"
New-Item -ItemType Directory -Force -Path "data\analytics"
```

### Step 3: Set Up GCP (if not done)

See detailed instructions in [README.md](./README.md#gcp-setup-instructions)

Quick version:
```bash
# Enable APIs
gcloud services enable bigquery.googleapis.com
gcloud services enable aiplatform.googleapis.com

# Create service account
gcloud iam service-accounts create gcp-ai-data-app-sa --display-name="GCP AI Data App"

# Grant roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Create key
gcloud iam service-accounts keys create gcp-service-account.json \
  --iam-account=gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 4: Configure Environment

```bash
copy .env.example .env
```

Edit `.env`:
```env
GCP_PROJECT_ID=your-actual-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-1.5-pro
BIGQUERY_DATASET=your_dataset_name
```

### Step 5: Verify GCP Credentials

```bash
# Test BigQuery
bq ls

# Test service account
gcloud auth activate-service-account --key-file=gcp-service-account.json
```

### Step 6: Run Development Server

```bash
npm run dev
```

### Step 7: Open Application

Navigate to: [http://localhost:3000](http://localhost:3000)

### Step 8: View Dashboard

The landing page shows:
- ✅ Live metrics (will be 0 initially)
- ✅ Animated counters
- ✅ Business and IT metrics
- ✅ System statistics

### Step 9: Test Features

#### Test SQL Query:
1. Click **SQL Query** tab
2. Select a BigQuery dataset
3. Ask: "What tables are available?"
4. View results and analytics update

#### Test PDF RAG:
1. Click **PDF RAG** tab
2. Upload a PDF document
3. Ask a question about it
4. See answer with sources

#### Test GraphRAG:
1. Upload PDF first (if not done)
2. Click **GraphRAG** tab
3. Click **Build Graph** on a document
4. Wait for entities to extract (~30-60s)
5. Ask: "What entities are in this document?"
6. View graph visualization

### Step 10: Monitor Analytics

1. Return to **Dashboard** tab
2. See metrics update:
   - Questions answered
   - Tokens consumed
   - Active users
   - Knowledge nodes
3. Watch animated counters
4. Check cost estimates

## Feature Overview

### 🏠 Dashboard (Landing Page)
**What it shows:**
- Total questions answered
- AI tokens consumed with cost
- Active users and sessions
- Knowledge graph nodes
- Success rate and performance
- Query type distribution
- Activity trends

**Business Value:**
- Real-time usage monitoring
- Cost tracking and forecasting
- User engagement metrics
- System health indicators

### 🔍 SQL Query
**What it does:**
- Natural language to SQL
- Execute on BigQuery
- Get AI-generated insights
- Suggest follow-up questions
- Export results (CSV/JSON/Excel)

**Example:**
```
Question: "What are the top 10 customers by revenue?"
→ Generates SQL
→ Executes query
→ Shows results
→ Provides insights
```

### 📄 PDF RAG
**What it does:**
- Upload PDF documents
- AI-powered Q&A
- Semantic search
- Source citations

**Example:**
```
Upload: research_paper.pdf
Question: "What methodology was used?"
→ Searches PDF
→ Finds relevant sections
→ Generates answer with page references
```

### 🕸️ GraphRAG
**What it does:**
- Extract entities from PDFs
- Map relationships
- Build knowledge graph
- Visual graph exploration
- Multi-hop queries

**Example:**
```
Upload: company_reports.pdf
Build Graph → Extracts entities:
- Organizations: Acme Corp, XYZ Inc
- People: John Doe, Jane Smith
- Concepts: AI, Machine Learning
- Relationships: John works for Acme Corp

Query: "What organizations use AI?"
→ Traverses graph
→ Finds connections
→ Provides answer with context
```

### 📚 Data Dictionary
**What it shows:**
- BigQuery dataset schemas
- Table structures
- Column types and descriptions
- Searchable metadata

## Testing Checklist

- [ ] Dashboard loads and shows metrics
- [ ] SQL query works and updates analytics
- [ ] PDF upload succeeds
- [ ] PDF Q&A works
- [ ] Graph builds from PDF
- [ ] Graph query works
- [ ] Graph visualization displays
- [ ] Data export works (CSV/JSON)
- [ ] Analytics counters animate
- [ ] Token costs track correctly

## Common First-Time Issues

### "Module not found: graphology"
**Solution:**
```bash
npm install graphology uuid
```

### "Permission denied: data/analytics"
**Solution:**
```powershell
New-Item -ItemType Directory -Force -Path "data\analytics"
```

### "Failed to execute query"
**Solution:**
- Check GCP credentials are valid
- Verify BigQuery dataset exists
- Ensure service account has roles

### "Dashboard shows all zeros"
**Solution:**
- Make some queries first
- Analytics track after first use
- Refresh page after queries

## Next Steps

### For Business Users:
1. ✅ Upload your PDF documents
2. ✅ Build knowledge graphs
3. ✅ Start querying your data
4. ✅ Monitor usage on dashboard
5. ✅ Track costs and ROI

### For IT Users:
1. ✅ Review analytics metrics
2. ✅ Monitor token consumption
3. ✅ Set up BigQuery datasets
4. ✅ Configure security (see README)
5. ✅ Plan for production deployment

### For Developers:
1. ✅ Explore the codebase
2. ✅ Review API endpoints
3. ✅ Customize entity types
4. ✅ Add custom analytics
5. ✅ Extend GraphRAG features

## Documentation Index

- **[README.md](./README.md)** - Complete documentation
- **[GRAPHRAG.md](./GRAPHRAG.md)** - GraphRAG features
- **[GRAPHRAG_INSTALL.md](./GRAPHRAG_INSTALL.md)** - GraphRAG setup
- **[ANALYTICS.md](./ANALYTICS.md)** - Analytics & dashboard
- **[QUICK_START.md](./QUICK_START.md)** - This file

## Support

Having issues? Check:
1. This quick start guide
2. Main README.md troubleshooting section
3. ANALYTICS.md for dashboard issues
4. GRAPHRAG.md for graph issues
5. GCP Console for cloud issues

## What's Included

### Files Created (38 total):

**Core Services (7):**
- `lib/bigquery.ts` - BigQuery integration
- `lib/vertexai.ts` - Gemini AI integration
- `lib/pdf.ts` - PDF processing
- `lib/graph-storage.ts` - Knowledge graph
- `lib/graphrag.ts` - GraphRAG service
- `lib/export.ts` - Data export
- `lib/analytics.ts` - Analytics tracking
- `lib/query-history.ts` - Query history

**API Routes (9):**
- `app/api/datasets/route.ts`
- `app/api/data-dictionary/route.ts`
- `app/api/query/route.ts`
- `app/api/pdf/route.ts`
- `app/api/pdf/ask/route.ts`
- `app/api/graph/route.ts`
- `app/api/graph/build/route.ts`
- `app/api/export/route.ts`
- `app/api/analytics/route.ts`

**UI Components (7):**
- `components/QueryInterface.tsx`
- `components/PDFInterface.tsx`
- `components/DataDictionary.tsx`
- `components/GraphRAGInterface.tsx`
- `components/GraphVisualizer.tsx`
- `components/QueryHistoryPanel.tsx`
- `components/ResultsTable.tsx`
- `components/LandingDashboard.tsx`

**Configuration (6):**
- `package.json`
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.ts`
- `.env.example`
- `.gitignore`

**Documentation (6):**
- `README.md`
- `GRAPHRAG.md`
- `GRAPHRAG_INSTALL.md`
- `GRAPHRAG_GUIDE.md`
- `ANALYTICS.md`
- `QUICK_START.md`

**App Structure (3):**
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

## Estimated Setup Time

- **Basic setup**: 15 minutes
- **GCP configuration**: 20 minutes
- **First test**: 5 minutes
- **GraphRAG test**: 10 minutes
- **Total**: ~50 minutes

## Success Indicators

You'll know it's working when:
- ✅ Dashboard shows live metrics
- ✅ SQL queries execute successfully
- ✅ PDF upload and Q&A works
- ✅ Knowledge graph builds
- ✅ Analytics counters increment
- ✅ Cost tracking shows estimates
- ✅ All tabs are functional

## Production Checklist

Before deploying to production:
- [ ] Add authentication (Google OAuth)
- [ ] Set up Cloud Storage for PDFs
- [ ] Configure Secret Manager
- [ ] Enable Cloud Logging
- [ ] Set up monitoring alerts
- [ ] Configure budget alerts
- [ ] Add rate limiting
- [ ] Enable HTTPS
- [ ] Review security settings
- [ ] Test backup procedures

See [README.md - Production Deployment](./README.md#production-deployment) for details.

---

**Ready to start?** Run `npm run dev` and open http://localhost:3000! 🚀
