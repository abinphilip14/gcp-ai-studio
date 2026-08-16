import { VertexAI } from '@google-cloud/vertexai';
import { graphStorage, Entity, Relationship, EntityType, RelationType } from './graph-storage';
import { v4 as uuidv4 } from 'uuid';

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  properties?: Record<string, any>;
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  type: RelationType;
  properties?: Record<string, any>;
}

export interface GraphRAGResult {
  answer: string;
  relevantEntities: Entity[];
  graphContext: string;
  sources: string[];
}

export class GraphRAGService {
  private vertexAI: VertexAI;
  private model: any;

  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION!,
    });

    this.model = this.vertexAI.getGenerativeModel({
      model: process.env.VERTEX_AI_MODEL || 'gemini-1.5-pro',
    });
  }

  /**
   * Extract entities from text using Gemini
   */
  async extractEntities(text: string, documentId: string): Promise<ExtractedEntity[]> {
    const prompt = `Extract entities from the following text. Identify:
- PERSON: Names of people
- ORGANIZATION: Companies, institutions, organizations
- LOCATION: Places, cities, countries, addresses
- CONCEPT: Key ideas, technologies, methodologies, frameworks
- DATE: Temporal information (dates, time periods)
- METRIC: Numbers, KPIs, measurements with context

Text:
${text.substring(0, 8000)} ${text.length > 8000 ? '...[truncated]' : ''}

Return a JSON array of entities in this format:
[
  {
    "name": "entity name",
    "type": "PERSON|ORGANIZATION|LOCATION|CONCEPT|DATE|METRIC",
    "properties": {
      "context": "brief context or description",
      "mentions": 1
    }
  }
]

Only return the JSON array, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in entity extraction response');
        return [];
      }

      const entities: ExtractedEntity[] = JSON.parse(jsonMatch[0]);
      return entities.filter(e => e.name && e.type);
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  /**
   * Extract relationships between entities
   */
  async extractRelationships(
    text: string,
    entities: ExtractedEntity[]
  ): Promise<ExtractedRelationship[]> {
    if (entities.length < 2) return [];

    const entityList = entities.map(e => `${e.name} (${e.type})`).join(', ');
    
    const prompt = `Given these entities: ${entityList}

Analyze this text and identify relationships between the entities:
${text.substring(0, 6000)} ${text.length > 6000 ? '...[truncated]' : ''}

Identify relationships using these types:
- WORKS_FOR: Person works for Organization
- LOCATED_IN: Organization/Person located in Location
- MENTIONS: Document mentions Entity
- RELATED_TO: Concept related to another Concept
- OCCURRED_ON: Event occurred on Date
- PART_OF: Entity is part of another Entity

Return a JSON array:
[
  {
    "source": "source entity name",
    "target": "target entity name",
    "type": "RELATIONSHIP_TYPE",
    "properties": {
      "confidence": 0.9,
      "context": "brief context"
    }
  }
]

Only return the JSON array, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.candidates[0].content.parts[0].text;
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in relationship extraction response');
        return [];
      }

      const relationships: ExtractedRelationship[] = JSON.parse(jsonMatch[0]);
      return relationships.filter(r => r.source && r.target && r.type);
    } catch (error) {
      console.error('Error extracting relationships:', error);
      return [];
    }
  }

  /**
   * Build knowledge graph from document
   */
  async buildGraphFromDocument(
    documentId: string,
    documentName: string,
    text: string
  ): Promise<{ entitiesAdded: number; relationshipsAdded: number }> {
    console.log(`Building graph for document: ${documentName}`);

    // Add document as entity
    const docEntity: Entity = {
      id: `doc_${documentId}`,
      type: 'DOCUMENT',
      name: documentName,
      properties: { documentId },
      sourceDocumentId: documentId,
    };
    graphStorage.addEntity(docEntity);

    // Extract entities
    const extractedEntities = await this.extractEntities(text, documentId);
    console.log(`Extracted ${extractedEntities.length} entities`);

    // Add entities to graph
    const entityMap = new Map<string, string>(); // name -> id
    for (const extracted of extractedEntities) {
      const entityId = uuidv4();
      const entity: Entity = {
        id: entityId,
        type: extracted.type,
        name: extracted.name,
        properties: extracted.properties || {},
        sourceDocumentId: documentId,
      };
      
      graphStorage.addEntity(entity);
      entityMap.set(extracted.name.toLowerCase(), entityId);

      // Add MENTIONS relationship from document to entity
      graphStorage.addRelationship({
        id: uuidv4(),
        type: 'MENTIONS',
        source: docEntity.id,
        target: entityId,
        properties: {},
      });
    }

    // Extract relationships
    const extractedRelationships = await this.extractRelationships(text, extractedEntities);
    console.log(`Extracted ${extractedRelationships.length} relationships`);

    // Add relationships to graph
    let relationshipsAdded = 0;
    for (const rel of extractedRelationships) {
      const sourceId = entityMap.get(rel.source.toLowerCase());
      const targetId = entityMap.get(rel.target.toLowerCase());

      if (sourceId && targetId) {
        graphStorage.addRelationship({
          id: uuidv4(),
          type: rel.type,
          source: sourceId,
          target: targetId,
          properties: rel.properties || {},
        });
        relationshipsAdded++;
      }
    }

    return {
      entitiesAdded: extractedEntities.length,
      relationshipsAdded,
    };
  }

  /**
   * Query using GraphRAG - enhanced RAG with knowledge graph
   */
  async queryWithGraph(
    question: string,
    documentIds?: string[]
  ): Promise<GraphRAGResult> {
    console.log('Querying with GraphRAG:', question);

    // Step 1: Extract entities from the question
    const questionEntities = await this.extractEntities(question, 'query');
    console.log('Question entities:', questionEntities);

    // Step 2: Find relevant entities in the graph
    const relevantEntities: Entity[] = [];
    const entityNames = new Set<string>();

    for (const qEntity of questionEntities) {
      const matches = graphStorage.searchEntities(qEntity.name, qEntity.type);
      for (const match of matches) {
        if (!entityNames.has(match.id)) {
          relevantEntities.push(match);
          entityNames.add(match.id);
        }
      }
    }

    // Step 3: Expand context using graph traversal
    const expandedEntities: Entity[] = [...relevantEntities];
    for (const entity of relevantEntities) {
      const connected = graphStorage.getConnectedEntities(entity.id, undefined, 2);
      for (const connectedEntity of connected) {
        if (!entityNames.has(connectedEntity.id)) {
          expandedEntities.push(connectedEntity);
          entityNames.add(connectedEntity.id);
        }
      }
    }

    console.log(`Found ${expandedEntities.length} relevant entities`);

    // Step 4: Build graph context
    const graphContext = this.buildGraphContext(expandedEntities);

    // Step 5: Filter by documents if specified
    let contextEntities = expandedEntities;
    if (documentIds && documentIds.length > 0) {
      contextEntities = expandedEntities.filter(e =>
        documentIds.includes(e.sourceDocumentId || '')
      );
    }

    // Step 6: Generate answer using graph context
    const answer = await this.generateAnswerWithGraphContext(
      question,
      graphContext,
      contextEntities
    );

    // Step 7: Get source documents
    const sources = Array.from(
      new Set(contextEntities.map(e => e.sourceDocumentId).filter((id): id is string => !!id))
    );

    return {
      answer,
      relevantEntities: contextEntities,
      graphContext,
      sources,
    };
  }

  /**
   * Build human-readable graph context
   */
  private buildGraphContext(entities: Entity[]): string {
    const lines: string[] = [];
    
    for (const entity of entities) {
      const connected = graphStorage.getConnectedEntities(entity.id, undefined, 1);
      
      if (connected.length > 0) {
        const relationships = connected
          .map(c => `${entity.name} → ${c.name}`)
          .join('; ');
        lines.push(`- ${entity.name} (${entity.type}): ${relationships}`);
      } else {
        lines.push(`- ${entity.name} (${entity.type})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate answer using graph context
   */
  private async generateAnswerWithGraphContext(
    question: string,
    graphContext: string,
    entities: Entity[]
  ): Promise<string> {
    const entityDetails = entities
      .map(e => `${e.name} (${e.type}): ${JSON.stringify(e.properties)}`)
      .join('\n');

    const prompt = `You are a knowledge graph expert assistant. Answer the question using the knowledge graph context below.

KNOWLEDGE GRAPH STRUCTURE:
${graphContext}

ENTITY DETAILS:
${entityDetails}

QUESTION: ${question}

Provide a comprehensive answer based on the knowledge graph. Mention relevant entities and their relationships. If the graph doesn't contain enough information, say so.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating answer:', error);
      return 'Unable to generate answer from knowledge graph.';
    }
  }

  /**
   * Get graph statistics
   */
  getGraphStats() {
    return graphStorage.getStats();
  }

  /**
   * Get visualization data
   */
  getVisualizationData() {
    return graphStorage.exportForVisualization();
  }

  /**
   * Clear the graph
   */
  clearGraph() {
    graphStorage.clear();
  }
}

export const graphragService = new GraphRAGService();
