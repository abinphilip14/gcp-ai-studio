# GCP AI Data App

A powerful web application that combines Google Cloud Platform's BigQuery, Vertex AI (Gemini), PDF knowledge base with RAG, and GraphRAG capabilities to provide an AI-powered data analysis and querying interface.

## Features

### 1. Natural Language to SQL
- Ask questions in plain English, get SQL queries and results
- AI-powered query generation using Gemini
- Automatic query validation and correction
- Query history and saved queries
- Export results to CSV, JSON, or Excel

### 2. PDF Knowledge Base (RAG)
- Upload PDFs and ask questions using RAG (Retrieval Augmented Generation)
- Semantic search with vector embeddings
- Document chunking for efficient retrieval
- Source citation for answers
- Support for multiple document formats

### 3. GraphRAG (Knowledge Graphs)
- **NEW**: AI-powered entity extraction from PDFs
- **NEW**: Relationship mapping between entities
- **NEW**: Interactive knowledge graph visualization
- **NEW**: Multi-hop graph traversal queries
- **NEW**: Entity types: Person, Organization, Location, Concept, Date, Metric
- **NEW**: Relationship types: Works For, Located In, Mentions, Related To, etc.

### 4. Data Dictionary
- Browse and search your BigQuery schemas
- Autocomplete for tables and columns
- View column metadata and descriptions
- Expandable/collapsible table views

### 5. Data Visualization & Export
- View results in interactive tables
- Export to multiple formats
- AI-generated insights from query results
- Follow-up question suggestions

## Tech Stack

- **Frontend**: React with Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **AI**: Google Vertex AI (Gemini 1.5 Pro)
- **Database**: Google BigQuery
- **PDF Processing**: pdf-parse with vector embeddings
- **Graph Database**: Graphology (in-memory)
- **Cloud**: Google Cloud Platform

## Prerequisites

### 1. Google Cloud Project Setup

You need a GCP project with the following:

#### Required APIs
- BigQuery API
- Vertex AI API
- Cloud Storage API (optional, for production PDF storage)

#### Service Account Permissions
Create a service account with these roles:
- `BigQuery Data Viewer`
- `BigQuery Job User`
- `Vertex AI User`

### 2. Local Requirements
- **Node.js** 18+ and npm
- **GCP Service Account JSON key**
- **BigQuery dataset** with data to query

## GCP Setup Instructions

### Step 1: Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: `gcp-ai-data-app` (or your preferred name)
4. Click "Create"
5. Note your **Project ID** (you'll need this later)

### Step 2: Enable Required APIs

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable bigquery.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

Or via Console:
1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - BigQuery API
   - Vertex AI API
   - Cloud Storage API

### Step 3: Create Service Account

#### Via Console:

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Service account details:
   - **Name**: `gcp-ai-data-app-sa`
   - **Description**: Service account for AI Data App
   - Click "Create and Continue"
4. Grant roles:
   - Click "Select a role"
   - Add `BigQuery Data Viewer`
   - Click "+ Add Another Role"
   - Add `BigQuery Job User`
   - Click "+ Add Another Role"
   - Add `Vertex AI User`
   - Click "Continue"
5. Click "Done"

#### Via Command Line:

```bash
# Create service account
gcloud iam service-accounts create gcp-ai-data-app-sa \
    --display-name="GCP AI Data App Service Account"

# Grant BigQuery Data Viewer role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataViewer"

# Grant BigQuery Job User role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/bigquery.jobUser"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### Step 4: Create and Download Service Account Key

#### Via Console:

1. In **Service Accounts**, find `gcp-ai-data-app-sa`
2. Click the three dots (⋮) → **Manage keys**
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. Save the downloaded file as `gcp-service-account.json`
7. Move it to your project directory:
   ```
   C:\Users\pabin\OneDrive - azureford\SDS AI Copilot\gcp-ai-data-app\gcp-service-account.json
   ```

#### Via Command Line:

```bash
# Create key
gcloud iam service-accounts keys create gcp-service-account.json \
    --iam-account=gcp-ai-data-app-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Move to project directory
move gcp-service-account.json "C:\Users\pabin\OneDrive - azureford\SDS AI Copilot\gcp-ai-data-app\"
```

### Step 5: Set Up BigQuery Dataset (Optional)

If you don't have a BigQuery dataset yet:

#### Via Console:

1. Go to **BigQuery** in GCP Console
2. Click your project name
3. Click **Create Dataset**
4. Dataset ID: `sample_dataset`
5. Location: `us-central1`
6. Click **Create Dataset**

#### Via Command Line:

```bash
# Create dataset
bq mk --dataset --location=us-central1 YOUR_PROJECT_ID:sample_dataset

# Load sample data (optional)
bq load --source_format=CSV \
    sample_dataset.sample_table \
    gs://cloud-samples-data/bigquery/sample-transactions/transactions.csv
```

### Step 6: Enable Vertex AI Gemini

1. Go to **Vertex AI** → **Model Garden**
2. Find **Gemini 1.5 Pro**
3. Click **Enable** if not already enabled
4. Note the available regions (use `us-central1` for this guide)

## Local Installation

### Step 1: Clone and Install Dependencies

```bash
cd "C:\Users\pabin\OneDrive - azureford\SDS AI Copilot\gcp-ai-data-app"
npm install
```

### Step 2: Install GraphRAG Dependencies

```bash
npm install graphology uuid
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
copy .env.example .env
```

Edit `.env` with your GCP details:

```env
# GCP Credentials
GCP_PROJECT_ID=your-actual-project-id
GCP_SERVICE_ACCOUNT_KEY_PATH=./gcp-service-account.json
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json

# Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-1.5-pro

# BigQuery Configuration
BIGQUERY_DATASET=sample_dataset

# App Configuration
NEXT_PUBLIC_APP_NAME=GCP AI Data App
NEXT_PUBLIC_MAX_QUERY_RESULTS=1000

# PDF Storage
PDF_STORAGE_PATH=./data/pdfs

# Vector Database
VECTOR_DB_PATH=./data/vectordb
```

**Important**: Replace `your-actual-project-id` with your GCP Project ID from Step 1.

### Step 4: Create Data Directories

```bash
mkdir data
mkdir data\pdfs
mkdir data\vectordb
```

Or using PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "data\pdfs"
New-Item -ItemType Directory -Force -Path "data\vectordb"
```

### Step 5: Verify GCP Credentials

Test your setup:

```bash
# Test gcloud authentication
gcloud auth list

# Test BigQuery access
bq ls

# Test Vertex AI access
gcloud ai models list --region=us-central1
```

### Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Natural Language SQL Queries

1. Navigate to the **SQL Query** tab
2. Select your BigQuery dataset
3. Type a question in plain English:
   ```
   What are the top 10 customers by revenue?
   Show me sales trends for the last 6 months
   Which products have the highest profit margins?
   ```
4. Click **Run Query**
5. View generated SQL, results, and AI insights
6. Export results to CSV/JSON if needed

### 2. PDF Knowledge Base (RAG)

1. Navigate to the **PDF RAG** tab
2. Upload PDF documents:
   - Research papers
   - Technical documentation
   - Reports
   - Business documents
3. Ask questions:
   ```
   What are the key findings in these documents?
   Summarize the methodology described
   What recommendations are made?
   ```
4. View answers with source citations

### 3. GraphRAG (Knowledge Graphs)

#### Build Knowledge Graph:

1. Navigate to the **GraphRAG** tab
2. Upload PDFs first (via PDF RAG tab)
3. Click **Build Graph** for each document
4. Wait for entity extraction (30-60 seconds per document)
5. Monitor statistics as the graph builds:
   - Total Entities
   - Total Relationships
   - Entity Types Distribution

#### Query the Graph:

Ask relationship-based questions:
```
What organizations are mentioned in the documents?
How are concepts related to machine learning?
Which people work for which organizations?
Show me all entities connected to Project X
Find all technologies related to data processing
```

#### Visualize the Graph:

1. Click the **Visualize** tab
2. See interactive graph with:
   - Colored nodes (entities by type)
   - Labeled edges (relationships)
   - Different layouts (Force, Hierarchical, Circular)
3. Click nodes to see entity details
4. Use fullscreen mode for detailed exploration

#### View Statistics:

1. Click the **Statistics** tab
2. See:
   - Entity distribution by type
   - Total entities and relationships
   - Documents in the graph

### 4. Data Dictionary

1. Navigate to the **Data Dictionary** tab
2. Select a dataset
3. Browse tables and columns
4. Search for specific tables/columns
5. View column types and descriptions
6. Expand/collapse table schemas

## Project Structure

```
gcp-ai-data-app/
├── app/
│   ├── api/                       # Next.js API routes
│   │   ├── datasets/             # Fetch BigQuery datasets
│   │   ├── data-dictionary/      # Fetch table schemas
│   │   ├── query/                # NL to SQL conversion
│   │   ├── pdf/                  # PDF upload and management
│   │   ├── export/               # Data export
│   │   └── graph/                # GraphRAG API
│   │       ├── route.ts          # Query graph, get stats
│   │       └── build/route.ts    # Build graph from PDFs
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page with tabs
│   └── globals.css               # Global styles
├── components/
│   ├── QueryInterface.tsx        # SQL query interface
│   ├── PDFInterface.tsx          # PDF Q&A interface
│   ├── DataDictionary.tsx        # Schema browser
│   ├── QueryHistoryPanel.tsx     # Query history sidebar
│   ├── ResultsTable.tsx          # Results display
│   ├── GraphRAGInterface.tsx     # GraphRAG main interface
│   └── GraphVisualizer.tsx       # Graph visualization
├── lib/
│   ├── bigquery.ts               # BigQuery service
│   ├── vertexai.ts               # Vertex AI service
│   ├── pdf.ts                    # PDF processing service
│   ├── export.ts                 # Data export utilities
│   ├── query-history.ts          # Query history management
│   ├── graph-storage.ts          # Graph database (in-memory)
│   └── graphrag.ts               # GraphRAG service
├── data/
│   ├── pdfs/                     # Uploaded PDFs
│   └── vectordb/                 # Vector embeddings
├── gcp-service-account.json      # GCP credentials (not in git)
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── README.md                     # This file
├── GRAPHRAG.md                   # GraphRAG documentation
├── GRAPHRAG_INSTALL.md           # GraphRAG installation
└── package.json                  # Dependencies
```

## Architecture

### Data Flow

#### SQL Query:
```
User Question → Gemini AI → SQL Generation → BigQuery Execution 
    → Results → Insights Generation → Display
```

#### PDF RAG:
```
PDF Upload → Text Extraction → Chunking → Embedding → Vector Storage
    → User Question → Semantic Search → Context Retrieval 
    → Gemini AI → Answer Generation
```

#### GraphRAG:
```
PDF Upload → Entity Extraction (Gemini) → Relationship Extraction (Gemini)
    → Graph Construction → Graph Storage → User Question 
    → Graph Traversal → Context Building → Gemini AI → Answer
```

## API Reference

### BigQuery APIs

#### Get Datasets
```
GET /api/datasets
Response: { datasets: string[] }
```

#### Get Data Dictionary
```
GET /api/data-dictionary?datasetId=...
Response: { dataDictionary: TableSchema[] }
```

#### Natural Language Query
```
POST /api/query
Body: { question: string, datasetId: string }
Response: { sql, explanation, results, insights, followUpQuestions }
```

### PDF APIs

#### Upload PDF
```
POST /api/pdf
Body: FormData with 'file' field
Response: { document: PDFDocument }
```

#### List PDFs
```
GET /api/pdf
Response: { documents: PDFDocument[] }
```

#### Ask Question (RAG)
```
POST /api/pdf/ask
Body: { question: string }
Response: { answer: string, sources: PDFDocument[] }
```

### GraphRAG APIs

#### Build Graph from Document
```
POST /api/graph/build
Body: { documentId: string }
Response: { success, documentId, entitiesAdded, relationshipsAdded }
```

#### Query Knowledge Graph
```
POST /api/graph
Body: { question: string, documentIds?: string[] }
Response: { answer, relevantEntities, graphContext, sources }
```

#### Get Graph Data
```
GET /api/graph
Response: { stats, visualization: { nodes, edges } }
```

#### Clear Graph
```
DELETE /api/graph
Response: { success: boolean }
```

### Export API

#### Export Results
```
POST /api/export
Body: { data: any[], format: 'csv'|'json'|'excel', filename?: string }
Response: File download
```

## GCP Cost Considerations

### Vertex AI (Gemini)
- **Input**: ~$0.00025 per 1K characters
- **Output**: ~$0.0005 per 1K characters
- **GraphRAG**: Higher costs due to entity/relationship extraction
- **Estimated**: $0.01-0.10 per query (simple to complex)

### BigQuery
- **Query**: ~$5 per TB of data scanned
- **Free tier**: 1 TB per month
- **Partitioned tables**: Reduce costs by scanning less data

### Cloud Storage (if used)
- **Storage**: $0.02 per GB per month
- **Operations**: Minimal costs for small apps

### Cost Optimization Tips

1. **Use partitioned tables** in BigQuery
2. **Limit query results** to needed data
3. **Cache frequent queries** (implement Redis)
4. **Batch GraphRAG builds** instead of real-time
5. **Use query dry-run** for validation
6. **Set budget alerts** in GCP Console

## Production Deployment

### Option 1: Google Cloud Run

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/gcp-ai-data-app
gcloud run deploy gcp-ai-data-app \
  --image gcr.io/YOUR_PROJECT_ID/gcp-ai-data-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT_ID,VERTEX_AI_LOCATION=us-central1
```

### Option 2: Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note**: For production PDF storage, use Google Cloud Storage instead of local filesystem.

### Option 3: Google Kubernetes Engine (GKE)

For high-availability and scaling:

```bash
# Create GKE cluster
gcloud container clusters create ai-data-app-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --region=us-central1

# Deploy application
kubectl apply -f k8s-deployment.yaml
```

## Security Best Practices

### Current Implementation (Development)
- ❌ No authentication
- ❌ Service account credentials in file
- ❌ LocalStorage for query history

### Production Recommendations

1. **Add Authentication**
   ```bash
   npm install next-auth @auth/core
   ```
   - Implement Google OAuth
   - Use NextAuth.js
   - Protect all API routes

2. **Secure Credentials**
   - Use **Secret Manager** for sensitive data
   - Implement **IAM-based authentication**
   - Use **Workload Identity** on GKE

3. **Add Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```
   - Prevent API abuse
   - Implement per-user quotas

4. **Data Access Control**
   - Implement **row-level security** in BigQuery
   - Add user-based dataset filtering
   - Use **VPC Service Controls**

5. **Audit Logging**
   - Log all queries and data access
   - Use **Cloud Audit Logs**
   - Monitor for suspicious activity

6. **Network Security**
   - Use **VPC** for private communication
   - Enable **Cloud Armor** for DDoS protection
   - Implement **SSL/TLS** for all connections

## Monitoring & Logging

### Enable Cloud Logging

```bash
# View application logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Create log-based metrics
gcloud logging metrics create query_count \
  --description="Count of SQL queries" \
  --log-filter='resource.type="cloud_run_revision" AND "POST /api/query"'
```

### Set Up Monitoring

1. Go to **Cloud Monitoring** in GCP Console
2. Create dashboards for:
   - API request rates
   - Error rates
   - Vertex AI usage
   - BigQuery query costs

### Set Budget Alerts

```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="AI Data App Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

## Troubleshooting

### "Failed to execute query"
**Cause**: BigQuery permissions or invalid SQL
**Solution**:
- Check service account has `BigQuery Job User` role
- Verify dataset exists and is accessible
- Check generated SQL syntax

### "Failed to generate SQL"
**Cause**: Vertex AI API issues
**Solution**:
- Ensure Vertex AI API is enabled
- Check Gemini API access in your region
- Verify service account has `Vertex AI User` role
- Check quota limits

### "PDF upload failed"
**Cause**: File permissions or size limits
**Solution**:
- Check `data/pdfs` directory exists and is writable
- Ensure file is valid PDF (not scanned image)
- Check file size limit (default 10MB)

### "GraphRAG entity extraction timeout"
**Cause**: Large documents or API rate limits
**Solution**:
- Split large PDFs into smaller sections
- Wait between builds (Gemini rate limits)
- Increase timeout in `next.config.js`

### "Connection error" / "Authentication failed"
**Cause**: Invalid GCP credentials
**Solution**:
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Check JSON key file is valid and not expired
- Ensure all required APIs are enabled
- Verify service account has correct roles

### "Out of memory" (GraphRAG)
**Cause**: Too many entities in graph
**Solution**:
- Clear graph periodically
- Limit to <5,000 entities
- Use document filtering for queries
- Consider Neo4j for larger graphs

## Limitations & Future Enhancements

### Current Limitations

1. **GraphRAG**: In-memory only (no persistence across restarts)
2. **PDF Storage**: Local filesystem (not scalable)
3. **Authentication**: None (development mode only)
4. **Multi-user**: Not supported (single-user mode)
5. **Real-time**: No streaming responses

### Planned Enhancements

- [ ] Persistent graph storage (Neo4j, PostgreSQL)
- [ ] Google Cloud Storage for PDFs
- [ ] User authentication (Google OAuth)
- [ ] Multi-user support with data isolation
- [ ] Streaming responses for long queries
- [ ] Advanced graph algorithms (community detection)
- [ ] Export knowledge graphs to GraphML/GEXF
- [ ] Support for more document types (Word, PowerPoint)
- [ ] Automated graph maintenance and cleanup
- [ ] Custom entity type definitions
- [ ] Graph embeddings for semantic search

## Learn More

### Documentation
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Gemini API Reference](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)

### GraphRAG Resources
- [GraphRAG Documentation](./GRAPHRAG.md)
- [GraphRAG Installation](./GRAPHRAG_INSTALL.md)
- [Knowledge Graphs](https://en.wikipedia.org/wiki/Knowledge_graph)
- [Graphology Library](https://graphology.github.io/)

## Support

For issues or questions:
1. Check this documentation
2. Review [GRAPHRAG.md](./GRAPHRAG.md) for GraphRAG-specific issues
3. Check [GCP Status](https://status.cloud.google.com/)
4. Review application logs in Cloud Console
5. Check service account permissions

## License

MIT

## Changelog

### v2.0.0 (Current)
- ✅ Added GraphRAG (Knowledge Graphs)
- ✅ Entity extraction with Gemini AI
- ✅ Interactive graph visualization
- ✅ Multi-hop graph traversal
- ✅ Relationship mapping
- ✅ Graph statistics dashboard

### v1.0.0
- ✅ Natural Language to SQL
- ✅ PDF Knowledge Base (RAG)
- ✅ Data Dictionary
- ✅ Query History
- ✅ Data Export
- ✅ BigQuery Integration
- ✅ Vertex AI Integration
#   g c p - a i - s t u d i o  
 