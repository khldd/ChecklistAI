"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import type { FusionSuggestionWithDetails } from '@/lib/types/database';

interface FusionEditModalProps {
  open: boolean;
  suggestion: FusionSuggestionWithDetails | null;
  onClose: () => void;
  onSave: (customText: string) => void;
}

export function FusionEditModal({
  open,
  suggestion,
  onClose,
  onSave,
}: FusionEditModalProps) {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (suggestion) {
      setEditedText(suggestion.suggested_text);
    }
  }, [suggestion]);

  const handleSave = () => {
    if (editedText.trim()) {
      onSave(editedText.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedText(suggestion?.suggested_text || '');
    onClose();
  };

  if (!suggestion) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fusion Suggestion</DialogTitle>
          <DialogDescription>
            Modify the suggested text to better fit your requirements. Review
            both source items below for reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Source Item from Checklist 1
              </h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {suggestion.sourceItems.item1.text}
                </p>
                {suggestion.sourceItems.item1.references &&
                  suggestion.sourceItems.item1.references.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500">
                        References:
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {suggestion.sourceItems.item1.references.join(', ')}
                      </p>
                    </div>
                  )}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {suggestion.sourceItems.item1.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Source Item from Checklist 2
              </h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {suggestion.sourceItems.item2.text}
                </p>
                {suggestion.sourceItems.item2.references &&
                  suggestion.sourceItems.item2.references.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500">
                        References:
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {suggestion.sourceItems.item2.references.join(', ')}
                      </p>
                    </div>
                  )}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {suggestion.sourceItems.item2.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Edit Fused Text
            </h4>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Enter your custom fusion text..."
            />
            <p className="text-xs text-gray-500">
              {editedText.length} characters
            </p>
          </div>

          {/* Quick Tips */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">
              Quick Tips:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Ensure all critical requirements from both items are included</li>
              <li>Use clear, professional language</li>
              <li>Keep regulatory references intact</li>
              <li>Eliminate redundancy while maintaining completeness</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editedText.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
