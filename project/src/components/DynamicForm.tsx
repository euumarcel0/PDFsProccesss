import React, { useState } from 'react';
import type { FormField } from '../types';

interface DynamicFormProps {
  fields: FormField[];
}

export function DynamicForm({ fields }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    // Here you could implement saving to localStorage or downloading as CSV
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Formulário Dinâmico</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow sm:rounded-lg p-6">
        {fields.map((field) => (
          <div key={field.id}>
            <label
              htmlFor={field.id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                }
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                rows={4}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                }
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Selecione uma opção</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id={field.id}
                value={formData[field.id] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                }
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            )}
          </div>
        ))}
        <div className="pt-5">
          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Salvar Respostas
          </button>
        </div>
      </form>
    </div>
  );
}