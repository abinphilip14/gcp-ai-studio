import { NextRequest, NextResponse } from 'next/server';
import { ExportService } from '@/lib/export';
import { analyticsService, AnalyticsService } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  const sessionId = AnalyticsService.getSessionId();

  try {
    const body = await request.json();
    const { data, format, filename } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'data array is required' },
        { status: 400 }
      );
    }

    if (!['csv', 'json', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, json, or excel' },
        { status: 400 }
      );
    }

    const exportData = ExportService.createDownloadResponse(data, {
      format,
      filename,
    });

    // Track export
    await analyticsService.trackExport({
      sessionId,
      format,
      rowCount: data.length,
    });

    return new NextResponse(exportData.content, {
      headers: {
        'Content-Type': exportData.contentType,
        'Content-Disposition': `attachment; filename="${exportData.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
