import { NextRequest, NextResponse } from 'next/server';
import { exportFusedChecklistAsPdf } from '@/lib/pdfExporter';
import type { ChecklistItem } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      version,
      date,
      fusedItems,
      metadata,
    } = body;

    if (!fusedItems || !Array.isArray(fusedItems)) {
      return NextResponse.json(
        { error: 'Fused items are required' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBytes = await exportFusedChecklistAsPdf({
      title: title || 'Fused Audit Checklist',
      version: version || 'v1.0',
      date: date || new Date().toISOString().split('T')[0],
      fusedItems,
      metadata,
    });

    // Return PDF as response (convert Uint8Array to Buffer for NextResponse)
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fused-checklist-${date || 'export'}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error in export-pdf API:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to export PDF',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
