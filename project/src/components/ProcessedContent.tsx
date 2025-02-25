import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import type { ProcessedPage, Question } from '../types';
import * as XLSX from 'xlsx';

interface ProcessedContentProps {
  pages: ProcessedPage[];
  questions?: Question[];
  onSave: () => void;
}

export function ProcessedContent({ pages, questions, onSave }: ProcessedContentProps) {
  const [showForm, setShowForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const downloadExcel = () => {
    if (!questions) return;

    const worksheet = XLSX.utils.json_to_sheet(
      questions.map(q => ({
        'Questão': q.text,
        'A': q.alternatives.find(alt => alt.letter === 'A')?.text || '',
        'B': q.alternatives.find(alt => alt.letter === 'B')?.text || '',
        'C': q.alternatives.find(alt => alt.letter === 'C')?.text || '',
        'D': q.alternatives.find(alt => alt.letter === 'D')?.text || '',
        'E': q.alternatives.find(alt => alt.letter === 'E')?.text || ''
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questões');
    XLSX.writeFile(workbook, 'questoes-extraidas.xlsx');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Conteúdo Processado</h2>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-x-4 sm:space-y-0">
        <button
            onClick={downloadExcel}
            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Excel
          </button>
          <button
            onClick={onSave}
            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Salvar Questionário
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {questions?.map((question, index) => (
            <div key={index} className="mb-8 last:mb-0">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Questão {question.number}
              </h3>
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-sm text-gray-700">{question.text}</p>
              </div>
              <div className="space-y-2">
                {question.alternatives.map((alt) => (
                  <div key={alt.letter} className="flex items-start p-2 hover:bg-gray-50 rounded-md">
                    <span className="font-medium text-gray-700 mr-2">
                      {alt.letter})
                    </span>
                    <p className="text-sm text-gray-700">{alt.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}