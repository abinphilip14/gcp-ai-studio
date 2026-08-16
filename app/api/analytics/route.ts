import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics';
import { graphragService } from '@/lib/graphrag';

export async function GET() {
  try {
    // Get graph stats
    const graphStats = graphragService.getGraphStats();
    
    // Get analytics stats
    const stats = await analyticsService.getStats(graphStats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup') {
      const daysToKeep = body.daysToKeep || 90;
      await analyticsService.cleanupOldEvents(daysToKeep);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in analytics action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
