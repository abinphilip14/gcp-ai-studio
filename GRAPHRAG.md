# GraphRAG Documentation

## Overview

GraphRAG (Graph Retrieval Augmented Generation) enhances traditional RAG by building a knowledge graph from your documents. This enables more sophisticated queries that understand relationships between entities.

## How It Works

### 1. Entity Extraction
When you process a document, Gemini AI extracts:
- **PERSON**: People mentioned (executives, authors, researchers)
- **ORGANIZATION**: Companies, institutions, departments
- **LOCATION**: Cities, countries, addresses, regions
- **CONCEPT**: Technologies, methodologies, frameworks, ideas
- **DATE**: Time periods, dates, deadlines
- **METRIC**: KPIs, measurements, statistics
- **DOCUMENT**: The source document itself

### 2. Relationship Extraction
The system identifies connections between entities:
- **WORKS_FOR**: Person → Organization
- **LOCATED_IN**: Organization/Person → Location
- **MENTIONS**: Document → Entity
- **RELATED_TO**: Concept ↔ Concept
- **OCCURRED_ON**: Event → Date
- **PART_OF**: Entity → Parent Entity

### 3. Knowledge Graph Storage
All entities and relationships are stored in an in-memory graph database that supports:
- Fast traversal queries
- Multi-hop relationship discovery
- Pattern matching
- Graph analytics

### 4. Graph-Enhanced RAG
When you ask a question:
1. System extracts entities from your question
2. Finds matching entities in the knowledge graph
3. Traverses the graph to find related entities (2-hop)
4. Builds enriched context from the graph
5. Generates answer using Gemini with full graph context

## Quick Start

### Step 1: Upload PDFs
Navigate to the **PDF RAG** tab and upload your documents (research papers, reports, documentation).

### Step 2: Build Knowledge Graph
Go to the **GraphRAG** tab and click "Build Graph" for each document. The system will:
- Extract all entities
- Identify relationships
- Add them to the knowledge graph
- Show progress statistics

### Step 3: Query the Graph
Ask questions in natural language:

**Example Questions:**
- "What organizations are mentioned in the documents?"
- "How are concepts related to machine learning?"
- "Which people work for organizations in California?"
- "What technologies are related to data processing?"
- "Show me all entities connected to Project X"

### Step 4: Visualize
Switch to the **Visualize** tab to see:
- Interactive graph visualization
- Entity nodes colored by type
- Relationship edges labeled by type
- Different layout algorithms (Force, Hierarchical, Circular)

## Features

### Query Interface
- **Natural language input**: Ask questions in plain English
- **Document filtering**: Query specific documents or all documents
- **Entity highlighting**: See which entities are relevant to your query
- **Graph context**: View the knowledge graph paths used for the answer

### Visualization
- **Interactive graph**: Click nodes to see entity details
- **Multiple layouts**: Force-directed, hierarchical, or circular
- **Color-coded entities**: Different colors for each entity type
- **Relationship labels**: See how entities are connected
- **Fullscreen mode**: Expand visualization for detailed exploration

### Statistics
- **Entity counts**: Total entities by type
- **Relationship metrics**: Total connections in the graph
- **Document coverage**: How many documents are indexed
- **Type distribution**: Visual breakdown of entity types

## API Reference

### Build Graph from Document

**Endpoint:** `POST /api/graph/build`

**Request:**
```json
{
  "documentId": "pdf_123..."
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "pdf_123...",
  "documentName": "report.pdf",
  "entitiesAdded": 45,
  "relationshipsAdded": 67
}
```

### Query with GraphRAG

**Endpoint:** `POST /api/graph`

**Request:**
```json
{
  "question": "What organizations are mentioned?",
  "documentIds": ["pdf_123..."]
}
```

**Response:**
```json
{
  "answer": "The following organizations are mentioned...",
  "relevantEntities": [
    {
      "id": "entity_1",
      "name": "Acme Corp",
      "type": "ORGANIZATION",
      "properties": {}
    }
  ],
  "graphContext": "- Acme Corp (ORGANIZATION): Acme Corp → John Doe; ...",
  "sources": ["pdf_123..."]
}
```

### Get Graph Data

**Endpoint:** `GET /api/graph`

**Response:**
```json
{
  "stats": {
    "totalEntities": 150,
    "totalRelationships": 220,
    "entitiesByType": {
      "PERSON": 30,
      "ORGANIZATION": 25,
      "CONCEPT": 50
    },
    "documents": 5
  },
  "visualization": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### Clear Graph

**Endpoint:** `DELETE /api/graph`

**Response:**
```json
{
  "success": true
}
```

## Architecture

### Libraries Used
- **graphology**: In-memory graph database (lightweight, fast)
- **Gemini AI**: Entity and relationship extraction
- **Custom SVG Renderer**: Graph visualization

### Data Flow
```
PDF Upload → Text Extraction → Entity Extraction (Gemini) 
    → Relationship Extraction (Gemini) → Graph Storage
    → Query → Graph Traversal → Context Building → Answer (Gemini)
```

### Storage
- **In-Memory**: All graph data stored in RAM
- **Not persistent**: Graph rebuilds on server restart
- **Fast**: Sub-millisecond query times
- **Scalable**: Handles thousands of entities

## Advanced Usage

### Multi-Document Queries
Select multiple documents in the sidebar to query across them:
```
Question: "What common concepts appear in all these reports?"
```

### Deep Relationship Traversal
Ask questions that require multi-hop reasoning:
```
Question: "Find all people who work for organizations that are located in San Francisco"
```

### Entity-Centric Queries
Focus on specific entities:
```
Question: "What is everything we know about machine learning from these documents?"
```

### Comparative Analysis
```
Question: "Compare the methodologies used by different organizations"
```

## Best Practices

### 1. Document Quality
- Upload well-structured PDFs with clear text
- Avoid image-only PDFs (use OCR first)
- Include relevant metadata in document names

### 2. Graph Building
- Build graphs incrementally (one document at a time)
- Monitor the statistics after each build
- Allow time for entity extraction (30-60 seconds per document)

### 3. Query Formulation
- Be specific about what you're looking for
- Mention entity types when relevant
- Use relationship words ("connected to", "related to", "works for")

### 4. Performance
- Limit graph to <10,000 entities for best performance
- Use document filtering for large graph queries
- Clear and rebuild graph if it becomes stale

## Comparison: Traditional RAG vs GraphRAG

| Feature | Traditional RAG | GraphRAG |
|---------|----------------|----------|
| **Context** | Flat text chunks | Graph-structured knowledge |
| **Relationships** | Not explicitly modeled | First-class entities |
| **Multi-hop queries** | Not supported | Supported (2+ hops) |
| **Entity tracking** | Manual mention detection | Automatic entity linking |
| **Query types** | Simple lookup | Complex graph traversal |
| **Accuracy** | Good for direct questions | Better for relationship questions |

## Troubleshooting

### No entities extracted
- **Cause**: Document text may be unclear or too short
- **Solution**: Check PDF quality, try different documents

### Graph build takes too long
- **Cause**: Large documents or API rate limits
- **Solution**: Split large PDFs, wait between builds

### Visualization is cluttered
- **Cause**: Too many entities
- **Solution**: Use document filtering, try different layouts

### Queries return "not enough information"
- **Cause**: Relevant entities not in graph
- **Solution**: Build graphs for all relevant documents first

## Limitations

### Current Version
- **No persistence**: Graph cleared on server restart
- **In-memory only**: Limited by available RAM
- **No authentication**: Single-user mode
- **Entity accuracy**: Depends on Gemini extraction quality

### Future Enhancements
- [ ] Persistent storage (Neo4j, PostgreSQL with pg_graph)
- [ ] Entity deduplication across documents
- [ ] Community detection algorithms
- [ ] Graph embeddings for similarity search
- [ ] Export graph to standard formats (GraphML, GEXF)
- [ ] Real-time collaborative graph editing

## Examples

### Example 1: Research Paper Analysis
```
Upload: 5 machine learning research papers
Build: Graph from each paper
Query: "What are the common techniques used across these papers?"
Result: Graph shows CONCEPT nodes for techniques and RELATED_TO edges
```

### Example 2: Organization Network
```
Upload: Company reports, news articles
Build: Graph extracting organizations and people
Query: "Show me the network of companies mentioned in relation to AI"
Result: Visualization shows ORG nodes connected by shared CONCEPT nodes
```

### Example 3: Timeline Construction
```
Upload: Historical documents
Build: Graph with DATE and EVENT entities
Query: "What events occurred in 2023 and who was involved?"
Result: Answer lists events with OCCURRED_ON relationships to dates
```

## Performance Metrics

### Build Times (typical)
- 10-page PDF: ~30-45 seconds
- 50-page PDF: ~2-3 minutes
- 100-page PDF: ~5-6 minutes

### Query Times
- Simple entity lookup: <1 second
- 1-hop traversal: <2 seconds
- 2-hop traversal: <5 seconds
- Full graph analysis: <10 seconds

### Capacity
- Recommended: <5,000 entities
- Maximum tested: 10,000 entities
- Relationships: 2-3x entity count

## Support

For questions or issues:
1. Check this documentation
2. Review the example queries in the UI
3. Check graph statistics to verify data is loaded
4. Review console logs for errors

## Learn More

- [Gemini AI Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Knowledge Graphs Overview](https://en.wikipedia.org/wiki/Knowledge_graph)
- [Graph Theory Basics](https://en.wikipedia.org/wiki/Graph_theory)
- [Graphology Library](https://graphology.github.io/)
