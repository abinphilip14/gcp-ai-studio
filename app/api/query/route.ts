import { NextRequest, NextResponse } from 'next/server';
import { vertexAIService } from '@/lib/vertexai';
import { bigQueryService } from '@/lib/bigquery';
import { analyticsService, AnalyticsService } from '@/lib/analytics';

// Estimate tokens (rough approximation)
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export async function POST(request: NextRequest) {
  const sessionId = AnalyticsService.getSessionId();
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { question, datasetId, conversationHistory } = body;

    if (!question || !datasetId) {
      return NextResponse.json(
        { error: 'question and datasetId are required' },
        { status: 400 }
      );
    }

    // Get data dictionary for context
    const dataDictionary = await bigQueryService.getDataDictionary(datasetId);

    // Estimate input tokens
    const inputText = question + JSON.stringify(dataDictionary);
    const inputTokens = estimateTokens(inputText);

    // Convert natural language to SQL
    const queryResult = await vertexAIService.naturalLanguageToSQL(
      question,
      dataDictionary,
      conversationHistory || []
    );

    // Execute the query
    const results = await bigQueryService.executeQuery(queryResult.sql);
    const executionTime = Date.now() - startTime;

    // Generate insights
    const insights = await vertexAIService.generateInsights(results, queryResult.sql);
    
    // Suggest follow-up questions
    const followUpQuestions = await vertexAIService.suggestFollowUpQuestions(
      question,
      results
    );

    // Estimate output tokens
    const outputText = queryResult.sql + queryResult.explanation + insights.join(' ') + followUpQuestions.join(' ');
    const outputTokens = estimateTokens(outputText);
    const totalTokens = inputTokens + outputTokens;

    // Track analytics
    await analyticsService.trackQuery({
      sessionId,
      tokensConsumed: totalTokens,
      inputTokens,
      outputTokens,
      resultCount: results.length,
      executionTime,
      success: true,
    });

    return NextResponse.json({
      sql: queryResult.sql,
      explanation: queryResult.explanation,
      confidence: queryResult.confidence,
      results,
      resultCount: results.length,
      executionTime,
      insights,
      followUpQuestions,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Track failed query
    await analyticsService.trackQuery({
      sessionId,
      tokensConsumed: 0,
      inputTokens: 0,
      outputTokens: 0,
      resultCount: 0,
      executionTime,
      success: false,
    });

    console.error('Error processing query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
