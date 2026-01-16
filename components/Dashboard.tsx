import React, { useState, useMemo } from 'react';
import { CompletedSurvey } from '../types';
import { SURVEY_QUESTIONS } from '../constants';
import { analyzeSurveyData } from '../services/geminiService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, ArrowLeft, Loader2, TrendingUp, Users, DollarSign, ShoppingBag, Trash2, Database, MessageCircle, User, FileSpreadsheet, Filter, Eraser, Eye, X, Ticket, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { supabase } from '../services/supabaseClient';

interface DashboardProps {
  data: CompletedSurvey[];
  onBack: () => void;
  onReset: () => void;
  onDelete: (id: string) => void;
  onDataUpdate: () => Promise<void>;
}

const COLORS = ['#F472B6', '#C084FC', '#818CF8', '#FB7185', '#34D399'];

export const Dashboard: React.FC<DashboardProps> = ({ data, onBack, onReset, onDelete, onDataUpdate }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [winner, setWinner] = useState<any | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({});

  // Integrated analytics and filtering logic
  const { analytics, categoryStats, ageStats, platformData, leads, styleStats, freqStats, ticketStats, testingStats, onlineStats, topBrands, topProducts } = useMemo(() => {
    // 1. Filter data by category if needed
    const filteredData = selectedCategory === 'todos'
      ? data
      : data.filter(s => s.responses.find(r => r.questionId === 'category' && r.answer === selectedCategory));

    const total = filteredData.length;

    // 2. Aggregate stats
    const categoryCounts: Record<string, number> = {};
    const ageCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};
    const styleCounts: Record<string, number> = {};
    const freqCounts: Record<string, number> = {};
    const ticketCounts: Record<string, number> = {};
    const testingCounts: Record<string, number> = {};
    const onlineDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const brandMentions: Record<string, number> = {};
    const productMentions: Record<string, number> = {};
    let sumOnlineInterest = 0;
    let countOnlineInterest = 0;
    let countCoupons = 0;
    const leadList: any[] = [];

    filteredData.forEach(survey => {
      // Find name and whatsapp for the lead list
      const name = survey.responses.find(r => r.questionId === 'name')?.answer || 'Anônimo';
      const whatsapp = survey.responses.find(r => r.questionId === 'whatsapp')?.answer || 'N/A';
      const categoryId = survey.responses.find(r => r.questionId === 'category')?.answer || '';
      const styleId = survey.responses.find(r => r.questionId === 'style')?.answer || '';
      const ageId = survey.responses.find(r => r.questionId === 'age')?.answer || '';
      const freqId = survey.responses.find(r => r.questionId === 'frequency')?.answer || '';
      const ticketId = survey.responses.find(r => r.questionId === 'ticket')?.answer || '';
      const coupon = survey.responses.find(r => r.questionId === 'coupon')?.answer || '';
      if (coupon) countCoupons++;

      const dateObj = new Date(survey.timestamp || Date.now());

      leadList.push({
        id: survey.id,
        name: String(name),
        whatsapp: String(whatsapp),
        date: dateObj.toLocaleDateString('pt-BR'),
        time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        rawDate: dateObj,
        allResponses: survey.responses,
        // Profile Summary
        category: categoryId,
        style: styleId,
        age: ageId,
        frequency: freqId,
        ticket: ticketId,
        platforms: survey.responses.find(r => r.questionId === 'location')?.answer || [],
        coupon: coupon
      });

      // Aggregate each question
      survey.responses.forEach(r => {
        if (r.questionId === 'category') {
          const val = String(r.answer);
          categoryCounts[val] = (categoryCounts[val] || 0) + 1;
        }
        if (r.questionId === 'age') {
          const val = String(r.answer);
          ageCounts[val] = (ageCounts[val] || 0) + 1;
        }
        if (r.questionId === 'location' && Array.isArray(r.answer)) {
          r.answer.forEach(loc => {
            platformCounts[loc] = (platformCounts[loc] || 0) + 1;
          });
        }
        if (r.questionId === 'style') {
          const val = String(r.answer);
          styleCounts[val] = (styleCounts[val] || 0) + 1;
        }
        if (r.questionId === 'frequency') {
          const val = String(r.answer);
          freqCounts[val] = (freqCounts[val] || 0) + 1;
        }
        if (r.questionId === 'ticket') {
          const val = String(r.answer);
          ticketCounts[val] = (ticketCounts[val] || 0) + 1;
        }
        if (r.questionId === 'testing') {
          const val = String(r.answer);
          testingCounts[val] = (testingCounts[val] || 0) + 1;
        }
        if (r.questionId === 'online_interest' && typeof r.answer === 'number') {
          sumOnlineInterest += r.answer;
          countOnlineInterest++;
          const score = Math.round(r.answer);
          if (onlineDist[score] !== undefined) onlineDist[score]++;
        }
        if (r.questionId === 'brands' && typeof r.answer === 'string') {
          const brands = r.answer.split(/[,/;]|\se\s/).map(b => b.trim()).filter(b => b.length > 2);
          brands.forEach(b => {
            const normalized = b.toLowerCase().charAt(0).toUpperCase() + b.slice(1).toLowerCase();
            brandMentions[normalized] = (brandMentions[normalized] || 0) + 1;
          });
        }
        if (r.questionId === 'products' && typeof r.answer === 'string') {
          const items = r.answer.split(/[,/;]|\se\s/).map(i => i.trim()).filter(i => i.length > 2);
          items.forEach(i => {
            const normalized = i.toLowerCase().charAt(0).toUpperCase() + i.slice(1).toLowerCase();
            productMentions[normalized] = (productMentions[normalized] || 0) + 1;
          });
        }
      });
    });

    return {
      analytics: {
        totalLeads: total,
        onlineInterestAvg: countOnlineInterest > 0 ? (sumOnlineInterest / countOnlineInterest).toFixed(1) : '0',
        topCategory: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
        totalCoupons: countCoupons
      },
      categoryStats: Object.entries(categoryCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'category')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      ageStats: Object.entries(ageCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'age')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      styleStats: Object.entries(styleCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'style')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      freqStats: Object.entries(freqCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'frequency')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      ticketStats: Object.entries(ticketCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'ticket')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      testingStats: Object.entries(testingCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'testing')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      platformData: Object.entries(platformCounts).map(([id, value]) => {
        const option = SURVEY_QUESTIONS.find(q => q.id === 'location')?.options?.find(opt => opt.id === id);
        return { name: option ? option.label : id, value };
      }),
      onlineStats: Object.entries(onlineDist).map(([name, value]) => ({ name: `${name}⭐`, value })),
      topBrands: Object.entries(brandMentions).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
      topProducts: Object.entries(productMentions).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
      leads: leadList.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    };
  }, [data, selectedCategory]);

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
      alert("Falha ao buscar insights da IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  const drawWinner = () => {
    if (leads.length === 0) return;
    setIsRolling(true);
    setWinner(null);

    let count = 0;
    const interval = setInterval(() => {
      const tempWinner = leads[Math.floor(Math.random() * leads.length)];
      setWinner(tempWinner);
      count++;

      if (count > 20) {
        clearInterval(interval);
        const finalWinner = leads[Math.floor(Math.random() * leads.length)];
        setWinner(finalWinner);
        setIsRolling(false);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F472B6', '#C084FC', '#818CF8']
        });
      }
    }, 100);
  };

  const downloadExcel = () => {
    const worksheetData = leads.map(l => ({
      Data: l.date,
      Hora: l.time,
      Nome: l.name,
      WhatsApp: l.whatsapp,
      Cupom: l.coupon || '—',
      Status: l.allResponses.find((r: any) => r.questionId === 'coupon_redeemed' && r.answer === 'true') ? 'USADO' : 'PENDENTE'
    }));
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "Leads_Vior_Store.xlsx");
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    const headers = SURVEY_QUESTIONS.map(q => q.text).join(',');
    const rows = data.map(s => {
      return SURVEY_QUESTIONS.map(q => {
        const r = s.responses.find(res => res.questionId === q.id);
        const ans = r ? r.answer : '';
        return `"${Array.isArray(ans) ? ans.join(';') : ans}"`;
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

  const toggleRedemption = async (leadId: string, currentResponses: any[]) => {
    const isRedeemed = currentResponses.find((r: any) => r.questionId === 'coupon_redeemed' && r.answer === 'true');

    console.log('🔍 Toggle Redemption Started:', {
      leadId,
      currentlyRedeemed: !!isRedeemed,
      currentResponsesCount: currentResponses.length
    });

    // 1. Optimistic Update (Immediate)
    setOptimisticUpdates(prev => ({ ...prev, [leadId]: !isRedeemed }));

    let newResponses;

    if (isRedeemed) {
      newResponses = currentResponses.filter((r: any) => r.questionId !== 'coupon_redeemed');
    } else {
      newResponses = [...currentResponses, { questionId: 'coupon_redeemed', answer: 'true' }];
    }

    console.log('📝 New responses prepared:', {
      newResponsesCount: newResponses.length,
      hasCouponRedeemed: newResponses.some((r: any) => r.questionId === 'coupon_redeemed')
    });

    try {
      const { data, error } = await supabase
        .from('surveys')
        .update({ responses: newResponses })
        .eq('id', leadId)
        .select();

      console.log('💾 Supabase update result:', { data, error, leadId });

      if (error) throw error;

      // Refresh data from database
      await onDataUpdate();

      console.log('✅ Data refreshed successfully');

      if (!isRedeemed) {
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#34D399', '#10B981']
        });
      }
    } catch (err) {
      console.error('❌ Error updating coupon:', err);
      alert('Erro ao atualizar cupom. Tente novamente.');
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        delete newState[leadId];
        return newState;
      });
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-4 md:mb-0">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-700 flex items-center mb-2">
              <ArrowLeft size={16} className="mr-1" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Vior Store</h1>
            <p className="text-slate-500 text-sm">{analytics.totalLeads} respostas filtradas</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-end">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 appearance-none min-w-[170px]"
              >
                <option value="todos">Todas Categorias</option>
                <option value="makeup">Maquiagem 💄</option>
                <option value="skincare">Skincare 🧴</option>
                <option value="accessories">Acessórios 💍</option>
                <option value="perfume">Perfumes ✨</option>
              </select>
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              onClick={drawWinner}
              disabled={isRolling || leads.length === 0}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Sparkles size={16} className={`mr-2 ${isRolling ? 'animate-spin' : ''}`} />
              Sorteio
            </button>

            <button onClick={downloadExcel} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-md">
              <FileSpreadsheet size={16} className="mr-2" /> Excel
            </button>

            <button onClick={downloadCSV} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
              <Download size={16} className="mr-2" /> CSV
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('>>> [Dashboard] CLIQUE: Reset Total disparado');
                onReset();
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Limpar Tudo (Cuidado!)"
            >
              <Eraser size={20} />
            </button>
          </div>
        </div>

        {/* Winner Section */}
        {winner && (
          <div className={`p-8 bg-white rounded-2xl shadow-xl border-2 ${isRolling ? 'border-slate-200' : 'border-pink-500'} animate-fade-in text-center relative overflow-hidden`}>
            {isRolling ? (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="animate-spin text-pink-500 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sorteando Participante...</p>
                <h2 className="text-3xl font-black text-slate-300 mt-2">{winner.name}</h2>
              </div>
            ) : (
              <div>
                <div className="absolute top-0 left-0 w-full h-2 bg-pink-500" />
                <p className="text-pink-600 font-bold uppercase tracking-widest text-sm mb-2">🎉 PARABÉNS! TEMOS UM GANHADOR! 🎉</p>
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">{winner.name}</h2>
                <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                  <span className="text-slate-500 font-medium flex items-center bg-slate-50 px-4 py-2 rounded-full">
                    <MessageCircle size={16} className="mr-2 text-green-500" /> {winner.whatsapp}
                  </span>
                  <a
                    href={`https://wa.me/55${winner.whatsapp.replace(/\D/g, '')}?text=Olá ${winner.name}! Você acaba de ser sorteado na pesquisa da Vior Store e ganhou um Kit Exclusivo! 🌸✨`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition-all shadow-md active:scale-95"
                  >
                    Notificar Ganhador agora →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title="Total Leads" value={analytics.totalLeads} icon={<Users size={20} />} color="pink" />
          <MetricCard title="Top Categoria" value={analytics.topCategory} icon={<ShoppingBag size={20} />} color="purple" />
          <MetricCard title="Score Digital" value={`${analytics.onlineInterestAvg}/5`} icon={<TrendingUp size={20} />} color="blue" />
          <MetricCard title="Cupons Gerados" value={analytics.totalCoupons} icon={<Ticket size={20} />} color="green" />
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5 rounded-xl text-white shadow-lg overflow-hidden relative cursor-pointer active:scale-95 transition-transform" onClick={handleAiAnalysis}>
            <div className="relative z-10">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider">AI Insights</p>
              <h3 className="text-lg font-bold mt-1">Gerar Análise</h3>
            </div>
            <Sparkles className="absolute -bottom-2 -right-2 opacity-20 w-16 h-16" />
          </div>
        </div>

        {/* AI Insight Section */}
        {analysis && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-purple-100 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Sparkles className="text-purple-500 mr-2" size={20} /> Análise Estratégica (IA)
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: analysis }} />
          </div>
        )}

        {/* Highlights Row: Top Brands & Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-1 rounded-2xl shadow-lg">
            <div className="bg-white p-6 rounded-[14px] h-full">
              <h3 className="text-lg font-bold mb-4 flex items-center text-slate-800">
                <Sparkles size={18} className="mr-2 text-pink-500" /> Marcas mais Citadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {topBrands.length > 0 ? topBrands.map((b, i) => (
                  <div key={b.name} className="flex flex-col items-center bg-pink-50 px-4 py-3 rounded-xl border border-pink-100 min-w-[100px]">
                    <span className="text-xs font-bold text-pink-400 mb-1">#{i + 1}</span>
                    <span className="text-sm font-black text-pink-700">{b.name}</span>
                    <span className="text-[10px] text-pink-400 font-medium">{b.count} citações</span>
                  </div>
                )) : <p className="text-slate-400 text-sm">Aguardando respostas...</p>}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1 rounded-2xl shadow-lg">
            <div className="bg-white p-6 rounded-[14px] h-full">
              <h3 className="text-lg font-bold mb-4 flex items-center text-slate-800">
                <ShoppingBag size={18} className="mr-2 text-purple-500" /> Produtos Queridinhos
              </h3>
              <div className="flex flex-wrap gap-2">
                {topProducts.length > 0 ? topProducts.map((p, i) => (
                  <div key={p.name} className="flex flex-col items-center bg-purple-50 px-4 py-3 rounded-xl border border-purple-100 min-w-[100px]">
                    <span className="text-xs font-bold text-purple-400 mb-1">#{i + 1}</span>
                    <span className="text-sm font-black text-purple-700">{p.name}</span>
                    <span className="text-[10px] text-purple-400 font-medium">{p.count} citações</span>
                  </div>
                )) : <p className="text-slate-400 text-sm">Aguardando respostas...</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Category Preference */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center text-slate-800 uppercase tracking-wider">
              <ShoppingBag size={16} className="mr-2 text-pink-500" /> Categorias Amadas
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="value">
                    {categoryStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center text-slate-800 uppercase tracking-wider">
              <Users size={16} className="mr-2 text-blue-500" /> Faixa Etária
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center text-slate-800 uppercase tracking-wider">
              <TrendingUp size={16} className="mr-2 text-orange-500" /> Frequência de Mimos
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={freqStats} cx="50%" cy="50%" innerRadius={0} outerRadius={60} dataKey="value">
                    {freqStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket Range */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center text-slate-800 uppercase tracking-wider">
              <DollarSign size={16} className="mr-2 text-green-500" /> Investimento Mensal
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={110} fontSize={10} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#34D399" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Online vs Store */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center text-slate-800 uppercase tracking-wider">
              <ShoppingBag size={16} className="mr-2 text-indigo-500" /> Online vs Loja Física
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={onlineStats}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#818CF8" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">1 = Só Física | 5 = Só Online</p>
          </div>

          {/* Testing Curiosity */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center text-slate-800 uppercase tracking-wider">
              <Sparkles size={16} className="mr-2 text-purple-500" /> Amor por Novidades
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={testingStats} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {testingStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center">
              <Users size={20} className="text-slate-400 mr-2" />
              <h3 className="text-lg font-bold text-slate-800">Lista Geral de Participantes</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-4">Cadastro</th>
                  <th className="px-6 py-4">Participante</th>
                  <th className="px-6 py-4 text-center">Cupom</th>
                  <th className="px-6 py-4 text-center">WhatsApp</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                      <div className="flex flex-col items-center">
                        <Database size={32} className="mb-2 opacity-20" />
                        <p className="font-medium">Nenhum participante encontrado.</p>
                        <p className="text-xs">Aguardando novas respostas no quiz.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">
                        {lead.date} <span className="text-slate-300 ml-1">{lead.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {lead.coupon ? (() => {
                          const isRedeemedServer = lead.allResponses.find((r: any) => r.questionId === 'coupon_redeemed' && r.answer === 'true');
                          const isRedeemed = optimisticUpdates[lead.id] !== undefined ? optimisticUpdates[lead.id] : isRedeemedServer;

                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRedemption(lead.id, lead.allResponses);
                              }}
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border transition-all ${isRedeemed
                                ? 'bg-green-600 text-white border-green-700 hover:bg-green-700 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 border-dashed'
                                }`}
                              title={isRedeemed ? 'Clique para desmarcar' : 'Clique para marcar como usado'}
                            >
                              {isRedeemed ? (
                                <>
                                  <Check size={12} className="mr-1" /> {lead.coupon}
                                </>
                              ) : (
                                <>
                                  <Ticket size={12} className="mr-1" /> {lead.coupon}
                                </>
                              )}
                            </button>
                          )
                        })() : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <a
                          href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-green-700 font-medium text-xs hover:underline decoration-green-300"
                        >
                          <MessageCircle size={12} className="mr-1" /> {lead.whatsapp}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-all"
                          title="Ver Respostas Detalhadas"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('>>> [Dashboard] CLIQUE: Excluir item', lead.id);
                            onDelete(lead.id);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insight Section */}
        {analysis && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-purple-100 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Sparkles className="text-purple-500 mr-2" size={20} /> Análise Estratégica (IA)
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: analysis }} />
          </div>
        )}

        {/* Individual Details Modal */}
        <AnimatePresence>
          {selectedLead && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLead(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-pink-50 to-purple-50">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedLead.name}</h3>
                    <p className="text-slate-500 text-xs flex items-center mt-1">
                      <MessageCircle size={12} className="mr-1 text-green-500" /> {selectedLead.whatsapp} • {selectedLead.date} às {selectedLead.time}
                    </p>
                    {selectedLead.coupon && (
                      <span className="inline-flex items-center mt-2 px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-md border border-yellow-200">
                        <Ticket size={10} className="mr-1" /> CUPOM: {selectedLead.coupon}
                      </span>
                    )}
                    {selectedLead.allResponses.find((r: any) => r.questionId === 'coupon_redeemed' && r.answer === 'true') && (
                      <span className="inline-flex items-center mt-2 ml-2 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-200">
                        <Check size={10} className="mr-1" /> RESGATADO
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {SURVEY_QUESTIONS.map((q, idx) => {
                    const response = selectedLead.allResponses.find((r: any) => r.questionId === q.id);
                    let displayAnswer = response ? response.answer : '—';

                    // Format based on type
                    if (q.type === 'multiple_choice' && Array.isArray(displayAnswer)) {
                      displayAnswer = displayAnswer.map(id => {
                        const opt = q.options?.find(o => o.id === id);
                        return opt ? `${opt.emoji} ${opt.label}` : id;
                      }).join(', ');
                    } else if (q.type === 'single_choice' || q.type === 'image_select') {
                      const opt = q.options?.find(o => o.id === displayAnswer);
                      displayAnswer = opt ? `${opt.emoji} ${opt.label}` : displayAnswer;
                    } else if (q.type === 'rating') {
                      displayAnswer = `${displayAnswer} / 5 ⭐`;
                    }

                    return (
                      <div key={q.id} className="group">
                        <div className="flex items-start mb-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center mr-3 mt-0.5 group-hover:bg-pink-100 group-hover:text-pink-500 transition-colors">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-700 leading-tight">{q.text}</h4>
                        </div>
                        <div className="ml-9 p-4 bg-slate-50 rounded-2xl text-slate-600 text-sm border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all shadow-sm">
                          {displayAnswer}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end items-center">

                  <button
                    onClick={() => setSelectedLead(null)}
                    className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
};

const MetricCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    pink: 'bg-pink-50 text-pink-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600'
  };
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
};
