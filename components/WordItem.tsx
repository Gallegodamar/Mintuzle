
import React from 'react';
import { WordStatus } from '../types';

interface WordItemProps {
  text: string;
  actualStatus: WordStatus;
  isRevealed: boolean;
  onClick: () => void;
}

export const WordItem: React.FC<WordItemProps> = ({ 
  text, 
  actualStatus, 
  isRevealed, 
  onClick 
}) => {
  const isCorrect = actualStatus === 'ondo dago';
  const dictionaryUrl = `https://hiztegiak.elhuyar.eus/eu/${text.toLowerCase()}`;
  
  return (
    <div className="flex gap-2 w-full mb-3 group">
      <button
        onClick={onClick}
        disabled={isRevealed}
        className={`
          relative flex flex-col md:flex-row items-center justify-between flex-grow p-4 
          rounded-lg border-y transition-all duration-300 transform active:scale-[0.98]
          ${!isRevealed 
            ? 'bg-gradient-to-r from-slate-900 to-blue-900 border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
            : isCorrect 
              ? 'bg-green-600 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
              : 'bg-red-600 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
          }
        `}
      >
        <span className={`text-lg md:text-xl font-bold tracking-wider game-title text-center md:text-left mb-2 md:mb-0 text-white`}>
          {text}
        </span>

        <div className="flex items-center gap-3">
          {isRevealed && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs uppercase font-bold bg-black/20 px-2 py-1 rounded text-white">
                {actualStatus}
              </span>
              {isCorrect ? (
                <i className="fa-solid fa-circle-check text-xl md:text-2xl text-white"></i>
              ) : (
                <i className="fa-solid fa-circle-xmark text-xl md:text-2xl text-white"></i>
              )}
            </div>
          )}
          {!isRevealed && (
            <i className="fa-solid fa-question-circle text-blue-400/50 text-xl"></i>
          )}
        </div>
      </button>

      {isRevealed && (
        <a
          href={dictionaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-blue-500 rounded-lg transition-all animate-in fade-in slide-in-from-right-2 duration-300 group/dict"
          title="Elhuyar Hiztegia"
        >
          <div className="flex flex-col items-center">
            <i className="fa-solid fa-book-open text-blue-400 group-hover/dict:scale-110 transition-transform"></i>
            <span className="text-[8px] uppercase mt-1 text-slate-400 font-bold group-hover/dict:text-white">Hiztegia</span>
          </div>
        </a>
      )}
    </div>
  );
};
