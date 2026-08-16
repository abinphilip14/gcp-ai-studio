import Graph from 'graphology';
import { v4 as uuidv4 } from 'uuid';

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'CONCEPT' | 'DATE' | 'METRIC' | 'DOCUMENT';
export type RelationType = 'WORKS_FOR' | 'LOCATED_IN' | 'MENTIONS' | 'RELATED_TO' | 'OCCURRED_ON' | 'PART_OF' | 'CONTAINS';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  properties: Record<string, any>;
  sourceDocumentId?: string;
}

export interface Relationship {
  id: string;
  type: RelationType;
  source: string; // entity id
  target: string; // entity id
  properties: Record<string, any>;
}

export interface GraphQuery {
  entityName?: string;
  entityType?: EntityType;
  relationshipType?: RelationType;
  depth?: number;
}

export class GraphStorage {
  private graph: Graph;
  private entityIndex: Map<string, Entity>;
  private documentIndex: Map<string, Set<string>>; // documentId -> Set of entity ids

  constructor() {
    this.graph = new Graph();
    this.entityIndex = new Map();
    this.documentIndex = new Map();
  }

  /**
   * Add an entity to the graph
   */
  addEntity(entity: Entity): void {
    // Check if entity already exists (by name and type)
    const existingEntity = this.findEntityByNameAndType(entity.name, entity.type);
    
    if (existingEntity) {
      // Merge properties
      existingEntity.properties = {
        ...existingEntity.properties,
        ...entity.properties,
      };
      return;
    }

    this.graph.addNode(entity.id, {
      type: entity.type,
      name: entity.name,
      ...entity.properties,
    });

    this.entityIndex.set(entity.id, entity);

    // Index by document
    if (entity.sourceDocumentId) {
      if (!this.documentIndex.has(entity.sourceDocumentId)) {
        this.documentIndex.set(entity.sourceDocumentId, new Set());
      }
      this.documentIndex.get(entity.sourceDocumentId)!.add(entity.id);
    }
  }

  /**
   * Add a relationship between entities
   */
  addRelationship(relationship: Relationship): void {
    if (!this.graph.hasNode(relationship.source) || !this.graph.hasNode(relationship.target)) {
      console.warn('Cannot add relationship: source or target entity not found');
      return;
    }

    // Avoid duplicate edges
    if (this.graph.hasEdge(relationship.source, relationship.target)) {
      return;
    }

    this.graph.addDirectedEdge(relationship.source, relationship.target, {
      type: relationship.type,
      ...relationship.properties,
    });
  }

  /**
   * Find entity by name and type
   */
  private findEntityByNameAndType(name: string, type: EntityType): Entity | undefined {
    for (const entity of this.entityIndex.values()) {
      if (entity.name.toLowerCase() === name.toLowerCase() && entity.type === type) {
        return entity;
      }
    }
    return undefined;
  }

  /**
   * Get entity by ID
   */
  getEntity(id: string): Entity | undefined {
    return this.entityIndex.get(id);
  }

  /**
   * Search entities by name (fuzzy matching)
   */
  searchEntities(query: string, type?: EntityType): Entity[] {
    const queryLower = query.toLowerCase();
    const results: Entity[] = [];

    for (const entity of this.entityIndex.values()) {
      if (type && entity.type !== type) continue;
      
      if (entity.name.toLowerCase().includes(queryLower)) {
        results.push(entity);
      }
    }

    return results;
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: EntityType): Entity[] {
    const results: Entity[] = [];
    for (const entity of this.entityIndex.values()) {
      if (entity.type === type) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Get entities connected to a specific entity
   */
  getConnectedEntities(entityId: string, relationshipType?: RelationType, depth: number = 1): Entity[] {
    if (!this.graph.hasNode(entityId)) return [];

    const visited = new Set<string>();
    const queue: Array<{ id: string; currentDepth: number }> = [{ id: entityId, currentDepth: 0 }];
    const results: Entity[] = [];

    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;
      
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      // Get all neighbors
      this.graph.forEachOutNeighbor(id, (neighbor, attributes) => {
        if (relationshipType && attributes.type !== relationshipType) return;
        
        const entity = this.getEntity(neighbor);
        if (entity && !visited.has(neighbor)) {
          results.push(entity);
          if (currentDepth < depth) {
            queue.push({ id: neighbor, currentDepth: currentDepth + 1 });
          }
        }
      });
    }

    return results;
  }

  /**
   * Get all entities from a specific document
   */
  getEntitiesByDocument(documentId: string): Entity[] {
    const entityIds = this.documentIndex.get(documentId);
    if (!entityIds) return [];

    return Array.from(entityIds)
      .map(id => this.getEntity(id))
      .filter((e): e is Entity => e !== undefined);
  }

  /**
   * Get relationship path between two entities
   */
  getPath(sourceId: string, targetId: string): Entity[] | null {
    if (!this.graph.hasNode(sourceId) || !this.graph.hasNode(targetId)) {
      return null;
    }

    // BFS to find shortest path
    const queue: Array<{ id: string; path: string[] }> = [{ id: sourceId, path: [sourceId] }];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === targetId) {
        return path.map(id => this.getEntity(id)).filter((e): e is Entity => e !== undefined);
      }

      this.graph.forEachOutNeighbor(id, (neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ id: neighbor, path: [...path, neighbor] });
        }
      });
    }

    return null;
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    totalEntities: number;
    totalRelationships: number;
    entitiesByType: Record<EntityType, number>;
    documents: number;
  } {
    const entitiesByType: Record<string, number> = {};
    
    for (const entity of this.entityIndex.values()) {
      entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
    }

    return {
      totalEntities: this.entityIndex.size,
      totalRelationships: this.graph.size,
      entitiesByType: entitiesByType as Record<EntityType, number>,
      documents: this.documentIndex.size,
    };
  }

  /**
   * Export graph for visualization
   */
  exportForVisualization(): {
    nodes: Array<{ id: string; label: string; type: EntityType; properties: any }>;
    edges: Array<{ id: string; source: string; target: string; type: RelationType; label: string }>;
  } {
    const nodes: Array<{ id: string; label: string; type: EntityType; properties: any }> = [];
    const edges: Array<{ id: string; source: string; target: string; type: RelationType; label: string }> = [];

    // Export nodes
    this.graph.forEachNode((node, attributes) => {
      const entity = this.getEntity(node);
      if (entity) {
        nodes.push({
          id: node,
          label: entity.name,
          type: entity.type,
          properties: entity.properties,
        });
      }
    });

    // Export edges
    this.graph.forEachEdge((edge, attributes, source, target) => {
      edges.push({
        id: edge,
        source,
        target,
        type: attributes.type,
        label: attributes.type,
      });
    });

    return { nodes, edges };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.graph.clear();
    this.entityIndex.clear();
    this.documentIndex.clear();
  }

  /**
   * Get the underlying graph object
   */
  getGraph(): Graph {
    return this.graph;
  }
}

// Singleton instance
export const graphStorage = new GraphStorage();
