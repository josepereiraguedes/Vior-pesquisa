import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Copy, Check, MessageCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CouponCardProps {
    code: string;
}

export const CouponCard: React.FC<CouponCardProps> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const text = `Olá! Acabei de responder a pesquisa da Vior Store e ganhei um cupom exclusivo! 🌸\n\nMeu código é: *${code}*\n\nGostaria de saber como resgatar meu brinde/desconto! ✨`;
        window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-full max-w-md mx-auto"
        >
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-500 p-1 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                {/* Decorative Circles */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full z-10" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full z-10" />

                <div className="bg-white rounded-[20px] p-8 text-center border-2 border-dashed border-pink-200 h-full flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#ec4899 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />

                    <div className="bg-pink-100 p-3 rounded-full mb-4 animate-bounce">
                        <Ticket className="text-pink-500 w-8 h-8" />
                    </div>

                    <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-2">Seu Cupom Exclusivo</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6 tracking-tight">
                        {code}
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-95"
                        >
                            {copied ? <Check size={18} className="mr-2 text-green-500" /> : <Copy size={18} className="mr-2" />}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>

                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-200 transition-all active:scale-95 group"
                        >
                            <MessageCircle size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                            Resgatar
                        </button>
                    </div>

                    <div className="mt-6 flex items-center text-[10px] text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">
                        <Sparkles size={10} className="mr-1 text-yellow-500" />
                        Tire um print e guarde com carinho!
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
