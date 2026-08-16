import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/lib/pdf';
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
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 }
      );
    }

    const inputTokens = estimateTokens(question);
    const result = await pdfService.answerQuestionFromPDFs(question);
    const executionTime = Date.now() - startTime;
    const outputTokens = estimateTokens(result.answer);

    // Track analytics
    await analyticsService.trackPDFQuery({
      sessionId,
      tokensConsumed: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      executionTime,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await analyticsService.trackPDFQuery({
      sessionId,
      tokensConsumed: 0,
      inputTokens: 0,
      outputTokens: 0,
      executionTime,
      success: false,
    });

    console.error('Error answering PDF question:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
