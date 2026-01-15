import React, { useState, useEffect } from 'react';
import { CompletedSurvey } from '../types';
import { SURVEY_QUESTIONS } from '../constants';
import { analyzeSurveyData } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Sparkles, Download, ArrowLeft, Loader2, TrendingUp, Users, DollarSign, ShoppingBag, Trash2, Database, MessageCircle, User } from 'lucide-react';

interface DashboardProps {
  data: CompletedSurvey[];
  onBack: () => void;
  onReset: () => void;
}

const COLORS = ['#F472B6', '#C084FC', '#818CF8', '#FB7185', '#34D399'];

export const Dashboard: React.FC<DashboardProps> = ({ data, onBack, onReset }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Extract Leads Logic
  const leads = React.useMemo(() => {
      return data.map(entry => {
          const name = entry.responses.find(r => r.questionId === 'name')?.answer || 'N/A';
          const whatsapp = entry.responses.find(r => r.questionId === 'whatsapp')?.answer || 'N/A';
          return {
              id: entry.id,
              date: new Date(entry.timestamp).toLocaleDateString('pt-BR'),
              time: new Date(entry.timestamp).toLocaleTimeString('pt-BR'),
              name,
              whatsapp
          };
      });
  }, [data]);

  // Aggregate Data for Charts
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(s => {
      const ans = s.responses.find(r => r.questionId === 'category')?.answer as string;
      if (ans) counts[ans] = (counts[ans] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const platformData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(s => {
      const ans = s.responses.find(r => r.questionId === 'location')?.answer as string[];
      if (Array.isArray(ans)) {
        ans.forEach(a => counts[a] = (counts[a] || 0) + 1);
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const onlineInterestAvg = React.useMemo(() => {
     if (data.length === 0) return 0;
     let sum = 0;
     let count = 0;
     data.forEach(s => {
         const ans = s.responses.find(r => r.questionId === 'online_interest')?.answer;
         if (typeof ans === 'number') {
             sum += ans;
             count++;
         }
     });
     return count > 0 ? (sum / count).toFixed(1) : 0;
  }, [data]);

  const handleAiAnalysis = async () => {
    if (data.length === 0) {
        alert("Não há dados suficientes para análise.");
        return;
    }
    setLoadingAi(true);
    try {
      const result = await analyzeSurveyData(data);
      if (result) setAnalysis(result);
    } catch (e) {
      alert("Falha ao buscar insights da IA. Verifique se a chave de API está configurada corretamente.");
    } finally {
      setLoadingAi(false);
    }
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    const headers = SURVEY_QUESTIONS.map(q => q.text).join(',');
    const rows = data.map(s => {
      return SURVEY_QUESTIONS.map(q => {
        const r = s.responses.find(res => res.questionId === q.id);
        return r ? `"${Array.isArray(r.answer) ? r.answer.join(';') : r.answer}"` : '""';
      }).join(',');
    }).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pesquisa_vior_store.csv");
    document.body.appendChild(link);
    link.click();
  };

  if (data.length === 0) {
      return (
          <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="text-slate-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Sem dados ainda</h2>
                <p className="text-slate-500 mb-6">Compartilhe o link da pesquisa para começar a coletar respostas.</p>
                <button onClick={onBack} className="text-pink-600 font-medium hover:underline">Voltar ao Início</button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <button onClick={onBack} className="text-slate-500 hover:text-slate-700 flex items-center mb-2">
              <ArrowLeft size={16} className="mr-1" /> Voltar ao Início
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Vior Store</h1>
            <p className="text-slate-500 text-sm">Insights em tempo real de {data.length} respostas</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-end">
            <button 
                onClick={onReset}
                className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
                title="Apagar todos os dados"
            >
                <Trash2 size={16} className="mr-2" /> Limpar
            </button>
            <button 
              onClick={downloadCSV}
              className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              <Download size={16} className="mr-2" /> CSV
            </button>
            <button 
              onClick={handleAiAnalysis}
              disabled={loadingAi}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm shadow-md shadow-purple-200"
            >
              {loadingAi ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
              {analysis ? 'Atualizar Insights' : 'Gerar Insights com IA'}
            </button>
          </div>
        </div>

        {/* Leads Table (New Section) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-green-50/50 flex items-center">
                 <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-3">
                    <Users size={20} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">Lista de Leads (Participantes)</h3>
                    <p className="text-sm text-slate-500">Contatos qualificados para o sorteio e marketing</p>
                 </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">WhatsApp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs">
                                    {lead.date} <span className="text-slate-400">{lead.time}</span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                                    <User size={14} className="mr-2 text-slate-400" />
                                    {lead.name}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center text-green-700 font-medium">
                                        <MessageCircle size={14} className="mr-2" />
                                        {lead.whatsapp}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Respostas</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{data.length}</h3>
              </div>
              <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Users size={20} /></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria Favorita</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 uppercase text-sm sm:text-2xl truncate max-w-[120px] sm:max-w-none">
                  {categoryData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
                </h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><ShoppingBag size={20} /></div>
            </div>
          </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Médio</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Variado</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><DollarSign size={20} /></div>
            </div>
          </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interesse Online</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{onlineInterestAvg}/5</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Preferência por Categoria</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={categoryData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {categoryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Canais de Compra</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={platformData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                   <YAxis />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="value" fill="#818CF8" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

        </div>

         {/* AI Insight Section */}
         {analysis && (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100 relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Sparkles size={120} className="text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Sparkles className="text-purple-500 mr-2" size={20} />
              Análise Estratégica (IA)
            </h2>
            <div 
              className="prose prose-purple max-w-none text-slate-600"
              dangerouslySetInnerHTML={{ __html: analysis }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};