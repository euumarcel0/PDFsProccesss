import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function PDFUploader({ onFileSelect, isLoading }: PDFUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-500 transition-colors cursor-pointer"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <Upload className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {isLoading ? 'Processando PDF...' : 'Arraste seu PDF aqui'}
          </p>
          <p className="text-sm text-gray-500">ou</p>
          <label className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            Selecione um arquivo
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}