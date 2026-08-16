import { VertexAI } from '@google-cloud/vertexai';
import { bigQueryService, TableSchema } from './bigquery';

export interface QueryResult {
  sql: string;
  explanation: string;
  confidence: number;
}

export class VertexAIService {
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
   * Convert natural language to SQL query
   */
  async naturalLanguageToSQL(
    userQuestion: string,
    dataDictionary: TableSchema[],
    conversationHistory: string[] = []
  ): Promise<QueryResult> {
    const schemaContext = this.buildSchemaContext(dataDictionary);
    
    const prompt = `You are an expert SQL query generator for Google BigQuery.

DATABASE SCHEMA:
${schemaContext}

CONVERSATION HISTORY:
${conversationHistory.join('\n')}

USER QUESTION: ${userQuestion}

Generate a valid BigQuery SQL query to answer this question. Follow these rules:
1. Use fully qualified table names: \`project.dataset.table\`
2. Use standard SQL syntax (not legacy SQL)
3. Include appropriate WHERE clauses, JOINs, and aggregations
4. Limit results to 1000 rows unless specifically asked for more
5. Use DATE and TIMESTAMP functions correctly for BigQuery
6. Provide clear column aliases

Respond in JSON format:
{
  "sql": "the SQL query",
  "explanation": "brief explanation of what the query does",
  "confidence": 0.95
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      
      const parsed = JSON.parse(jsonText);
      
      // Validate the generated SQL
      const validation = await bigQueryService.validateQuery(parsed.sql);
      
      if (!validation.valid) {
        // Try to fix the query
        const fixedQuery = await this.fixInvalidSQL(parsed.sql, validation.error!, schemaContext);
        return {
          sql: fixedQuery.sql,
          explanation: parsed.explanation + ' (auto-corrected)',
          confidence: Math.max(0.7, parsed.confidence - 0.2),
        };
      }
      
      return parsed;
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Attempt to fix invalid SQL
   */
  private async fixInvalidSQL(
    invalidSQL: string,
    error: string,
    schemaContext: string
  ): Promise<{ sql: string; explanation: string }> {
    const prompt = `The following BigQuery SQL query has an error:

QUERY:
${invalidSQL}

ERROR:
${error}

SCHEMA:
${schemaContext}

Fix the query to make it valid BigQuery SQL. Respond in JSON:
{
  "sql": "corrected SQL query",
  "explanation": "what was fixed"
}`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    return JSON.parse(jsonText);
  }

  /**
   * Answer questions about query results
   */
  async explainResults(
    question: string,
    queryResults: any[],
    originalQuestion: string
  ): Promise<string> {
    const prompt = `You are a data analyst. The user asked: "${originalQuestion}"

The query returned ${queryResults.length} rows. Here's a sample of the data:
${JSON.stringify(queryResults.slice(0, 5), null, 2)}

User's follow-up question: ${question}

Provide a clear, concise answer based on the data.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error explaining results:', error);
      throw error;
    }
  }

  /**
   * Generate insights from query results
   */
  async generateInsights(queryResults: any[], query: string): Promise<string[]> {
    if (queryResults.length === 0) {
      return ['No data returned from the query.'];
    }

    const prompt = `Analyze this query result and provide 3-5 key insights:

QUERY: ${query}

SAMPLE DATA (first 10 rows):
${JSON.stringify(queryResults.slice(0, 10), null, 2)}

TOTAL ROWS: ${queryResults.length}

Provide insights as a JSON array of strings:
["insight 1", "insight 2", "insight 3"]`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('Error generating insights:', error);
      return ['Unable to generate insights.'];
    }
  }

  /**
   * Build schema context for the AI model
   */
  private buildSchemaContext(dataDictionary: TableSchema[]): string {
    return dataDictionary
      .map(table => {
        const columns = table.columns
          .map(col => `  - ${col.name} (${col.type}${col.mode === 'REPEATED' ? '[]' : ''})${col.description ? ': ' + col.description : ''}`)
          .join('\n');
        return `Table: ${table.datasetId}.${table.tableId}\n${columns}`;
      })
      .join('\n\n');
  }

  /**
   * Suggest next questions based on results
   */
  async suggestFollowUpQuestions(
    originalQuestion: string,
    queryResults: any[]
  ): Promise<string[]> {
    const prompt = `Given this question: "${originalQuestion}"
And these results (${queryResults.length} rows):
${JSON.stringify(queryResults.slice(0, 3), null, 2)}

Suggest 3 relevant follow-up questions as a JSON array:
["question 1", "question 2", "question 3"]`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('Error suggesting questions:', error);
      return [];
    }
  }
}

export const vertexAIService = new VertexAIService();
