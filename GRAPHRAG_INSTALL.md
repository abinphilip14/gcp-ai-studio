# GraphRAG Implementation - Installation & Setup

## Dependencies to Install

Run this command in your project directory:

```bash
npm install graphology uuid
```

### Package Details

1. **graphology** (v0.25.4+)
   - In-memory graph database
   - Fast graph operations and traversals
   - BFS/DFS algorithms built-in

2. **uuid** (v9.0.0+)
   - Generate unique IDs for entities and relationships
   - Used throughout GraphRAG system

## Updated package.json

Add these to your existing `dependencies`:

```json
{
  "dependencies": {
    // ... existing dependencies ...
    "graphology": "^0.25.4",
    "uuid": "^9.0.1"
  }
}
```

## Files Created

### Core Services
- ✅ `lib/graph-storage.ts` - Graph database with entity/relationship management
- ✅ `lib/graphrag.ts` - GraphRAG service with AI-powered extraction

### API Routes
- ✅ `app/api/graph/route.ts` - Query and get graph data
- ✅ `app/api/graph/build/route.ts` - Build graph from documents

### UI Components
- ✅ `components/GraphVisualizer.tsx` - Interactive graph visualization
- ✅ `components/GraphRAGInterface.tsx` - Main GraphRAG interface

### Updated Files
- ✅ `app/page.tsx` - Added GraphRAG tab

### Documentation
- ✅ `GRAPHRAG.md` - Complete GraphRAG documentation
- ✅ `GRAPHRAG_GUIDE.md` - Implementation guide

## Installation Steps

1. **Install dependencies**:
```bash
cd "C:\Users\pabin\OneDrive - azureford\SDS AI Copilot\gcp-ai-data-app"
npm install graphology uuid
```

2. **Verify installation**:
```bash
npm list graphology uuid
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Test GraphRAG**:
   - Navigate to http://localhost:3000
   - Go to "PDF RAG" tab and upload a PDF
   - Go to "GraphRAG" tab
   - Click "Build Graph" on a document
   - Wait for extraction to complete
   - Ask a question about the document

## Environment Variables

No additional environment variables needed! GraphRAG uses the same Vertex AI configuration as the rest of the app.

Existing required env vars:
- `GCP_PROJECT_ID`
- `VERTEX_AI_LOCATION`
- `VERTEX_AI_MODEL`
- `GOOGLE_APPLICATION_CREDENTIALS`

## TypeScript Configuration

No changes needed to `tsconfig.json` - the existing configuration supports all GraphRAG features.

## Testing GraphRAG

### Quick Test Flow

1. **Upload a test PDF**:
   - Go to "PDF RAG" tab
   - Upload a technical document or research paper
   
2. **Build the graph**:
   - Go to "GraphRAG" tab
   - Click "Build Graph" next to your document
   - Watch the stats update (Entities, Relationships)
   
3. **Query the graph**:
   ```
   Example: "What organizations are mentioned in this document?"
   ```
   
4. **Visualize**:
   - Click the "Visualize" tab
   - See the knowledge graph
   - Try different layouts (Force, Hierarchical, Circular)

### Sample Questions

Once you've built a graph, try these questions:

**Entity-focused**:
- "List all people mentioned in these documents"
- "What organizations are discussed?"
- "What concepts are covered?"

**Relationship-focused**:
- "Which people work for which organizations?"
- "How are these concepts related?"
- "What locations are associated with these organizations?"

**Multi-hop**:
- "Find all people who work for organizations that use machine learning"
- "What technologies are connected to the main concepts?"

## Troubleshooting

### Import Errors

If you see errors like `Cannot find module 'graphology'`:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Type Errors

If TypeScript complains about graph types:
```bash
# Install type definitions
npm install --save-dev @types/uuid
```

### Runtime Errors

If the graph build fails:
1. Check that Vertex AI API is enabled
2. Verify your service account has permissions
3. Check console logs for Gemini API errors
4. Ensure the PDF has extractable text (not scanned images)

## Performance Optimization

### For Large Documents (100+ pages)

1. **Chunk processing**: Break large PDFs into sections
2. **Rate limiting**: Add delays between API calls
3. **Incremental builds**: Build one document at a time

### For Many Entities (1000+)

1. **Use document filtering**: Select specific docs for queries
2. **Limit visualization**: Show only relevant subgraphs
3. **Consider Neo4j**: Migrate to persistent graph database

## Next Steps

### Immediate
- [x] Install dependencies
- [x] Upload test document
- [x] Build first graph
- [x] Run test queries

### Short-term
- [ ] Tune entity extraction prompts for your domain
- [ ] Add custom entity types
- [ ] Create saved graph queries
- [ ] Export graph visualizations

### Long-term
- [ ] Implement Neo4j for persistence
- [ ] Add graph embeddings for semantic search
- [ ] Create automated graph maintenance
- [ ] Build domain-specific ontologies

## Additional Resources

- **Main Documentation**: `GRAPHRAG.md`
- **API Examples**: See `app/api/graph/` endpoints
- **Component Examples**: See `components/GraphRAGInterface.tsx`

## Support

If you encounter issues:
1. Check `GRAPHRAG.md` troubleshooting section
2. Review console logs in browser DevTools
3. Check server logs for API errors
4. Verify GCP credentials and permissions
