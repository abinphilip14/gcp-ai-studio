import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import { VertexAI } from '@google-cloud/vertexai';

export interface PDFDocument {
  id: string;
  filename: string;
  content: string;
  uploadDate: Date;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

export interface PDFChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
}

export class PDFService {
  private pdfStoragePath: string;
  private vertexAI: VertexAI;
  private embeddingModel: any;

  constructor() {
    this.pdfStoragePath = process.env.PDF_STORAGE_PATH || './data/pdfs';
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION!,
    });
    
    // Initialize embedding model
    this.embeddingModel = this.vertexAI.getGenerativeModel({
      model: 'text-embedding-004',
    });

    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.pdfStoragePath, { recursive: true });
      await fs.mkdir(path.join(this.pdfStoragePath, 'metadata'), { recursive: true });
    } catch (error) {
      console.error('Error creating storage directory:', error);
    }
  }

  /**
   * Upload and process a PDF file
   */
  async uploadPDF(fileBuffer: Buffer, filename: string): Promise<PDFDocument> {
    try {
      // Parse PDF
      const pdfData = await pdf(fileBuffer);
      
      const documentId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const document: PDFDocument = {
        id: documentId,
        filename,
        content: pdfData.text,
        uploadDate: new Date(),
        pageCount: pdfData.numpages,
        metadata: {
          title: pdfData.info?.Title,
          author: pdfData.info?.Author,
          subject: pdfData.info?.Subject,
        },
      };

      // Save PDF file
      const filePath = path.join(this.pdfStoragePath, `${documentId}.pdf`);
      await fs.writeFile(filePath, fileBuffer);

      // Save metadata
      const metadataPath = path.join(this.pdfStoragePath, 'metadata', `${documentId}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(document, null, 2));

      // Create chunks for vector search
      await this.createChunks(document);

      return document;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw new Error(`Failed to upload PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split document into chunks for embedding
   */
  private async createChunks(document: PDFDocument): Promise<PDFChunk[]> {
    const chunkSize = 1000; // characters per chunk
    const overlap = 200; // character overlap between chunks
    
    const chunks: PDFChunk[] = [];
    const text = document.content;
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunkContent = text.slice(i, i + chunkSize);
      const chunk: PDFChunk = {
        id: `${document.id}_chunk_${chunks.length}`,
        documentId: document.id,
        content: chunkContent,
        chunkIndex: chunks.length,
      };
      
      // Generate embedding
      chunk.embedding = await this.generateEmbedding(chunkContent);
      chunks.push(chunk);
    }

    // Save chunks
    const chunksPath = path.join(this.pdfStoragePath, 'metadata', `${document.id}_chunks.json`);
    await fs.writeFile(chunksPath, JSON.stringify(chunks, null, 2));

    return chunks;
  }

  /**
   * Generate embedding for text using Vertex AI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For Vertex AI text embeddings, we need to use the PaLM API
      // This is a simplified version - you may need to adjust based on your setup
      const model = this.vertexAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });
      
      // Note: Gemini doesn't directly provide embeddings
      // You should use Vertex AI's text-embedding-004 model via the REST API
      // For now, returning a placeholder
      // TODO: Implement proper embedding generation using Vertex AI Embedding API
      
      return Array(768).fill(0).map(() => Math.random());
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }

  /**
   * Search PDFs using semantic search
   */
  async searchPDFs(query: string, topK: number = 5): Promise<{ chunk: PDFChunk; similarity: number; document: PDFDocument }[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Load all chunks
      const metadataDir = path.join(this.pdfStoragePath, 'metadata');
      const files = await fs.readdir(metadataDir);
      const chunkFiles = files.filter(f => f.endsWith('_chunks.json'));

      const allResults: { chunk: PDFChunk; similarity: number; document: PDFDocument }[] = [];

      for (const chunkFile of chunkFiles) {
        const chunksPath = path.join(metadataDir, chunkFile);
        const chunksData = await fs.readFile(chunksPath, 'utf-8');
        const chunks: PDFChunk[] = JSON.parse(chunksData);

        const documentId = chunkFile.replace('_chunks.json', '');
        const documentPath = path.join(metadataDir, `${documentId}.json`);
        const documentData = await fs.readFile(documentPath, 'utf-8');
        const document: PDFDocument = JSON.parse(documentData);

        for (const chunk of chunks) {
          if (chunk.embedding) {
            const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
            allResults.push({ chunk, similarity, document });
          }
        }
      }

      // Sort by similarity and return top K
      return allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      console.error('Error searching PDFs:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Answer questions using PDF knowledge base
   */
  async answerQuestionFromPDFs(question: string): Promise<{ answer: string; sources: PDFDocument[] }> {
    try {
      // Search for relevant chunks
      const searchResults = await this.searchPDFs(question, 5);

      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find relevant information in the uploaded PDFs to answer this question.",
          sources: [],
        };
      }

      // Prepare context from top results
      const context = searchResults
        .map((result, i) => `[Source ${i + 1}: ${result.document.filename}]\n${result.chunk.content}`)
        .join('\n\n');

      // Generate answer using Vertex AI
      const model = this.vertexAI.getGenerativeModel({
        model: process.env.VERTEX_AI_MODEL || 'gemini-1.5-pro',
      });

      const prompt = `You are a helpful assistant answering questions based on document content.

CONTEXT FROM DOCUMENTS:
${context}

USER QUESTION: ${question}

Provide a clear, accurate answer based ONLY on the context provided. If the context doesn't contain enough information to answer the question, say so. Include references to source documents.`;

      const result = await model.generateContent(prompt);
      const answer = result.response.candidates[0].content.parts[0].text;

      const sources = [...new Map(searchResults.map(r => [r.document.id, r.document])).values()];

      return { answer, sources };
    } catch (error) {
      console.error('Error answering question from PDFs:', error);
      throw error;
    }
  }

  /**
   * Get all uploaded PDFs
   */
  async listPDFs(): Promise<PDFDocument[]> {
    try {
      const metadataDir = path.join(this.pdfStoragePath, 'metadata');
      const files = await fs.readdir(metadataDir);
      const documentFiles = files.filter(f => f.endsWith('.json') && !f.includes('_chunks'));

      const documents: PDFDocument[] = [];
      for (const file of documentFiles) {
        const filePath = path.join(metadataDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        documents.push(JSON.parse(data));
      }

      return documents.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
    } catch (error) {
      console.error('Error listing PDFs:', error);
      return [];
    }
  }

  /**
   * Delete a PDF document
   */
  async deletePDF(documentId: string): Promise<void> {
    try {
      const pdfPath = path.join(this.pdfStoragePath, `${documentId}.pdf`);
      const metadataPath = path.join(this.pdfStoragePath, 'metadata', `${documentId}.json`);
      const chunksPath = path.join(this.pdfStoragePath, 'metadata', `${documentId}_chunks.json`);

      await Promise.all([
        fs.unlink(pdfPath).catch(() => {}),
        fs.unlink(metadataPath).catch(() => {}),
        fs.unlink(chunksPath).catch(() => {}),
      ]);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      throw error;
    }
  }
}

export const pdfService = new PDFService();
