import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, User } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  age: number;
  created_at: string;
  email: string;
  avatar_url: string;
}

export function AccountModal({ isOpen, onClose, userId }: AccountModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    email: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{ user_id: userId }])
          .select()
          .single();
          
        if (createError) throw createError;
        
        const combinedProfile = {
          ...newProfile,
          email: user.email || '',
          created_at: user.created_at || '',
          avatar_url: ''
        };
        
        setProfile(combinedProfile);
        setFormData({
          first_name: '',
          last_name: '',
          age: '',
          email: user.email || '',
          avatar_url: ''
        });
        return;
      }

      if (profileError) throw profileError;

      const combinedProfile = {
        ...profileData,
        email: user.email || '',
        created_at: user.created_at || '',
        avatar_url: profileData?.avatar_url || ''
      };

      setProfile(combinedProfile);
      setFormData({
        first_name: combinedProfile.first_name || '',
        last_name: combinedProfile.last_name || '',
        age: combinedProfile.age?.toString() || '',
        email: combinedProfile.email || '',
        avatar_url: combinedProfile.avatar_url || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      setIsLoading(true);
  
      // Displaying selected file details
      console.log('Arquivo selecionado:', file);
  
      // Upload to Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;
  
      console.log('Caminho do arquivo:', filePath);
  
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
  
      if (uploadError) throw uploadError;
  
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
  
      // Check if the user already has a profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
  
      if (profileError && profileError.code === 'PGRST116') {
        // Profile does not exist, create a new one
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            avatar_url: publicUrl, // Insert new avatar URL
          }]);
  
        if (createError) throw createError;
      } else if (existingProfile) {
        // Profile exists, update avatar URL
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            avatar_url: publicUrl // Update avatar URL for the existing profile
          })
          .eq('user_id', userId);
  
        if (updateError) throw updateError;
      }
  
      // Update profile state with the new avatar URL
      setProfile((prevProfile) => ({
        ...prevProfile!,
        avatar_url: publicUrl
      }));
  
      await loadProfile(); // Reload profile to make sure everything is up-to-date
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError('Erro ao atualizar foto de perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        // Create new profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: userId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            age: parseInt(formData.age) || null,
            theme_preference: profile?.theme_preference || 'system'
          }]);

        if (createError) throw createError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            age: parseInt(formData.age) || null,
            theme_preference: profile?.theme_preference || 'system'
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }
      
      await loadProfile();
      setIsEditingProfile(false);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Erro ao atualizar perfil. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // First verify current password
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) throw getUserError;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        setError('Senha atual incorreta');
        return;
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      alert('Senha atualizada com sucesso!');
      setIsEditingPassword(false);
      setNewPassword('');
      setCurrentPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Erro ao atualizar senha. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informações da Conta</h2>
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

          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <div className="space-y-4">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700">
                    <Upload className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>

              {isEditingProfile ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sobrenome</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Idade</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{profile?.email || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{profile?.first_name || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sobrenome</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{profile?.last_name || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Idade</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">{profile?.age || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Criação</label>
                    <p className="mt-1 text-gray-900 dark:text-gray-100">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mb-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Editar Informações
                    </button>

                    <button
                      onClick={() => setIsEditingPassword(!isEditingPassword)}
                      className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Alterar Senha
                    </button>
                  </div>

                  {isEditingPassword && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Senha Atual
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nova Senha
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePasswordChange}
                          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Atualizar Senha
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingPassword(false);
                            setNewPassword('');
                            setCurrentPassword('');
                          }}
                          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}