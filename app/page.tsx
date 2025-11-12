"use client";

import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Download, Loader2, AlertCircle } from 'lucide-react';
import { UploadPanel } from '@/components/UploadPanel';
import { FusionSuggestionItem } from '@/components/FusionSuggestionItem';
import { FusionEditModal } from '@/components/FusionEditModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { generateFileHash } from '@/utils/fileHasher';
import type { FusionSuggestionWithDetails } from '@/lib/types/database';

export default function Home() {
  const {
    checklist1,
    checklist2,
    checklist1Loading,
    checklist2Loading,
    checklist1Error,
    checklist2Error,
    pdfFile1,
    pdfFile2,
    fusionSuggestions,
    fusionSuggestionsLoading,
    fusionSuggestionsError,
    fusionDecisions,
    fusedChecklist,
    setChecklist1,
    setChecklist2,
    setChecklist1Loading,
    setChecklist2Loading,
    setChecklist1Error,
    setChecklist2Error,
    setPdfFile1,
    setPdfFile2,
    setFusionSuggestions,
    setFusionSuggestionsLoading,
    setFusionSuggestionsError,
    acceptFusion,
    rejectFusion,
    editFusion,
    clearFusionDecision,
    generateFusedChecklist,
  } = useAppStore();

  const [editingSuggestion, setEditingSuggestion] = useState<FusionSuggestionWithDetails | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Generate fusion suggestions when both checklists are uploaded
  useEffect(() => {
    if (checklist1 && checklist2 && fusionSuggestions.length === 0) {
      handleGenerateFusions();
    }
  }, [checklist1, checklist2]);

  const handleUploadChecklist1 = useCallback(async (file: File) => {
    if (!file.name) return; // Reset/clear action

    setPdfFile1(file); // Save original PDF file

    setChecklist1Loading(true);
    setChecklist1Error(null);

    try {
      const fileHash = await generateFileHash(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileHash', fileHash);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse PDF');
      }

      const data = await response.json();
      setChecklist1(data.checklist);
    } catch (error: any) {
      console.error('Error uploading checklist 1:', error);
      setChecklist1Error(error.message);
    } finally {
      setChecklist1Loading(false);
    }
  }, []);

  const handleUploadChecklist2 = useCallback(async (file: File) => {
    if (!file.name) return; // Reset/clear action

    setPdfFile2(file); // Save original PDF file

    setChecklist2Loading(true);
    setChecklist2Error(null);

    try {
      const fileHash = await generateFileHash(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileHash', fileHash);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse PDF');
      }

      const data = await response.json();
      setChecklist2(data.checklist);
    } catch (error: any) {
      console.error('Error uploading checklist 2:', error);
      setChecklist2Error(error.message);
    } finally {
      setChecklist2Loading(false);
    }
  }, []);

  const handleGenerateFusions = async () => {
    if (!checklist1 || !checklist2) return;

    setFusionSuggestionsLoading(true);
    setFusionSuggestionsError(null);

    try {
      const response = await fetch('/api/generate-fusions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklist1,
          checklist2,
          options: {
            similarityThreshold: 0.7,
            maxSuggestions: 50,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate fusions');
      }

      const data = await response.json();
      setFusionSuggestions(data.suggestions);
    } catch (error: any) {
      console.error('Error generating fusions:', error);
      setFusionSuggestionsError(error.message);
    } finally {
      setFusionSuggestionsLoading(false);
    }
  };

  const handleEditSuggestion = (suggestion: FusionSuggestionWithDetails) => {
    setEditingSuggestion(suggestion);
  };

  const handleSaveEdit = (customText: string) => {
    if (editingSuggestion) {
      editFusion(editingSuggestion.id, customText);
      setEditingSuggestion(null);
    }
  };

  const handleGenerateFusedChecklist = () => {
    generateFusedChecklist();
  };

  const handleExportPdf = async () => {
    if (!fusedChecklist) return;

    setIsExporting(true);

    try {
      // Prepare fused items data
      const fusedItemsData = fusedChecklist.items.map((item) => ({
        item,
        sourceIds: item.metadata?.fusedFrom || [],
        isFused: !!item.metadata?.fusedFrom,
      }));

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Fused Audit Checklist',
          version: 'v1.0',
          date: new Date().toISOString().split('T')[0],
          fusedItems: fusedItemsData,
          metadata: {
            checklist1Name: checklist1?.file_name || 'Checklist 1',
            checklist2Name: checklist2?.file_name || 'Checklist 2',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fused-checklist-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const acceptedCount = Array.from(fusionDecisions.values()).filter(
    (d) => d.status === 'accepted' || d.status === 'edited'
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Checklist Fusion
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Intelligent audit checklist fusion for dual-standard compliance
              </p>
            </div>
            <div className="flex items-center gap-2">
              {fusionSuggestions.length > 0 && (
                <span className="text-sm text-gray-600">
                  {fusionSuggestions.length} suggestions • {acceptedCount} accepted
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Panel - Checklist 1 */}
          <div className="lg:col-span-3">
            <UploadPanel
              title="Checklist 1"
              checklist={checklist1}
              pdfFile={pdfFile1}
              loading={checklist1Loading}
              error={checklist1Error}
              onUpload={handleUploadChecklist1}
            />
          </div>

          {/* Middle Panel - Fusion Suggestions */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Fusion Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fusionSuggestionsLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-gray-600 mt-3">
                      Analyzing checklists and generating fusion suggestions...
                    </p>
                  </div>
                )}

                {fusionSuggestionsError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-xs text-red-600 mt-1">
                        {fusionSuggestionsError}
                      </p>
                    </div>
                  </div>
                )}

                {!checklist1 && !checklist2 && !fusionSuggestionsLoading && (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">
                      Upload both checklists to see fusion suggestions
                    </p>
                  </div>
                )}

                {fusionSuggestions.length > 0 && (
                  <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {fusionSuggestions.map((suggestion) => (
                      <FusionSuggestionItem
                        key={suggestion.id}
                        suggestion={suggestion}
                        decision={fusionDecisions.get(suggestion.id)}
                        onAccept={() => acceptFusion(suggestion.id)}
                        onReject={() => rejectFusion(suggestion.id)}
                        onEdit={() => handleEditSuggestion(suggestion)}
                        onClear={() => clearFusionDecision(suggestion.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Checklist 2 */}
          <div className="lg:col-span-3">
            <UploadPanel
              title="Checklist 2"
              checklist={checklist2}
              pdfFile={pdfFile2}
              loading={checklist2Loading}
              error={checklist2Error}
              onUpload={handleUploadChecklist2}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {acceptedCount > 0 ? (
                <span>
                  {acceptedCount} fusion{acceptedCount !== 1 ? 's' : ''} ready to generate
                </span>
              ) : (
                <span>Accept fusion suggestions to generate checklist</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!fusedChecklist ? (
                <Button
                  onClick={handleGenerateFusedChecklist}
                  disabled={acceptedCount === 0}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Fused Checklist
                </Button>
              ) : (
                <Button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <FusionEditModal
        open={!!editingSuggestion}
        suggestion={editingSuggestion}
        onClose={() => setEditingSuggestion(null)}
        onSave={handleSaveEdit}
      />
    </main>
  );
}
