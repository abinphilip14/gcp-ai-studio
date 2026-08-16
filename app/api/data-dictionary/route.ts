import { NextRequest, NextResponse } from 'next/server';
import { bigQueryService } from '@/lib/bigquery';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        { error: 'datasetId parameter is required' },
        { status: 400 }
      );
    }

    const dataDictionary = await bigQueryService.getDataDictionary(datasetId);
    
    return NextResponse.json({ dataDictionary });
  } catch (error) {
    console.error('Error fetching data dictionary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data dictionary' },
      { status: 500 }
    );
  }
}
