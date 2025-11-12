"use client";

import { useState } from 'react';
import { Check, X, Edit, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { formatItemReference } from '@/lib/utils';
import type { FusionSuggestionWithDetails, FusionStatus } from '@/lib/types/database';

interface FusionSuggestionItemProps {
  suggestion: FusionSuggestionWithDetails;
  decision: { status: FusionStatus; customText?: string } | undefined;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onClear: () => void;
}

export function FusionSuggestionItem({
  suggestion,
  decision,
  onAccept,
  onReject,
  onEdit,
  onClear,
}: FusionSuggestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayText = decision?.customText || suggestion.suggested_text;

  const getStatusColor = () => {
    if (!decision) return '';
    switch (decision.status) {
      case 'accepted':
        return 'border-green-500 bg-green-50';
      case 'rejected':
        return 'border-red-500 bg-red-50';
      case 'edited':
        return 'border-blue-500 bg-blue-50';
      default:
        return '';
    }
  };

  const getStatusBadge = () => {
    if (!decision) return null;

    const badges = {
      accepted: (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
          <Check className="w-3 h-3" />
          Accepted
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
          <X className="w-3 h-3" />
          Rejected
        </span>
      ),
      edited: (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
          <Edit className="w-3 h-3" />
          Edited
        </span>
      ),
    };

    return badges[decision.status];
  };

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500">
                  Similarity: {(suggestion.similarity_score * 100).toFixed(0)}%
                </span>
                {getStatusBadge()}
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Fused Text */}
          <div className="p-3 bg-white border border-gray-200 rounded-md">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Suggested Fusion:
            </p>
            <p className="text-sm text-gray-900 leading-relaxed">
              {displayText}
            </p>
          </div>

          {/* Source Items (Collapsible) */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">
                    From Checklist 1:
                  </p>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {formatItemReference('A', suggestion.sourceItems.item1)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {suggestion.sourceItems.item1.text}
                </p>
                {suggestion.sourceItems.item1.references &&
                  suggestion.sourceItems.item1.references.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Ref: {suggestion.sourceItems.item1.references.join(', ')}
                    </p>
                  )}
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">
                    From Checklist 2:
                  </p>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                    {formatItemReference('B', suggestion.sourceItems.item2)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {suggestion.sourceItems.item2.text}
                </p>
                {suggestion.sourceItems.item2.references &&
                  suggestion.sourceItems.item2.references.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Ref: {suggestion.sourceItems.item2.references.join(', ')}
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {!decision ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={onAccept}
                  className="flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onReject}
                  className="flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClear}
                className="text-xs"
              >
                Clear Decision
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
