import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { PDFUploader } from './components/PDFUploader';
import { ProcessedContent } from './components/ProcessedContent';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { AccountModal } from './components/modals/AccountModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { QuestionnairesModal } from './components/modals/QuestionnairesModal';
import { supabase } from './lib/supabase';
import { extractTextFromPDF, processQuestionsFromText } from './utils/pdfUtils';
import type { ProcessedPage, FormField, Question } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [processedPages, setProcessedPages] = useState<ProcessedPage[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; stage: string }>({
    current: 0,
    total: 0,
    stage: ''
  });
  const [session, setSession] = useState(null);
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'account' | 'settings' | 'questionnaires' | null>(
    null
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Load theme preference
    const loadTheme = async () => {
      if (session?.user?.id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('theme_preference')
          .eq('user_id', session.user.id)
          .single();
        
        if (data?.theme_preference) {
          document.documentElement.classList.remove('light', 'dark');
          if (data.theme_preference === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (data.theme_preference === 'light') {
            document.documentElement.classList.add('light');
          } else {
            // System preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.add('light');
            }
          }
        }
      }
    };

    loadTheme();

    return () => subscription.unsubscribe();
  }, []);

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setQuestions([]);
      setProgress({ current: 0, total: 1, stage: 'Iniciando processamento...' });
      
      setProgress(prev => ({ ...prev, stage: 'Extraindo texto do PDF...' }));
      const extractedTexts = await extractTextFromPDF(file, (current, total) => {
        setProgress({ current, total, stage: 'Extraindo texto do PDF...' });
      });

      if (!extractedTexts || extractedTexts.length === 0) {
        throw new Error('Não foi possível extrair texto do PDF.');
      }

      setProgress({ current: 1, total: 2, stage: 'Processando questões...' });
      const result = await processQuestionsFromText(extractedTexts);
      
      if (!result || !result.questions || result.questions.length === 0) {
        throw new Error('Não foi possível encontrar questões no PDF.');
      }

      setQuestions(result.questions);
      setProgress({ current: 2, total: 2, stage: 'Processamento concluído!' });
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar o PDF');
      setQuestions([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setProgress({ current: 0, total: 0, stage: '' });
      }, 1000);
    }
  };


  const handleSaveQuestionnaire = async () => {
    if (!questions.length || !questionnaireName || !session?.user?.id) {
      setError('Preencha o nome do questionário');
      return;
    }

    try {
      setIsLoading(true);
      
      // Dados para salvar no banco
      const dataToInsert = {
        title: questionnaireName,
        questions: JSON.stringify(questions), // Certifique-se de que as questões estão sendo enviadas como uma string JSON, se necessário
        user_id: session.user.id
      };

      // Log para verificar os dados
      console.log('Dados para salvar:', dataToInsert);

      // Inserção no banco de dados
      const { error } = await supabase
        .from('pdf_questionnaires')
        .insert([dataToInsert]);

      if (error) throw error;

      // Após salvar, resetar o estado
      setShowNameDialog(false);
      setQuestionnaireName('');
      alert('Questionário salvo com sucesso!');
    } catch (err) {
      console.error('Error saving questionnaire:', err); // Logando o erro para depuração
      setError('Erro ao salvar questionário. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  

  const handleSelectQuestionnaire = (selectedQuestions: Question[]) => {
    setQuestions(selectedQuestions);
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Sistema de Processamento de PDF
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
            Extraia questões dos seus PDFs automaticamente
          </p>
        </div>

        <PDFUploader onFileSelect={handleFileSelect} isLoading={isLoading} />

        {(isLoading || progress.stage) && (
          <div className="mt-4 max-w-2xl mx-auto">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress.stage}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 max-w-2xl mx-auto p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
            <p className="text-red-600 dark:text-red-200">{error}</p>
          </div>
        )}

        {questions && questions.length > 0 && (
          <>
            <ProcessedContent 
              questions={questions} 
              pages={processedPages} 
              onSave={() => setShowNameDialog(true)}
            />

            {showNameDialog && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Nome do Questionário
                  </h3>
                  <input
                    type="text"
                    value={questionnaireName}
                    onChange={(e) => setQuestionnaireName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Digite o nome do questionário"
                  />
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowNameDialog(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveQuestionnaire}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenModal={(modal) => {
            setActiveModal(modal);
            setIsSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />

        <AccountModal
          isOpen={activeModal === 'account'}
          onClose={() => setActiveModal(null)}
          userId={session?.user?.id}
        />

        <SettingsModal
          isOpen={activeModal === 'settings'}
          onClose={() => setActiveModal(null)}
          userId={session?.user?.id}
        />

        <QuestionnairesModal
          isOpen={activeModal === 'questionnaires'}
          onClose={() => setActiveModal(null)}
          userId={session?.user?.id}
          onSelectQuestionnaire={handleSelectQuestionnaire}
        />
      </div>
    </div>
  );
}

export default App;