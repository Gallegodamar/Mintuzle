
import React, { useState, useEffect, useRef } from 'react';
import { GAME_WORDS_LVL1, GAME_WORDS_LVL2, ATSOTITZAK, HIEROGLYPHS, UI_STRINGS } from './constants';
import { WordItem } from './components/WordItem';
import { AppView, GameMode, GameEntry, HieroglyphEntry } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('menu');
  const [mode, setMode] = useState<GameMode>('words');
  const [level, setLevel] = useState<number>(1);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  
  // Hieroglyph specific state
  const [hieroLevel, setHieroLevel] = useState<number>(0);
  const [shuffledHieros, setShuffledHieros] = useState<HieroglyphEntry[]>([]);
  const [timer, setTimer] = useState(20);
  const [showHieroglyphSolution, setShowHieroglyphSolution] = useState(false);
  const [userGuess, setUserGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hieroCorrectCount, setHieroCorrectCount] = useState(0);
  const [hieroFailedCount, setHieroFailedCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Shuffle logic
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Determine current data based on mode and level
  let currentData: GameEntry[] = [];
  if (mode === 'words') {
    currentData = level === 1 ? GAME_WORDS_LVL1 : GAME_WORDS_LVL2;
  } else if (mode === 'proverbs') {
    currentData = ATSOTITZAK;
  }

  const currentHiero: HieroglyphEntry | undefined = mode === 'hieroglyphs' ? shuffledHieros[hieroLevel] : undefined;

  useEffect(() => {
    if (view === 'game' && mode === 'hieroglyphs') {
      setTimer(20);
      setShowHieroglyphSolution(false);
      setUserGuess("");
      setGuessFeedback(null);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-fail if time runs out
            setHieroFailedCount(f => f + 1);
            setShowHieroglyphSolution(true);
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

  const nextHieroglyph = () => {
    if (hieroLevel < shuffledHieros.length - 1) {
      setHieroLevel(prev => prev + 1);
    } else {
      // Game end state will be handled in UI
    }
  };

  const handleGuessCheck = () => {
    if (!currentHiero) return;
    if (userGuess.trim().toUpperCase() === currentHiero.solution.toUpperCase()) {
      setGuessFeedback("correct");
      setHieroCorrectCount(prev => prev + 1);
      setShowHieroglyphSolution(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Auto progress after a short delay
      setTimeout(() => {
        if (hieroLevel < shuffledHieros.length - 1) {
          nextHieroglyph();
        }
      }, 1500);
    } else {
      setGuessFeedback("wrong");
      setTimeout(() => setGuessFeedback(null), 1500);
    }
  };

  const handleManualReveal = () => {
    if (showHieroglyphSolution) return;
    setShowHieroglyphSolution(true);
    setHieroFailedCount(prev => prev + 1);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showHieroglyphSolution && timer > 0) {
      handleGuessCheck();
    }
  };

  const startGame = (gameMode: GameMode) => {
    setMode(gameMode);
    setView('game');
    setLevel(1);
    setHieroLevel(0);
    setHieroCorrectCount(0);
    setHieroFailedCount(0);
    setRevealedIndexes(new Set());
    if (gameMode === 'hieroglyphs') {
      setShuffledHieros(shuffleArray(HIEROGLYPHS));
    }
  };

  const nextLevel = () => {
    setLevel(2);
    setRevealedIndexes(new Set());
  };

  const resetGame = () => {
    setView('menu');
    setRevealedIndexes(new Set());
    setLevel(1);
    setHieroLevel(0);
    setHieroCorrectCount(0);
    setHieroFailedCount(0);
    setShowHieroglyphSolution(false);
    setUserGuess("");
    setGuessFeedback(null);
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 uppercase game-title drop-shadow-sm">
          {UI_STRINGS.title}
        </h1>
        <p className="text-slate-500 mb-12 text-center max-w-md text-lg italic font-medium">
          {UI_STRINGS.menuSubtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <button
            onClick={() => startGame('words')}
            className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200 transition-all group shadow-sm"
          >
            <i className="fa-solid fa-spell-check text-5xl text-blue-600 mb-6 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-2xl font-bold game-title text-slate-800">{UI_STRINGS.modeWords}</h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">Ortografia</p>
          </button>

          <button
            onClick={() => startGame('proverbs')}
            className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-200 transition-all group shadow-sm"
          >
            <i className="fa-solid fa-quote-left text-5xl text-indigo-600 mb-6 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-2xl font-bold game-title text-slate-800">{UI_STRINGS.modeProverbs}</h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">Kultura</p>
          </button>

          <button
            onClick={() => startGame('hieroglyphs')}
            className="p-8 bg-white border border-slate-200 rounded-3xl hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-200 transition-all group shadow-sm"
          >
            <i className="fa-solid fa-eye text-5xl text-purple-600 mb-6 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-2xl font-bold game-title text-slate-800">{UI_STRINGS.modeHieroglyphs}</h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold">Logika</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl relative z-10">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors px-3 py-1.5 bg-slate-100 rounded-xl"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span className="font-bold text-xs uppercase tracking-widest">{UI_STRINGS.backMenu}</span>
          </button>
          
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase game-title">
              {mode === 'words' ? `${UI_STRINGS.modeWords} (${level}/2)` : mode === 'proverbs' ? UI_STRINGS.modeProverbs : `${UI_STRINGS.modeHieroglyphs}`}
            </h2>
          </div>
        </div>

        {mode === 'hieroglyphs' ? (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            
            {/* Hieroglyph Stats */}
            <div className="w-full grid grid-cols-3 gap-4 mb-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{UI_STRINGS.correctCount}</p>
                <p className="text-xl font-bold text-green-600">{hieroCorrectCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{UI_STRINGS.wrongCount}</p>
                <p className="text-xl font-bold text-red-600">{hieroFailedCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{UI_STRINGS.remainingCount}</p>
                <p className="text-xl font-bold text-blue-600">{shuffledHieros.length - (hieroLevel + 1)}</p>
              </div>
            </div>

            {currentHiero && (
              <>
                <div className="relative group overflow-hidden rounded-3xl border-4 border-white bg-slate-200 p-2 w-full shadow-xl">
                  <img 
                    src={currentHiero.imageUrl} 
                    alt="Hieroglyph" 
                    className="w-full h-auto rounded-2xl shadow-sm min-h-[200px] object-contain bg-white"
                  />
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <h3 className="text-2xl md:text-3xl font-black text-white italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] tracking-widest uppercase px-2">
                       "{currentHiero.imageText}"
                    </h3>
                  </div>
                </div>
                
                <div className="w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-lg">
                  <div className="flex flex-col items-center gap-6">
                    
                    {/* Timer Display */}
                    <div className="flex flex-col items-center gap-2">
                       <div className={`text-5xl font-black tabular-nums transition-colors ${timer <= 5 && timer > 0 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                        {timer}
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                        {timer > 0 ? UI_STRINGS.timerPrefix : UI_STRINGS.timerExpired}
                      </p>
                    </div>

                    {/* Input Area */}
                    {(!showHieroglyphSolution || (showHieroglyphSolution && guessFeedback === 'correct')) && (
                      <div className="w-full space-y-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={timer === 0 || guessFeedback === 'correct'}
                            placeholder={UI_STRINGS.guessPlaceholder}
                            className={`w-full bg-slate-50 border-2 rounded-xl py-4 px-6 text-xl focus:outline-none transition-all ${
                              guessFeedback === 'wrong' ? 'border-red-500 animate-shake text-red-600' : 'border-slate-200 focus:border-blue-500 text-slate-800'
                            } ${timer === 0 && guessFeedback !== 'correct' ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                            autoFocus
                          />
                          {guessFeedback === 'wrong' && (
                            <p className="absolute -bottom-6 left-0 text-red-500 text-xs font-bold uppercase tracking-wider">
                              {UI_STRINGS.wrongFeedback}
                            </p>
                          )}
                        </div>
                        
                        {guessFeedback !== 'correct' && (
                          <div className="flex gap-4">
                            <button
                              onClick={handleGuessCheck}
                              disabled={timer === 0 || !userGuess.trim()}
                              className={`flex-grow py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-lg text-lg tracking-widest game-title ${timer === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-blue-200'}`}
                            >
                              {UI_STRINGS.checkButton}
                            </button>
                            <button
                              onClick={handleManualReveal}
                              disabled={showHieroglyphSolution}
                              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all border border-slate-200"
                              title={UI_STRINGS.solution}
                            >
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback and Progression Area */}
                    {showHieroglyphSolution && (
                      <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`w-full p-8 rounded-2xl text-center shadow-sm border-2 ${guessFeedback === 'correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          {guessFeedback === 'correct' && (
                            <p className="text-green-600 font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-widest">
                              <i className="fa-solid fa-trophy"></i> {UI_STRINGS.correctFeedback}
                            </p>
                          )}
                          <p className="text-xs uppercase font-black text-slate-400 mb-3 tracking-[0.4em]">{UI_STRINGS.hiddenSolution}</p>
                          <p className="text-5xl font-black text-slate-900 tracking-[0.2em] game-title drop-shadow-sm uppercase">{currentHiero.solution}</p>
                        </div>
                        
                        {(guessFeedback !== 'correct' || hieroLevel === shuffledHieros.length - 1) && (
                          <div className="mt-8 flex gap-4">
                            {hieroLevel < shuffledHieros.length - 1 ? (
                              <button
                                onClick={nextHieroglyph}
                                className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all tracking-widest uppercase text-sm game-title shadow-lg"
                              >
                                {UI_STRINGS.nextHiero}
                              </button>
                            ) : (
                              <button
                                onClick={resetGame}
                                className="px-10 py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl transition-all tracking-widest uppercase text-sm game-title shadow-lg"
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
              </>
            )}

            {!currentHiero && (
              <div className="w-full p-12 bg-white border border-slate-200 rounded-3xl text-center shadow-xl">
                 <h2 className="text-4xl font-black text-slate-800 mb-6 game-title">Jokoa amaitu da!</h2>
                 <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-xs uppercase font-black text-green-700 tracking-widest mb-1">Asmatuta</p>
                      <p className="text-4xl font-black text-green-600">{hieroCorrectCount}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-xs uppercase font-black text-red-700 tracking-widest mb-1">Galduta</p>
                      <p className="text-4xl font-black text-red-600">{hieroFailedCount}</p>
                    </div>
                 </div>
                 <button
                    onClick={resetGame}
                    className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all tracking-widest uppercase game-title shadow-lg"
                  >
                    {UI_STRINGS.backMenu}
                  </button>
              </div>
            )}
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
              <div className="mt-10 p-8 bg-blue-50 border border-blue-200 rounded-3xl text-center animate-in zoom-in">
                <p className="text-2xl font-bold text-blue-900 mb-6 game-title">Zerrenda osatuta!</p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  {mode === 'words' && level === 1 && (
                    <button
                      onClick={nextLevel}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-blue-200 tracking-widest uppercase text-sm"
                    >
                      {UI_STRINGS.nextLevel}
                    </button>
                  )}
                  <button
                    onClick={resetGame}
                    className="px-8 py-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-black rounded-xl transition-all tracking-widest uppercase text-sm"
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
