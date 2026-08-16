import { ExcelJS } from 'exceljs';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  filename?: string;
}

export class ExportService {
  /**
   * Export query results to CSV
   */
  static toCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export query results to JSON
   */
  static toJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Create download response for browser
   */
  static createDownloadResponse(data: any[], options: ExportOptions): {
    content: string | Buffer;
    contentType: string;
    filename: string;
  } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const baseFilename = options.filename || `export_${timestamp}`;

    switch (options.format) {
      case 'csv':
        return {
          content: this.toCSV(data),
          contentType: 'text/csv',
          filename: `${baseFilename}.csv`,
        };
      
      case 'json':
        return {
          content: this.toJSON(data),
          contentType: 'application/json',
          filename: `${baseFilename}.json`,
        };
      
      case 'excel':
        // For Excel, we'll use a simple format
        // In production, you'd use exceljs library
        return {
          content: this.toCSV(data),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `${baseFilename}.xlsx`,
        };
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
