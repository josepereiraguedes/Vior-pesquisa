import React, { useState } from 'react';
import { SURVEY_QUESTIONS } from '../constants';
import { Question, Option, SurveyResponse } from '../types';
import { ArrowRight, Check, Star, Loader2, ArrowLeft } from 'lucide-react';

interface SurveyFlowProps {
  onComplete: (responses: SurveyResponse[]) => void;
}

// --- Sub-components for each question type ---

const ImageSelectView: React.FC<{ question: Question, onAnswer: (val: string) => void }> = ({ question, onAnswer }) => (
  <div className="grid grid-cols-2 gap-4 w-full">
    {question.options?.map((opt) => (
      <button
        key={opt.id}
        onClick={() => onAnswer(opt.id)}
        className="group relative flex flex-col items-center border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-pink-400 transition-all bg-white shadow-sm hover:shadow-lg"
      >
        <div className="w-full h-32 bg-slate-100 relative">
          <img src={opt.image} alt={opt.label} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-2">
             <span className="text-white font-bold text-sm drop-shadow-md">{opt.label} {opt.emoji}</span>
          </div>
        </div>
      </button>
    ))}
  </div>
);

const SingleChoiceView: React.FC<{ question: Question, onAnswer: (val: string) => void }> = ({ question, onAnswer }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
    {question.options?.map((opt) => (
      <button
        key={opt.id}
        onClick={() => onAnswer(opt.id)}
        className="group relative flex items-center p-4 border-2 border-slate-100 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all text-left bg-white shadow-sm hover:shadow-md"
      >
        <span className="text-2xl mr-3">{opt.emoji}</span>
        <span className="font-medium text-slate-700 group-hover:text-pink-700">{opt.label}</span>
        <ArrowRight className="absolute right-4 text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
      </button>
    ))}
  </div>
);

const MultipleChoiceView: React.FC<{ question: Question, onAnswer: (val: string[]) => void, isLast: boolean }> = ({ question, onAnswer, isLast }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options?.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`flex items-center p-4 border-2 rounded-xl transition-all text-left shadow-sm ${
                isSelected 
                ? 'border-pink-500 bg-pink-50 text-pink-700' 
                : 'border-slate-100 bg-white text-slate-700 hover:border-pink-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${isSelected ? 'border-pink-500 bg-pink-500' : 'border-slate-300'}`}>
                {isSelected && <Check size={14} className="text-white" />}
              </div>
              <span className="text-2xl mr-3">{opt.emoji}</span>
              <span className="font-medium">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <button
        onClick={() => onAnswer(selected)}
        disabled={selected.length === 0}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-200 mt-4"
      >
        {isLast ? 'Finalizar Pesquisa' : 'Confirmar Escolhas'}
      </button>
    </div>
  );
};

const RatingView: React.FC<{ question: Question, onAnswer: (val: number) => void, isLast: boolean }> = ({ question, onAnswer, isLast }) => {
  const [rating, setRating] = useState<number | null>(null);

  return (
    <div className="w-full space-y-6">
        <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star 
                        size={40} 
                        fill={rating && star <= rating ? "#F472B6" : "none"} 
                        className={rating && star <= rating ? "text-pink-400" : "text-slate-300 hover:text-pink-300"}
                    />
                </button>
            ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium px-4">
            <span>Não gosto</span>
            <span>Amo!</span>
        </div>
         <button
            onClick={() => rating && onAnswer(rating)}
            disabled={!rating}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-200"
            >
            {isLast ? 'Finalizar Pesquisa' : 'Continuar'}
        </button>
    </div>
  );
};

const TextView: React.FC<{ question: Question, onAnswer: (val: string) => void, isLast: boolean }> = ({ question, onAnswer, isLast }) => {
  const [value, setValue] = useState('');
  
  return (
    <div className="w-full space-y-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={question.placeholder}
        className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-0 outline-none min-h-[120px] text-lg bg-white shadow-inner resize-none transition-colors"
      />
      <button
        onClick={() => onAnswer(value)}
        disabled={question.required && !value.trim()}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-200 flex items-center justify-center"
      >
        {isLast ? 'Finalizar Pesquisa' : 'Continuar'} <ArrowRight size={18} className="ml-2" />
      </button>
    </div>
  );
};

// --- Main SurveyFlow Component ---

export const SurveyFlow: React.FC<SurveyFlowProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Store full history of responses to allow going back
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = SURVEY_QUESTIONS[currentIndex];
  
  if (!currentQuestion) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-pink-500 mx-auto mb-2" />
                  <p className="text-slate-500">Carregando...</p>
              </div>
          </div>
      );
  }

  const isLastQuestion = currentIndex === SURVEY_QUESTIONS.length - 1;
  const progress = ((currentIndex) / SURVEY_QUESTIONS.length) * 100;

  const handleNext = (answer: string | string[] | number) => {
    // Basic validation handled by subcomponents (buttons disabled), 
    // but we double check for safety.
    if (currentQuestion.required) {
      if (typeof answer === 'string' && !answer.trim()) {
        setError('Por favor, responda esta pergunta.');
        return;
      }
      if (Array.isArray(answer) && answer.length === 0) {
        setError('Selecione pelo menos uma opção.');
        return;
      }
    }

    // Add or update the response for the current question
    const updatedResponses = [...responses];
    // Remove if exists previously (in case of back/forward navigation if we kept it)
    const existingIndex = updatedResponses.findIndex(r => r.questionId === currentQuestion.id);
    if (existingIndex > -1) {
        updatedResponses[existingIndex] = { questionId: currentQuestion.id, answer };
    } else {
        updatedResponses.push({ questionId: currentQuestion.id, answer });
    }

    setResponses(updatedResponses);
    setError(null);

    if (isLastQuestion) {
      onComplete(updatedResponses);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
      if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setError(null);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between items-center mt-2">
                {currentIndex > 0 ? (
                    <button 
                        onClick={handleBack}
                        className="text-xs text-slate-500 hover:text-pink-600 flex items-center font-medium transition-colors"
                    >
                        <ArrowLeft size={12} className="mr-1" /> Voltar
                    </button>
                ) : (
                    <span className="w-10"></span> // Spacer
                )}
                <p className="text-right text-xs text-slate-400 font-medium">Pergunta {currentIndex + 1} de {SURVEY_QUESTIONS.length}</p>
            </div>
        </div>

        {/* Question Card */}
        <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-3xl shadow-xl shadow-purple-100/50 border border-white">
          <div className="mb-8 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 leading-tight">
              {currentQuestion.text}
            </h2>
            {currentQuestion.subtext && (
              <p className="text-slate-500 font-medium">{currentQuestion.subtext}</p>
            )}
          </div>

          <div className="min-h-[200px] flex items-center justify-center">
            {/* 
              We use `key={currentQuestion.id}` to force React to remount the component 
              when the question changes. This resets the local state (input value, selections) 
              of the child components automatically.
            */}
            {currentQuestion.type === 'image_select' && (
              <ImageSelectView key={currentQuestion.id} question={currentQuestion} onAnswer={(v) => handleNext(v)} />
            )}
            {currentQuestion.type === 'single_choice' && (
              <SingleChoiceView key={currentQuestion.id} question={currentQuestion} onAnswer={(v) => handleNext(v)} />
            )}
            {currentQuestion.type === 'multiple_choice' && (
              <MultipleChoiceView key={currentQuestion.id} question={currentQuestion} onAnswer={(v) => handleNext(v)} isLast={isLastQuestion} />
            )}
            {currentQuestion.type === 'rating' && (
              <RatingView key={currentQuestion.id} question={currentQuestion} onAnswer={(v) => handleNext(v)} isLast={isLastQuestion} />
            )}
            {currentQuestion.type === 'text' && (
              <TextView key={currentQuestion.id} question={currentQuestion} onAnswer={(v) => handleNext(v)} isLast={isLastQuestion} />
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium animate-pulse text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};