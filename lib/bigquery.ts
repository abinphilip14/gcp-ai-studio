import { BigQuery } from '@google-cloud/bigquery';

export interface TableSchema {
  tableId: string;
  datasetId: string;
  columns: {
    name: string;
    type: string;
    mode: string;
    description?: string;
  }[];
}

export class BigQueryService {
  private bigquery: BigQuery;

  constructor() {
    this.bigquery = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  /**
   * Execute a SQL query on BigQuery
   */
  async executeQuery(query: string): Promise<any[]> {
    try {
      const [job] = await this.bigquery.createQueryJob({
        query: query,
        location: process.env.VERTEX_AI_LOCATION,
      });

      const [rows] = await job.getQueryResults();
      return rows;
    } catch (error) {
      console.error('BigQuery error:', error);
      throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all datasets in the project
   */
  async getDatasets(): Promise<string[]> {
    try {
      const [datasets] = await this.bigquery.getDatasets();
      return datasets.map(dataset => dataset.id || '');
    } catch (error) {
      console.error('Error fetching datasets:', error);
      throw error;
    }
  }

  /**
   * Get all tables in a dataset
   */
  async getTables(datasetId: string): Promise<string[]> {
    try {
      const dataset = this.bigquery.dataset(datasetId);
      const [tables] = await dataset.getTables();
      return tables.map(table => table.id || '');
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  }

  /**
   * Get table schema including column metadata
   */
  async getTableSchema(datasetId: string, tableId: string): Promise<TableSchema> {
    try {
      const dataset = this.bigquery.dataset(datasetId);
      const table = dataset.table(tableId);
      const [metadata] = await table.getMetadata();

      return {
        tableId,
        datasetId,
        columns: metadata.schema.fields.map((field: any) => ({
          name: field.name,
          type: field.type,
          mode: field.mode,
          description: field.description,
        })),
      };
    } catch (error) {
      console.error('Error fetching table schema:', error);
      throw error;
    }
  }

  /**
   * Get data dictionary for all tables in a dataset
   */
  async getDataDictionary(datasetId: string): Promise<TableSchema[]> {
    try {
      const tables = await this.getTables(datasetId);
      const schemas = await Promise.all(
        tables.map(tableId => this.getTableSchema(datasetId, tableId))
      );
      return schemas;
    } catch (error) {
      console.error('Error fetching data dictionary:', error);
      throw error;
    }
  }

  /**
   * Test connection to BigQuery
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.bigquery.getDatasets();
      return true;
    } catch (error) {
      console.error('BigQuery connection test failed:', error);
      return false;
    }
  }

  /**
   * Get sample data from a table
   */
  async getSampleData(datasetId: string, tableId: string, limit: number = 10): Promise<any[]> {
    const query = `SELECT * FROM \`${process.env.GCP_PROJECT_ID}.${datasetId}.${tableId}\` LIMIT ${limit}`;
    return this.executeQuery(query);
  }

  /**
   * Validate SQL query without executing
   */
  async validateQuery(query: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const [job] = await this.bigquery.createQueryJob({
        query: query,
        dryRun: true,
        location: process.env.VERTEX_AI_LOCATION,
      });
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }
}

export const bigQueryService = new BigQueryService();
