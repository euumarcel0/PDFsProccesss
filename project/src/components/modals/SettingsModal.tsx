import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Sun, Moon, Monitor } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadSettings();
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('theme_preference')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data?.theme_preference) {
        setTheme(data.theme_preference as 'light' | 'dark' | 'system');
        applyTheme(data.theme_preference);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  };

  const updateTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      setIsLoading(true);
      setError(null);

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      // First update the UI immediately
      setTheme(newTheme);
      applyTheme(newTheme);

      if (!existingProfile) {
        // Create new profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert([{ 
            user_id: userId,
            theme_preference: newTheme 
          }]);

        if (createError) throw createError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ theme_preference: newTheme })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error updating theme:', err);
      setError('Erro ao atualizar tema');
      // Revert theme if save failed
      loadSettings();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configurações</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tema</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => updateTheme('light')}
                disabled={isLoading}
                className={`p-4 rounded-lg border flex flex-col items-center ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Sun className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Claro</span>
              </button>

              <button
                onClick={() => updateTheme('dark')}
                disabled={isLoading}
                className={`p-4 rounded-lg border flex flex-col items-center ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Moon className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Escuro</span>
              </button>

              <button
                onClick={() => updateTheme('system')}
                disabled={isLoading}
                className={`p-4 rounded-lg border flex flex-col items-center ${
                  theme === 'system'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
               >
                <Monitor className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Sistema</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}