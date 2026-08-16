import { NextRequest, NextResponse } from 'next/server';
import { graphragService } from '@/lib/graphrag';
import { pdfService } from '@/lib/pdf';
import { analyticsService, AnalyticsService } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  const sessionId = AnalyticsService.getSessionId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Get the PDF document
    const documents = await pdfService.listPDFs();
    const document = documents.find(d => d.id === documentId);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Build graph from document
    const result = await graphragService.buildGraphFromDocument(
      document.id,
      document.filename,
      document.content
    );

    const executionTime = Date.now() - startTime;

    // Estimate tokens (entity and relationship extraction)
    const estimatedTokens = (result.entitiesAdded + result.relationshipsAdded) * 50;

    // Track analytics
    await analyticsService.trackGraphBuild({
      sessionId,
      documentId: document.id,
      tokensConsumed: estimatedTokens,
      entitiesExtracted: result.entitiesAdded,
      relationshipsExtracted: result.relationshipsAdded,
      executionTime,
      success: true,
    });

    return NextResponse.json({
      success: true,
      documentId,
      documentName: document.filename,
      ...result,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await analyticsService.trackGraphBuild({
      sessionId,
      documentId: '',
      tokensConsumed: 0,
      entitiesExtracted: 0,
      relationshipsExtracted: 0,
      executionTime,
      success: false,
    });

    console.error('Error building graph from PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to build graph',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
