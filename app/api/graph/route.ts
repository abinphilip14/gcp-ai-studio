import { NextRequest, NextResponse } from 'next/server';
import { graphragService } from '@/lib/graphrag';
import { analyticsService, AnalyticsService } from '@/lib/analytics';

// Estimate tokens
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function POST(request: NextRequest) {
  const sessionId = AnalyticsService.getSessionId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { question, documentIds } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 }
      );
    }

    const inputTokens = estimateTokens(question);
    const result = await graphragService.queryWithGraph(question, documentIds);
    const executionTime = Date.now() - startTime;
    const outputTokens = estimateTokens(result.answer + result.graphContext);

    // Track analytics
    await analyticsService.trackGraphQuery({
      sessionId,
      tokensConsumed: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      entitiesFound: result.relevantEntities.length,
      executionTime,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await analyticsService.trackGraphQuery({
      sessionId,
      tokensConsumed: 0,
      inputTokens: 0,
      outputTokens: 0,
      entitiesFound: 0,
      executionTime,
      success: false,
    });

    console.error('Error in GraphRAG query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process GraphRAG query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = graphragService.getGraphStats();
    const visualization = graphragService.getVisualizationData();

    return NextResponse.json({
      stats,
      visualization,
    });
  } catch (error) {
    console.error('Error getting graph data:', error);
    return NextResponse.json(
      { error: 'Failed to get graph data' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    graphragService.clearGraph();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing graph:', error);
    return NextResponse.json(
      { error: 'Failed to clear graph' },
      { status: 500 }
    );
  }
}
