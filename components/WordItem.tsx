
import React from 'react';
import { WordStatus } from '../types';

interface WordItemProps {
  text: string;
  actualStatus: WordStatus;
  isRevealed: boolean;
  showDictionary?: boolean;
  onClick: () => void;
}

export const WordItem: React.FC<WordItemProps> = React.memo(({ 
  text, 
  actualStatus, 
  isRevealed, 
  showDictionary = true,
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
          relative flex flex-col md:flex-row items-center justify-between flex-grow p-5 
          rounded-2xl border transition-all duration-300 transform active:scale-[0.95]
          ${!isRevealed 
            ? 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100' 
            : isCorrect 
              ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-100' 
              : 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-100'
          }
        `}
      >
        <span className={`text-xl font-bold tracking-tight game-title text-center md:text-left mb-2 md:mb-0`}>
          {text}
        </span>

        <div className="flex items-center gap-3">
          {isRevealed && (
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <i className="fa-solid fa-circle-check text-2xl"></i>
              ) : (
                <i className="fa-solid fa-circle-xmark text-2xl"></i>
              )}
            </div>
          )}
          {!isRevealed && (
            <i className="fa-solid fa-circle-question text-slate-200 group-hover:text-blue-400 transition-colors text-2xl"></i>
          )}
        </div>
      </button>

      {isRevealed && showDictionary && (
        <a
          href={dictionaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-500 rounded-2xl transition-all animate-in fade-in slide-in-from-right-2 duration-300 group/dict shadow-sm"
          title="Elhuyar Hiztegia"
        >
          <div className="flex flex-col items-center">
            <i className="fa-solid fa-book-open text-blue-600 group-hover/dict:scale-110 transition-transform"></i>
            <span className="text-[8px] mt-1 text-slate-400 font-black group-hover/dict:text-blue-600">Hiztegia</span>
          </div>
        </a>
      )}
    </div>
  );
});
