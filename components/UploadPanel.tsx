"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { PdfPreview } from './PdfPreview';
import type { Checklist } from '@/lib/types/database';

interface UploadPanelProps {
  title: string;
  checklist: Checklist | null;
  pdfFile?: File | null;
  loading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<void>;
}

export function UploadPanel({
  title,
  checklist,
  pdfFile,
  loading,
  error,
  onUpload,
}: UploadPanelProps) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }

      try {
        setUploadProgress(0);
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => setUploadProgress(0), 1000);
      } catch (err) {
        console.error('Upload error:', err);
        setUploadProgress(0);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {!checklist && !loading && (
          <div
            {...getRootProps()}
            className={`
              flex-1 border-2 border-dashed rounded-lg p-6
              flex flex-col items-center justify-center gap-4
              cursor-pointer transition-colors
              ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <FileText className="w-12 h-12 text-primary animate-pulse" />
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm text-center text-gray-600">
                Processing PDF...
              </p>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {checklist && !loading && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium truncate">
                  {checklist.file_name}
                </span>
              </div>
              <button
                onClick={() => onUpload(new File([], ''))}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Change
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <PdfPreview checklist={checklist} pdfFile={pdfFile} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
