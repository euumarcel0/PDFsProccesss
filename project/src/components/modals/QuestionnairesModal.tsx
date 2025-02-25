import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, FileText } from 'lucide-react';
import type { Question } from '../../types';

interface QuestionnairesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSelectQuestionnaire: (questions: Question[]) => void;
}

interface Questionnaire {
  id: string;
  title: string;
  questions: Question[] | string;
  created_at: string;
}

export function QuestionnairesModal({
  isOpen,
  onClose,
  userId,
  onSelectQuestionnaire,
}: QuestionnairesModalProps) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]); // Novo estado

  useEffect(() => {
    if (isOpen && userId) {
      loadQuestionnaires();
    }
  }, [isOpen, userId]);

  const loadQuestionnaires = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pdf_questionnaires')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestionnaires(data || []);
    } catch (err) {
      console.error('Error loading questionnaires:', err);
      setError('Erro ao carregar questionários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuestionnaire = (questionnaire: Questionnaire) => {
    let questions = questionnaire.questions;
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
      } catch (error) {
        console.error('Error parsing questions JSON:', error);
        questions = [];
      }
    }

    // Atualiza o estado com as questões do questionário selecionado
    setSelectedQuestions(questions);
    setSelectedQuestionnaire(questionnaire);
    onSelectQuestionnaire(questions); // Notifica o componente pai se necessário
  };

  const handleClose = () => {
    setSelectedQuestionnaire(null);
    setSelectedQuestions([]); // Limpa as questões selecionadas
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Questionários Salvos</h2>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : questionnaires.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhum questionário salvo</div>
          ) : (
            <div className="grid gap-4">
              {questionnaires.map((questionnaire) => (
                <button
                  key={questionnaire.id}
                  onClick={() => handleSelectQuestionnaire(questionnaire)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{questionnaire.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(questionnaire.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Exibe as questões selecionadas na área principal da tela (fora do modal)
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {selectedQuestions.map((question, index) => (
            <div key={index} className="mb-8 last:mb-0">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Questão {question.number}</h3>
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
};
