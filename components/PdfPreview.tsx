"use client";

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { FileText, FileImage } from 'lucide-react';
import { PdfViewer } from './PdfViewer';
import type { Checklist } from '@/lib/types/database';

interface PdfPreviewProps {
  checklist: Checklist;
  pdfFile?: File | null;
}

export function PdfPreview({ checklist, pdfFile }: PdfPreviewProps) {
  const { parsed_content } = checklist;
  const [viewMode, setViewMode] = useState<'html' | 'pdf'>('html');

  // Group items by section
  const itemsBySection = useMemo(() => {
    const sections: Record<string, typeof parsed_content.items> = {};

    parsed_content.items.forEach((item) => {
      const section = item.section || 'General';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(item);
    });

    return sections;
  }, [parsed_content]);

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* Header with toggle */}
      <div className="mb-4 pb-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-900">
            {parsed_content.metadata.title || checklist.file_name}
          </h3>

          {pdfFile && (
            <Button
              onClick={() => setViewMode(viewMode === 'html' ? 'pdf' : 'html')}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {viewMode === 'html' ? (
                <>
                  <FileImage className="h-4 w-4" />
                  View as PDF
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  View Structured
                </>
              )}
            </Button>
          )}
        </div>

        {parsed_content.metadata.version && (
          <p className="text-xs text-gray-500 mt-1">
            Version: {parsed_content.metadata.version}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {parsed_content.items.length} items
        </p>
      </div>

      {/* Content: HTML or PDF view */}
      {viewMode === 'html' ? (
        <Accordion type="multiple" className="w-full">
          {Object.entries(itemsBySection).map(([section, items]) => (
            <AccordionItem key={section} value={section}>
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center justify-between w-full pr-2">
                  <span>{section}</span>
                  <span className="text-xs text-gray-500 font-normal">
                    ({items.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 border border-gray-400 rounded-sm flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900 leading-relaxed">
                            {item.text}
                          </p>

                          {item.options && item.options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.options.map((option, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs text-gray-600 pl-2"
                                >
                                  • {option}
                                </p>
                              ))}
                            </div>
                          )}

                          {item.references && item.references.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Ref: {item.references.join(', ')}
                            </p>
                          )}

                          {item.category && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : pdfFile ? (
        <div className="flex-1 min-h-0">
          <PdfViewer file={pdfFile} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">PDF file not available</p>
        </div>
      )}
    </div>
  );
}
