import { Question, CompletedSurvey } from './types';

export const SURVEY_QUESTIONS: Question[] = [
  {
    id: 'category',
    type: 'image_select',
    text: 'Para começar, qual dessas categorias você mais ama comprar? 😍',
    subtext: 'Selecione a sua favorita.',
    options: [
      { id: 'makeup', label: 'Maquiagem', emoji: '💄', image: '/imagens/Maquiagem.png' },
      { id: 'skincare', label: 'Skincare', emoji: '🧴', image: '/imagens/Skincare.png' },
      { id: 'accessories', label: 'Acessórios', emoji: '💍', image: '/imagens/Acessorios.png' },
      { id: 'perfume', label: 'Perfumes', emoji: '✨', image: '/imagens/Perfumes.png' },
    ],
    required: true,
  },
  {
    id: 'style',
    type: 'single_choice',
    text: 'Como você definiria seu estilo hoje?',
    subtext: 'Pergunta rápida e divertida!',
    options: [
      { id: 'clean_girl', label: 'Clean Girl / Natural', emoji: '🌿' },
      { id: 'glam', label: 'Full Glam / Poderosa', emoji: '💎' },
      { id: 'creative', label: 'Criativa / Colorida', emoji: '🎨' },
      { id: 'classic', label: 'Clássica / Elegante', emoji: '👠' },
    ],
    required: true,
  },
  {
    id: 'frequency',
    type: 'single_choice',
    text: 'Com que frequência você costuma se presentear com esses produtos?',
    options: [
      { id: 'weekly', label: 'Toda semana (viciada!)', emoji: '📅' },
      { id: 'monthly', label: 'Uma vez por mês', emoji: '🗓️' },
      { id: 'quarterly', label: 'A cada 3 meses', emoji: '🍂' },
      { id: 'rarely', label: 'Só quando acaba', emoji: '🛑' },
    ],
    required: true,
  },
  {
    id: 'location',
    type: 'multiple_choice',
    text: 'Onde você costuma encontrar seus produtinhos?',
    subtext: 'Pode marcar mais de um.',
    options: [
      { id: 'shopee', label: 'Shopee', emoji: '🛍️' },
      { id: 'shein', label: 'Shein', emoji: '👗' },
      { id: 'instagram', label: 'Lojas no Instagram', emoji: '📸' },
      { id: 'amazon', label: 'Amazon', emoji: '📦' },
      { id: 'mercadolivre', label: 'Mercado Livre', emoji: '🤝' },
      { id: 'physical', label: 'Loja Física / Shopping', emoji: '🏢' },
      { id: 'drugstore', label: 'Farmácia', emoji: '💊' },
    ],
    required: true,
  },
  {
    id: 'ticket',
    type: 'single_choice',
    text: 'Em média, quanto você investe por mês em beleza?',
    options: [
      { id: 'low', label: 'Até R$ 50,00', emoji: '🪙' },
      { id: 'medium', label: 'Entre R$ 50 e R$ 150', emoji: '💵' },
      { id: 'high', label: 'Entre R$ 150 e R$ 300', emoji: '💳' },
      { id: 'premium', label: 'Mais de R$ 300', emoji: '💎' },
    ],
    required: true,
  },
  {
    id: 'products',
    type: 'text',
    text: 'Quais são os 3 produtos que você usa TODO dia?',
    placeholder: 'Ex: Protetor solar, rímel e lip tint...',
    required: true,
  },
  {
    id: 'brands',
    type: 'text',
    text: 'Tem alguma marca do coração? ❤️',
    subtext: 'Opcional, mas adoramos saber!',
    placeholder: 'Ex: Rare Beauty, Boca Rosa, Simple...',
    required: false,
  },
  {
    id: 'testing',
    type: 'single_choice',
    text: 'Você gosta de testar novidades e marcas diferentes?',
    options: [
      { id: 'yes', label: 'Sim! Adoro ser a primeira a testar', emoji: '🚀' },
      { id: 'maybe', label: 'Depende, se tiver boas reviews', emoji: '⭐' },
      { id: 'no', label: 'Não, prefiro os meus clássicos', emoji: '🔒' },
    ],
    required: true,
  },
  {
    id: 'online_interest',
    type: 'rating',
    text: 'De 1 a 5, o quanto você prefere comprar online vs loja física?',
    subtext: '1 = Só loja física, 5 = Só compro online',
    required: true,
  },
  {
    id: 'age',
    type: 'single_choice',
    text: 'Para finalizar, qual sua faixa etária?',
    options: [
      { id: 'under_18', label: 'Menos de 18 anos', emoji: '🎓' },
      { id: '18_24', label: '18 - 24 anos', emoji: '🎒' },
      { id: '25_34', label: '25 - 34 anos', emoji: '💼' },
      { id: '35_plus', label: '35+ anos', emoji: '🥂' },
    ],
    required: true,
  },
  {
    id: 'name',
    type: 'text',
    text: 'Qual seu nome completo?',
    subtext: 'Para identificarmos você no sorteio.',
    placeholder: 'Ex: Ana Clara da Silva',
    required: true,
  },
  {
    id: 'whatsapp',
    type: 'text',
    text: 'Qual seu WhatsApp com DDD?',
    subtext: '⚠️ Atenção: O sorteio será realizado por este número. Preencha corretamente!',
    placeholder: '(00) 99999-9999',
    required: true,
  },
];

// Mock data to simulate existing answers for the dashboard
export const MOCK_RESPONSES: CompletedSurvey[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `mock-${i}`,
  timestamp: Date.now() - Math.random() * 1000000000,
  responses: [
    { questionId: 'category', answer: Math.random() > 0.5 ? 'skincare' : (Math.random() > 0.5 ? 'makeup' : 'accessories') },
    { questionId: 'frequency', answer: 'monthly' },
    { questionId: 'ticket', answer: Math.random() > 0.7 ? 'medium' : 'high' },
    { questionId: 'location', answer: [Math.random() > 0.5 ? 'shopee' : 'shein', Math.random() > 0.5 ? 'amazon' : 'mercadolivre'] },
    { questionId: 'online_interest', answer: Math.floor(Math.random() * 2) + 4 }, // Mostly 4 or 5
    { questionId: 'age', answer: '25_34' },
    { questionId: 'testing', answer: 'yes' },
    { questionId: 'name', answer: `Participante ${i}` },
    { questionId: 'whatsapp', answer: `(11) 99999-${1000 + i}` }
  ]
}));

export const COUPON_WORDS = [
  'VIORGLOW', 'PELEDEDIVA', 'BATOMPODER', 'MIMOEXPERIENCE',
  'DOCEBELEZA', 'OLHARRELEVANTE', 'GLAMOURVIOR', 'RITUALDIVA',
  'MAGIACOSMETICA', 'VIPBELEZA', 'CUIDADOPREMIUM', 'SHINESISTER'
];

export const SHARING_MESSAGE = `
Olá! 🌸
A Vior Store quer saber o que você mais ama!
Participe da nossa pesquisa rápida (2 min) e concorra a um **Kit de Cosméticos**! 🎁✨
Responda aqui: [LINK]
`;