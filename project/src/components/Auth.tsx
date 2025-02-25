import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Github, Mail, User } from 'lucide-react';
import './Auth.css';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na autenticação');
    }
  };

  return (
    <div className="auth-container">
      <h2>Sistema de Processamento de PDF</h2>
      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
        <div className="form-container sign-up-container">
          <form onSubmit={(e) => handleSubmit(e, true)}>
            <h1>Criar Conta</h1>
            <div className="social-container">
              <button 
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="social"
              >
                <Github />
              </button>
              <button 
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="social"
              >
                <Mail />
              </button>
            </div>
            <span>ou use seu email para registro</span>
            <input 
              type="text" 
              placeholder="Nome" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="error-message">{error}</p>}
            <button disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Cadastrar'}
            </button>
          </form>
        </div>
        <div className="form-container sign-in-container">
          <form onSubmit={(e) => handleSubmit(e, false)}>
            <h1>Entrar</h1>
            <div className="social-container">
              <button 
                type="button"
                onClick={() => handleOAuthLogin('github')}
                className="social"
              >
                <Github />
              </button>
              <button 
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="social"
              >
                <Mail />
              </button>
            </div>
            <span>ou use sua conta</span>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="error-message">{error}</p>}
            <button disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Bem-vindo de volta!</h1>
              <p>Para se manter conectado conosco, faça login com suas informações pessoais</p>
              <button 
                className="ghost" 
                onClick={() => setIsRightPanelActive(false)}
              >
                Entrar
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Olá!</h1>
              <p>Insira seus dados pessoais e comece sua jornada conosco</p>
              <button 
                className="ghost" 
                onClick={() => setIsRightPanelActive(true)}
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}