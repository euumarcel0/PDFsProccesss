import React from 'react';
import { User, Settings, FileText, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (modal: 'account' | 'settings' | 'questionnaires') => void;
  onLogout: () => void;
}

export function Sidebar({ isOpen, onClose, onOpenModal, onLogout }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="flex-1 py-4">
            <button
              onClick={() => {
                onClose();
                onOpenModal('account');
              }}
              className="w-full px-4 py-3 flex items-center text-gray-700 hover:bg-gray-100"
            >
              <User className="h-5 w-5 mr-3" />
              Conta
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenModal('settings');
              }}
              className="w-full px-4 py-3 flex items-center text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-5 w-5 mr-3" />
              Configurações
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenModal('questionnaires');
              }}
              className="w-full px-4 py-3 flex items-center text-gray-700 hover:bg-gray-100"
            >
              <FileText className="h-5 w-5 mr-3" />
              Questionários
            </button>
          </div>

          <div className="border-t py-4">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full px-4 py-3 flex items-center text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}