
import React, { useState, useEffect, useRef } from 'react';
import { GAME_WORDS_LVL1, GAME_WORDS_LVL2, ATSOITZAK, HIEROGLYPHS, UI_STRINGS } from './constants';
import { WordItem } from './components/WordItem';
import { AppView, GameMode, GameEntry, HieroglyphEntry } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('menu');
  const [mode, setMode] = useState<GameMode>('words');
  const [level, setLevel] = useState<number>(1);
  const [hieroLevel, setHieroLevel] = useState<number>(0);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  
  // Hieroglyph specific state
  const [timer, setTimer] = useState(20);
  const [showHieroglyphSolution, setShowHieroglyphSolution] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Determine current data based on mode and level
  let currentData: GameEntry[] = [];
  if (mode === 'words') {
    currentData = level === 1 ? GAME_WORDS_LVL1 : GAME_WORDS_LVL2;
  } else if (mode === 'proverbs') {
    currentData = ATSOITZAK;
  }

  const currentHiero: HieroglyphEntry = HIEROGLYPHS[hieroLevel] || HIEROGLYPHS[0];

  useEffect(() => {
    if (view === 'game' && mode === 'hieroglyphs') {
      setTimer(20);
      setShowHieroglyphSolution(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, mode, hieroLevel]);

  const handleReveal = (index: number) => {
    const newRevealed = new Set(revealedIndexes);
    newRevealed.add(index);
    setRevealedIndexes(newRevealed);
  };

  const startGame = (gameMode: GameMode) => {
    setMode(gameMode);
    setView('game');
    setLevel(1);
    setHieroLevel(0);
    setRevealedIndexes(new Set());
  };

  const nextLevel = () => {
    setLevel(2);
    setRevealedIndexes(new Set());
  };

  const nextHieroglyph = () => {
    setHieroLevel((prev) => prev + 1);
    setRevealedIndexes(new Set());
  };

  const resetGame = () => {
    setView('menu');
    setRevealedIndexes(new Set());
    setLevel(1);
    setHieroLevel(0);
    setShowHieroglyphSolution(false);
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#020617] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-400 to-indigo-600 uppercase game-title drop-shadow-2xl">
          {UI_STRINGS.title}
        </h1>
        <p className="text-blue-200/60 mb-12 text-center max-w-md text-lg italic">
          {UI_STRINGS.menuSubtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <button
            onClick={() => startGame('words')}
            className="p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl hover:border-blue-500 hover:bg-slate-800/80 transition-all group shadow-xl"
          >
            <i className="fa-solid fa-spell-check text-5xl text-blue-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-2xl font-bold game-title">{UI_STRINGS.modeWords}</h2>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Ortografia</p>
          </button>

          <button
            onClick={() => startGame('proverbs')}
            className="p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl hover:border-indigo-500 hover:bg-slate-800/80 transition-all group shadow-xl"
          >
            <i className="fa-solid fa-quote-left text-5xl text-indigo-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-2xl font-bold game-title">{UI_STRINGS.modeProverbs}</h2>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Kultura</p>
          </button>

          <button
            onClick={() => startGame('hieroglyphs')}
            className="p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl hover:border-purple-500 hover:bg-slate-800/80 transition-all group shadow-xl"
          >
            <i className="fa-solid fa-eye text-5xl text-purple-500 mb-6 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-2xl font-bold game-title">{UI_STRINGS.modeHieroglyphs}</h2>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Logika</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl relative z-10">
        <div className="flex justify-between items-center mb-10 bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-1 bg-slate-800/50 rounded-lg"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span className="font-bold text-xs uppercase tracking-widest">{UI_STRINGS.backMenu}</span>
          </button>
          
          <div className="text-right">
            <h2 className="text-xl font-black text-blue-400 tracking-tight uppercase game-title">
              {mode === 'words' ? `${UI_STRINGS.modeWords} (${level}/2)` : mode === 'proverbs' ? UI_STRINGS.modeProverbs : `${UI_STRINGS.modeHieroglyphs} (${hieroLevel + 1}/${HIEROGLYPHS.length})`}
            </h2>
          </div>
        </div>

        {mode === 'hieroglyphs' ? (
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
            <div className="relative group overflow-hidden rounded-3xl border-4 border-slate-800 bg-slate-900 p-2 w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <img 
                src={currentHiero.imageUrl} 
                alt="Hieroglyph" 
                className="w-full h-auto rounded-2xl shadow-inner min-h-[200px] object-contain bg-slate-800"
              />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <h3 className="text-2xl md:text-3xl font-black text-white italic drop-shadow-[0_2px_10px_rgba(0,0,0,1)] tracking-widest uppercase px-2">
                   "{currentHiero.imageText}"
                </h3>
              </div>
            </div>
            
            <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              {timer > 0 ? (
                <div className="flex flex-col items-center gap-4">
                   <div className="text-6xl font-black text-blue-500 tabular-nums animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    {timer}
                  </div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.3em]">{UI_STRINGS.timerPrefix}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <button
                    onClick={() => setShowHieroglyphSolution(true)}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl hover:shadow-blue-500/20 text-xl tracking-widest game-title animate-in zoom-in"
                  >
                    {UI_STRINGS.solution}
                  </button>
                  {showHieroglyphSolution && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full p-8 bg-green-950/40 border-2 border-green-500/50 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <p className="text-xs uppercase font-black text-green-400 mb-3 tracking-[0.4em]">{UI_STRINGS.hiddenSolution}</p>
                        <p className="text-5xl font-black text-white tracking-[0.2em] game-title drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] uppercase">{currentHiero.solution}</p>
                        {currentHiero.explanation && (
                          <p className="mt-4 text-xs text-green-300/60 font-medium italic">{currentHiero.explanation}</p>
                        )}
                      </div>
                      
                      {hieroLevel < HIEROGLYPHS.length - 1 && (
                        <button
                          onClick={nextHieroglyph}
                          className="mt-8 px-10 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-blue-400 transition-all tracking-widest uppercase text-sm game-title animate-bounce"
                        >
                          {UI_STRINGS.nextHiero}
                        </button>
                      )}
                      
                      {hieroLevel === HIEROGLYPHS.length - 1 && (
                        <button
                          onClick={resetGame}
                          className="mt-8 px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all tracking-widest uppercase text-sm game-title"
                        >
                          {UI_STRINGS.backMenu}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-6 duration-500">
            {currentData.map((item, idx) => (
              <WordItem
                key={`${level}-${idx}`}
                text={item.text}
                actualStatus={item.egoera}
                isRevealed={revealedIndexes.has(idx)}
                onClick={() => handleReveal(idx)}
              />
            ))}

            {revealedIndexes.size === currentData.length && (
              <div className="mt-10 p-8 bg-blue-600/10 border border-blue-500/30 rounded-3xl text-center animate-in zoom-in">
                <p className="text-2xl font-bold text-blue-200 mb-6 game-title">Zerrenda osatuta!</p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  {mode === 'words' && level === 1 && (
                    <button
                      onClick={nextLevel}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-blue-500/40 tracking-widest uppercase text-sm"
                    >
                      {UI_STRINGS.nextLevel}
                    </button>
                  )}
                  <button
                    onClick={resetGame}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all tracking-widest uppercase text-sm"
                  >
                    {UI_STRINGS.backMenu}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return view === 'menu' ? renderMenu() : renderGame();
};

export default App;
