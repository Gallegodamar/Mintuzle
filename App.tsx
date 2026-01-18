
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GAME_WORDS_LVL1, GAME_WORDS_LVL2, ATSOTITZAK, HIEROGLYPHS, SINONIMOAK, UI_STRINGS } from './constants';
import { WordItem } from './components/WordItem';
import { AppView, GameMode, GameEntry, HieroglyphEntry, SynonymEntry, WordStatus } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('menu');
  const [mode, setMode] = useState<GameMode>('words');
  const [level, setLevel] = useState<number>(1);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  
  // Interaction specific state
  const [gameLevel, setGameLevel] = useState<number>(0);
  const [shuffledHieros, setShuffledHieros] = useState<HieroglyphEntry[]>([]);
  const [shuffledSynonyms, setShuffledSynonyms] = useState<SynonymEntry[]>([]);
  const [timer, setTimer] = useState(40);
  const [showSolution, setShowSolution] = useState(false);
  const [userGuess, setUserGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Daily Mode Specific Items - Deterministic based on Date at 8:00 AM
  const dailyItems = useMemo(() => {
    const now = new Date();
    const d = new Date(now);
    if (now.getHours() < 8) {
      d.setDate(d.getDate() - 1);
    }
    const seed = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    
    const getSeededIndex = (str: string, max: number) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const x = Math.sin(hash) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };

    const combinedWords = [...GAME_WORDS_LVL1, ...GAME_WORDS_LVL2];
    const wordIdx = getSeededIndex(seed + "word", combinedWords.length);
    
    return [
      { type: 'words', data: combinedWords[wordIdx % combinedWords.length] },
      { type: 'proverbs', data: ATSOTITZAK[getSeededIndex(seed + "prov", ATSOTITZAK.length)] },
      { type: 'hieroglyphs', data: HIEROGLYPHS[getSeededIndex(seed + "hiero", HIEROGLYPHS.length)] },
      { type: 'synonyms', data: SINONIMOAK[getSeededIndex(seed + "syn", SINONIMOAK.length)] }
    ];
  }, []);

  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }, []);

  const getActiveMode = useCallback(() => {
    if (mode !== 'daily') return mode;
    return dailyItems[gameLevel]?.type as GameMode;
  }, [mode, gameLevel, dailyItems]);

  const currentItem = useMemo(() => {
    if (mode === 'daily') return dailyItems[gameLevel]?.data;
    if (mode === 'hieroglyphs') return shuffledHieros[gameLevel];
    if (mode === 'synonyms') return shuffledSynonyms[gameLevel];
    return null;
  }, [mode, gameLevel, shuffledHieros, shuffledSynonyms, dailyItems]);

  // Track the specific correct synonym chosen for this instance
  const correctSynonymForRound = useMemo(() => {
    const activeMode = getActiveMode();
    if (activeMode !== 'synonyms' || !currentItem) return "";
    const synItem = currentItem as SynonymEntry;
    return synItem.sinonimoak[0]; // Stable pick for the round
  }, [currentItem, getActiveMode]);

  const synonymOptions = useMemo(() => {
    const activeMode = getActiveMode();
    if (activeMode !== 'synonyms' || !currentItem || !correctSynonymForRound) return [];
    
    const synItem = currentItem as SynonymEntry;
    const correctOnes = synItem.sinonimoak;
    
    const allPossibleSyns = Array.from(new Set(SINONIMOAK.flatMap(s => s.sinonimoak)));
    const distractors = allPossibleSyns.filter(s => !correctOnes.includes(s));
    
    // Pick 5 distractors randomly
    const pickedDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 5);
    const finalOptions = [correctSynonymForRound, ...pickedDistractors];
    return finalOptions.sort(() => 0.5 - Math.random());
  }, [getActiveMode, currentItem, correctSynonymForRound]);

  // General list data for normal modes
  const currentListData = useMemo(() => {
    if (mode === 'words') {
      return level === 1 ? GAME_WORDS_LVL1 : GAME_WORDS_LVL2;
    } else if (mode === 'proverbs') {
      return ATSOTITZAK;
    }
    return [];
  }, [mode, level]);

  useEffect(() => {
    if (view === 'game') {
      setShowSolution(false);
      setUserGuess("");
      setGuessFeedback(null);
      setSelectedOption(null);
      
      const activeMode = getActiveMode();
      if (activeMode === 'hieroglyphs') {
        setTimer(40);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setFailedCount(f => f + 1);
              setShowSolution(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, getActiveMode, gameLevel]);

  const nextChallenge = useCallback(() => {
    const total = mode === 'daily' ? 4 : (mode === 'hieroglyphs' ? shuffledHieros.length : shuffledSynonyms.length);
    if (gameLevel < total - 1) {
      setGameLevel(prev => prev + 1);
    } else {
       setGameLevel(total); 
    }
  }, [mode, gameLevel, shuffledHieros.length, shuffledSynonyms.length]);

  const handleGuessCheck = useCallback(() => {
    const activeMode = getActiveMode();
    if (activeMode !== 'hieroglyphs' || showSolution) return;

    const isCorrect = userGuess.trim().toUpperCase() === (currentItem as HieroglyphEntry)?.solution.toUpperCase();
    if (isCorrect) {
      setGuessFeedback("correct");
      setCorrectCount(prev => prev + 1);
      setShowSolution(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setGuessFeedback("wrong");
      setTimeout(() => setGuessFeedback(null), 1500);
    }
  }, [getActiveMode, currentItem, userGuess, showSolution]);

  const handleSpellingChoice = useCallback((choice: WordStatus) => {
    if (showSolution) return;
    const item = currentItem as GameEntry;
    const isCorrect = item.egoera === choice;
    
    if (isCorrect) {
      setGuessFeedback("correct");
      setCorrectCount(c => c + 1);
    } else {
      setGuessFeedback("wrong");
      setFailedCount(f => f + 1);
    }
    setShowSolution(true);
  }, [currentItem, showSolution]);

  const handleOptionSelect = useCallback((option: string) => {
    if (showSolution) return;
    setSelectedOption(option);
    const item = currentItem as SynonymEntry;
    const isCorrect = item.sinonimoak.some(s => s.trim().toUpperCase() === option.trim().toUpperCase());

    if (isCorrect) {
      setGuessFeedback("correct");
      setCorrectCount(prev => prev + 1);
    } else {
      setGuessFeedback("wrong");
      setFailedCount(prev => prev + 1);
    }
    setShowSolution(true);
  }, [currentItem, showSolution]);

  const startGame = useCallback((gameMode: GameMode) => {
    setMode(gameMode);
    setView('game');
    setLevel(1);
    setGameLevel(0);
    setCorrectCount(0);
    setFailedCount(0);
    setRevealedIndexes(new Set());
    if (gameMode === 'hieroglyphs') {
      setShuffledHieros(shuffleArray(HIEROGLYPHS));
    } else if (gameMode === 'synonyms') {
      setShuffledSynonyms(shuffleArray(SINONIMOAK));
    }
  }, [shuffleArray]);

  const resetGame = useCallback(() => {
    setView('menu');
    setRevealedIndexes(new Set());
    setLevel(1);
    setGameLevel(0);
    setCorrectCount(0);
    setFailedCount(0);
    setShowSolution(false);
    setUserGuess("");
    setGuessFeedback(null);
    setSelectedOption(null);
  }, []);

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-slate-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full blur-[60px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[60px]"></div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center w-full max-w-4xl px-4">
        <h1 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 game-title drop-shadow-sm py-2">
          {UI_STRINGS.title}
        </h1>

        <button
          onClick={() => startGame('daily')}
          className="w-full mb-8 p-8 md:p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] md:rounded-[2.5rem] hover:shadow-2xl hover:shadow-slate-300 transition-all group relative overflow-hidden flex flex-col items-center justify-center border-b-8 border-slate-950 active:translate-y-1 active:border-b-4"
        >
          <div className="absolute top-3 right-5 bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-full tracking-[0.2em] uppercase">Gaurkoa</div>
          <i className="fa-solid fa-calendar-star text-5xl md:text-6xl mb-4 group-hover:scale-110 transition-transform"></i>
          <h2 className="text-3xl md:text-4xl font-black game-title">{UI_STRINGS.modeDaily}</h2>
        </button>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
          <button
            onClick={() => startGame('words')}
            className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all group shadow-sm flex flex-col items-center active:scale-[0.98]"
          >
            <i className="fa-solid fa-spell-check text-3xl md:text-4xl text-blue-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-sm md:text-xl font-bold game-title text-slate-800">{UI_STRINGS.modeWords}</h2>
          </button>

          <button
            onClick={() => startGame('proverbs')}
            className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl hover:border-indigo-500 hover:shadow-xl transition-all group shadow-sm flex flex-col items-center active:scale-[0.98]"
          >
            <i className="fa-solid fa-quote-left text-3xl md:text-4xl text-indigo-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-sm md:text-xl font-bold game-title text-slate-800">{UI_STRINGS.modeProverbs}</h2>
          </button>

          <button
            onClick={() => startGame('hieroglyphs')}
            className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl hover:border-purple-500 hover:shadow-xl transition-all group shadow-sm flex flex-col items-center active:scale-[0.98]"
          >
            <i className="fa-solid fa-eye text-3xl md:text-4xl text-purple-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-sm md:text-xl font-bold game-title text-slate-800">{UI_STRINGS.modeHieroglyphs}</h2>
          </button>

          <button
            onClick={() => startGame('synonyms')}
            className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl hover:border-emerald-500 hover:shadow-xl transition-all group shadow-sm flex flex-col items-center active:scale-[0.98]"
          >
            <i className="fa-solid fa-equals text-3xl md:text-4xl text-emerald-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform"></i>
            <h2 className="text-sm md:text-xl font-bold game-title text-slate-800">{UI_STRINGS.modeSynonyms}</h2>
          </button>
        </div>
      </div>
    </div>
  );

  const renderGame = () => {
    const activeMode = getActiveMode();
    const totalChallenges = mode === 'daily' ? 4 : (mode === 'hieroglyphs' ? shuffledHieros.length : shuffledSynonyms.length);
    const isFinished = (mode === 'daily' || mode === 'hieroglyphs' || mode === 'synonyms') && gameLevel >= totalChallenges;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-2xl relative z-10">
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <button 
              onClick={resetGame}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors px-3 py-1.5 bg-slate-100 rounded-xl active:scale-95"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span className="font-bold text-[10px] md:text-xs tracking-wider">{UI_STRINGS.backMenu}</span>
            </button>
            <h2 className="text-sm md:text-xl font-black text-slate-800 tracking-tight game-title text-right">
              {mode === 'daily' ? UI_STRINGS.modeDaily : mode === 'words' ? UI_STRINGS.modeWords : mode === 'proverbs' ? UI_STRINGS.modeProverbs : mode === 'hieroglyphs' ? UI_STRINGS.modeHieroglyphs : UI_STRINGS.modeSynonyms}
            </h2>
          </div>

          {(mode === 'daily' || mode === 'hieroglyphs' || mode === 'synonyms') ? (
            <div className="flex flex-col items-center gap-4 md:gap-6">
              {!isFinished && (
                <div className="w-full grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">{UI_STRINGS.correctCount}</p>
                    <p className="text-lg md:text-xl font-bold text-green-600">{correctCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">{UI_STRINGS.wrongCount}</p>
                    <p className="text-lg md:text-xl font-bold text-red-600">{failedCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">{UI_STRINGS.remainingCount}</p>
                    <p className="text-lg md:text-xl font-bold text-blue-600">{Math.max(0, totalChallenges - gameLevel)}</p>
                  </div>
                </div>
              )}

              {currentItem && !isFinished && (
                <div className="w-full space-y-4 md:space-y-6">
                  <div className="relative overflow-hidden rounded-3xl border-4 border-white bg-white p-6 md:p-12 w-full shadow-xl flex flex-col items-center justify-center min-h-[180px] md:min-h-[220px]">
                    {activeMode === 'hieroglyphs' ? (
                      <div className="w-full text-center">
                        <img src={(currentItem as HieroglyphEntry).imageUrl} loading="lazy" className="w-full h-auto rounded-2xl max-h-[250px] md:max-h-[300px] object-contain mb-4 md:mb-6 bg-slate-50 p-2 md:p-4" />
                        <h3 className="text-base md:text-xl font-black text-slate-800 italic leading-tight">"{(currentItem as HieroglyphEntry).imageText}"</h3>
                      </div>
                    ) : (activeMode === 'words' || activeMode === 'proverbs') ? (
                      <div className="text-center px-4">
                        <p className="text-[10px] md:text-xs font-black text-slate-400 tracking-[0.3em] mb-4 uppercase">{UI_STRINGS.isCorrectQuestion}</p>
                        <h3 className="text-2xl md:text-4xl font-black text-slate-800 game-title leading-tight">{(currentItem as GameEntry).text}</h3>
                      </div>
                    ) : (
                      <div className="text-center py-2 md:py-4">
                        <p className="text-[10px] md:text-xs font-black text-slate-400 tracking-[0.3em] mb-4 uppercase">{UI_STRINGS.targetWord}</p>
                        <h3 className="text-3xl md:text-6xl font-black text-emerald-600 game-title leading-tight drop-shadow-sm">{(currentItem as SynonymEntry).hitz}</h3>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full bg-white border border-slate-200 p-5 md:p-10 rounded-3xl shadow-lg">
                    {activeMode === 'hieroglyphs' && !showSolution && (
                      <div className="flex flex-col items-center gap-4 md:gap-6">
                         <div className={`text-4xl md:text-5xl font-black tabular-nums transition-colors ${timer <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>{timer}</div>
                         <div className="w-full relative">
                            <input 
                              type="text" 
                              value={userGuess} 
                              onChange={(e) => setUserGuess(e.target.value)} 
                              onKeyDown={(e) => e.key === 'Enter' && handleGuessCheck()} 
                              placeholder={UI_STRINGS.guessPlaceholder} 
                              className={`w-full bg-slate-50 border-2 rounded-xl py-3 md:py-4 px-6 text-lg md:text-xl focus:outline-none transition-all ${guessFeedback === 'wrong' ? 'border-red-500 animate-shake' : 'border-slate-200 focus:border-blue-500'}`} 
                              autoFocus 
                            />
                            <button onClick={handleGuessCheck} className="w-full mt-4 py-3 md:py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all game-title active:scale-95">{UI_STRINGS.checkButton}</button>
                         </div>
                      </div>
                    )}

                    {(activeMode === 'words' || activeMode === 'proverbs') && !showSolution && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <button onClick={() => handleSpellingChoice('ondo dago')} className="py-4 md:py-6 bg-green-600 text-white font-black rounded-2xl shadow-lg hover:bg-green-700 transition-all text-lg md:text-xl game-title active:scale-95">{UI_STRINGS.ondo}</button>
                        <button onClick={() => handleSpellingChoice('gaizki dago')} className="py-4 md:py-6 bg-red-600 text-white font-black rounded-2xl shadow-lg hover:bg-red-700 transition-all text-lg md:text-xl game-title active:scale-95">{UI_STRINGS.gaizki}</button>
                      </div>
                    )}

                    {activeMode === 'synonyms' && !showSolution && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {synonymOptions.map((opt, i) => (
                          <button key={i} onClick={() => handleOptionSelect(opt)} className="p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-base md:text-lg font-bold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all active:scale-95">{opt}</button>
                        ))}
                      </div>
                    )}

                    {showSolution && (
                      <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className={`w-full p-6 md:p-8 rounded-2xl text-center shadow-sm border-2 ${guessFeedback === 'correct' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className={`text-xs md:text-sm font-bold mb-4 uppercase tracking-wider ${guessFeedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                            {guessFeedback === 'correct' ? UI_STRINGS.correctFeedback : UI_STRINGS.wrongFeedback}
                          </p>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 mb-3 tracking-[0.2em] uppercase">{UI_STRINGS.hiddenSolution}</p>
                          {activeMode === 'hieroglyphs' ? (
                            <p className="text-3xl md:text-4xl font-black text-slate-900 game-title">{(currentItem as HieroglyphEntry).solution}</p>
                          ) : (activeMode === 'words' || activeMode === 'proverbs') ? (
                            <p className="text-3xl md:text-4xl font-black text-slate-900 game-title">{(currentItem as GameEntry).egoera === 'ondo dago' ? UI_STRINGS.ondo : UI_STRINGS.gaizki}</p>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-2">
                              {/* Only show the synonym that was actually used in the options for this round */}
                              <span className="bg-white border-2 border-green-200 px-4 md:px-6 py-2 md:py-3 rounded-xl text-lg md:text-xl font-bold text-green-700 shadow-sm animate-in zoom-in">
                                {correctSynonymForRound}
                              </span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={nextChallenge} 
                          className="mt-6 md:mt-8 w-full py-4 md:py-5 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-black transition-all game-title active:scale-95 flex items-center justify-center gap-3"
                        >
                          {UI_STRINGS.nextChallenge}
                          <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isFinished && (
                <div className="w-full p-8 md:p-12 bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[3rem] text-center shadow-2xl animate-in zoom-in duration-300">
                   <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-6 md:mb-8 game-title leading-tight">{mode === 'daily' ? UI_STRINGS.dailyFinished : "Jokoa amaitu da!"}</h2>
                   <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
                      <div className="p-4 md:p-6 bg-green-50 rounded-2xl md:rounded-3xl border-2 border-green-100">
                        <p className="text-[8px] md:text-xs font-black text-green-700 tracking-widest mb-1 md:mb-2 uppercase">Asmatuta</p>
                        <p className="text-3xl md:text-5xl font-black text-green-600">{correctCount}</p>
                      </div>
                      <div className="p-4 md:p-6 bg-red-50 rounded-2xl md:rounded-3xl border-2 border-red-100">
                        <p className="text-[8px] md:text-xs font-black text-red-700 tracking-widest mb-1 md:mb-2 uppercase">Huts egin da</p>
                        <p className="text-3xl md:text-5xl font-black text-red-600">{failedCount}</p>
                      </div>
                   </div>
                   <button onClick={resetGame} className="w-full py-4 md:py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all game-title shadow-xl active:scale-95">{UI_STRINGS.backMenu}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-full grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Zuzenak</p>
                  <p className="text-lg md:text-xl font-bold text-green-600">{currentListData.filter(d => d.egoera === 'ondo dago').length - currentListData.filter((d, i) => revealedIndexes.has(i) && d.egoera === 'ondo dago').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Okerrak</p>
                  <p className="text-lg md:text-xl font-bold text-red-600">{currentListData.filter(d => d.egoera === 'gaizki dago').length - currentListData.filter((d, i) => revealedIndexes.has(i) && d.egoera === 'gaizki dago').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Geratzen dira</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">{currentListData.length - revealedIndexes.size}</p>
                </div>
              </div>
              <div className="space-y-1">
                {currentListData.map((item, idx) => (
                  <WordItem 
                    key={`${level}-${idx}`} 
                    text={item.text} 
                    actualStatus={item.egoera} 
                    isRevealed={revealedIndexes.has(idx)} 
                    onClick={() => {
                      setRevealedIndexes(prev => {
                        const n = new Set(prev);
                        n.add(idx);
                        return n;
                      });
                    }} 
                  />
                ))}
              </div>
              {revealedIndexes.size === currentListData.length && (
                <div className="mt-8 p-6 md:p-10 bg-blue-50 border border-blue-200 rounded-[2rem] md:rounded-[2.5rem] text-center shadow-inner">
                  <p className="text-xl md:text-2xl font-black text-blue-900 mb-6 game-title">Zerrenda osatuta!</p>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                    {mode === 'words' && level === 1 && (
                      <button 
                        onClick={() => {setLevel(2); setRevealedIndexes(new Set()); window.scrollTo({top: 0, behavior: 'smooth'});}} 
                        className="px-8 py-3 md:py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg active:scale-95"
                      >
                        {UI_STRINGS.nextLevel}
                      </button>
                    )}
                    <button onClick={resetGame} className="px-8 py-3 md:py-4 bg-white border border-slate-300 text-slate-700 font-black rounded-xl active:scale-95">{UI_STRINGS.backMenu}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return view === 'menu' ? renderMenu() : renderGame();
};

export default App;
