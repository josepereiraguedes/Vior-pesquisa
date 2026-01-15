import React, { useState, useEffect } from 'react';
import { SurveyFlow } from './components/SurveyFlow';
import { Dashboard } from './components/Dashboard';
import { SurveyResponse, CompletedSurvey } from './types';
import { MOCK_RESPONSES, SHARING_MESSAGE } from './constants';
import { Share2, Sparkles, Check, Loader2, Lock, MessageCircle } from 'lucide-react';
import { supabase } from './services/supabaseClient';

type View = 'welcome' | 'survey' | 'thank_you' | 'dashboard';

const ADMIN_PIN = '1234'; // Simple PIN for dashboard access

const App: React.FC = () => {
  const [view, setView] = useState<View>('welcome');
  const [surveyData, setSurveyData] = useState<CompletedSurvey[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  
  const [copied, setCopied] = useState(false);

  // Handle Routing and Data Loading on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');

    if (page === 'dashboard') {
      setView('dashboard');
    } else {
      setView('welcome');
    }
  }, []);

  // Fetch data only when authenticated admin views dashboard
  useEffect(() => {
    if (view === 'dashboard' && isAdminAuthenticated) {
        fetchSurveyData();
    }
  }, [view, isAdminAuthenticated]);

  const fetchSurveyData = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching data:', error);
        alert('Erro ao carregar dados do Supabase. Verifique se a tabela "surveys" foi criada.');
      } else if (data) {
        // Map Supabase rows to our app type
        const formattedData: CompletedSurvey[] = data.map((row: any) => ({
            id: row.id,
            timestamp: new Date(row.created_at).getTime(),
            responses: row.responses,
        }));
        setSurveyData(formattedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleStart = () => setView('survey');

  const handleSurveyComplete = async (responses: SurveyResponse[]) => {
    // 1. Show Thank You screen immediately for better UX
    setView('thank_you');

    // 2. Save to Supabase
    try {
        const { error } = await supabase.from('surveys').insert({
            responses: responses
        });

        if (error) {
            console.error('Error saving survey:', error);
            alert('Houve um erro ao salvar sua resposta. Por favor, tente novamente.');
        }
    } catch (err) {
        console.error('Connection error:', err);
    }
  };

  const handleResetData = async () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os dados do banco de dados permanentemente. Tem certeza?')) {
        setLoadingData(true);
        const { error } = await supabase
            .from('surveys')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows where ID is not empty UUID
        
        setLoadingData(false);
        if (error) {
            alert('Erro ao limpar dados. Verifique as políticas (RLS) no Supabase.');
            console.error(error);
        } else {
            setSurveyData([]);
        }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPinInput === ADMIN_PIN) {
          setIsAdminAuthenticated(true);
      } else {
          alert('Senha incorreta!');
          setAdminPinInput('');
      }
  }

  const copyShareMessage = () => {
      // Clean the URL to ensure we share the public link (without ?page=dashboard)
      const baseUrl = window.location.origin + window.location.pathname;
      navigator.clipboard.writeText(SHARING_MESSAGE.replace('[LINK]', baseUrl));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  // Welcome Screen (Public)
  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

        <div className="max-w-md w-full text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-8 border border-slate-100">
             <span className="text-3xl mr-2">💄</span>
             <span className="text-3xl">✨</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            Vior Store <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Insights</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Ajude a <strong>Vior Store</strong> a preparar o lançamento ideal para você!
            Responda nosso quiz (2 min) e <strong>concorra a um Kit de Cosméticos exclusivo</strong>! 🎁
          </p>

          <button 
            onClick={handleStart}
            className="w-full py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl shadow-xl shadow-purple-200 hover:scale-[1.02] transition-transform active:scale-95 mb-4"
          >
            Começar Quiz
          </button>
        </div>
      </div>
    );
  }

  // Thank You Screen
  if (view === 'thank_you') {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md w-full animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="text-green-600" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Cadastro Confirmado! 🎉</h2>
                <p className="text-slate-600 mb-8">
                    Suas respostas foram enviadas com sucesso.
                    <br/><br/>
                    <strong>Agora cruze os dedos! 🤞</strong><br/>
                    O sorteio será realizado utilizando o seu <strong>número de WhatsApp</strong>. Fique de olho, se você ganhar, entraremos em contato por lá!
                </p>

                {/* WhatsApp Confirmation Visual */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl mb-8 relative shadow-sm">
                    <div className="flex flex-col items-center justify-center">
                        <div className="p-3 bg-white rounded-full mb-3 shadow-sm">
                            <MessageCircle className="text-green-500" size={24} />
                        </div>
                        <span className="block text-sm text-green-800 font-bold mb-1">Entrada no Sorteio Validada</span>
                        <p className="text-xs text-green-600 mt-1">Seu WhatsApp é sua chave de participação.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={copyShareMessage}
                        className="w-full py-3 bg-pink-100 text-pink-700 font-bold rounded-xl hover:bg-pink-200 transition-colors flex items-center justify-center"
                    >
                        {copied ? <Check size={18} className="mr-2"/> : <Share2 size={18} className="mr-2" />}
                        {copied ? 'Link Copiado!' : 'Convidar Amigas'}
                    </button>
                    
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-3 text-slate-400 hover:text-slate-600 font-medium text-sm"
                    >
                        Voltar ao Início
                    </button>
                </div>
              </div>
          </div>
      )
  }

  // Survey Flow
  if (view === 'survey') {
    return <SurveyFlow onComplete={handleSurveyComplete} />;
  }

  // Dashboard (Restricted View)
  if (view === 'dashboard') {
    // 1. PIN Auth Check
    if (!isAdminAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <Lock size={32} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Acesso Restrito</h2>
                    <p className="text-slate-500 text-center mb-6 text-sm">Digite a senha de administrador para acessar os dados.</p>
                    <form onSubmit={handleAdminLogin}>
                        <input 
                            type="password" 
                            value={adminPinInput}
                            onChange={(e) => setAdminPinInput(e.target.value)}
                            placeholder="Senha (PIN)"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-center text-lg tracking-widest focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Entrar
                        </button>
                    </form>
                    <button 
                        onClick={() => {
                            window.history.pushState({}, '', window.location.pathname);
                            setView('welcome');
                        }}
                        className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600"
                    >
                        Voltar ao site
                    </button>
                </div>
            </div>
        )
    }

    // 2. Loading State
    if (loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-2" />
                    <p className="text-slate-500">Conectando ao banco de dados...</p>
                </div>
            </div>
        )
    }

    // 3. Dashboard Content
    return (
        <Dashboard 
            data={surveyData} 
            onBack={() => {
                // Clear query param to go back to public view
                window.history.pushState({}, '', window.location.pathname);
                setIsAdminAuthenticated(false); // Logout on exit
                setView('welcome');
            }} 
            onReset={handleResetData} 
        />
    );
  }

  return null;
};

export default App;