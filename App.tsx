
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GAME_WORDS_LVL1, GAME_WORDS_LVL2, ATSOTITZAK, HIEROGLYPHS, SINONIMOAK, UI_STRINGS } from './constants';
import { WordItem } from './components/WordItem';
import { AppView, GameMode, GameEntry, HieroglyphEntry, SynonymEntry, WordStatus } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('menu');
  const [mode, setMode] = useState<GameMode>('words');
  const [level, setLevel] = useState<number>(1); // Session/List counter
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  
  // Interaction specific state
  const [gameLevel, setGameLevel] = useState<number>(0);
  const [shuffledHieros, setShuffledHieros] = useState<HieroglyphEntry[]>([]);
  const [shuffledSynonyms, setShuffledSynonyms] = useState<SynonymEntry[]>([]);
  const [sessionWords, setSessionWords] = useState<GameEntry[]>([]);
  const [timer, setTimer] = useState(40);
  const [showSolution, setShowSolution] = useState(false);
  const [userGuess, setUserGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasLost, setHasLost] = useState(false);
  const [dailySeedOffset, setDailySeedOffset] = useState(0);
  
  // Time tracking states
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [penaltyTime, setPenaltyTime] = useState<number>(0);

  const timerRef = useRef<number | null>(null);

  // Daily Mode Specific Items - Deterministic based on Date at 8:00 AM + Refresh Offset
  const dailyItems = useMemo(() => {
    const now = new Date();
    const d = new Date(now);
    if (now.getHours() < 8) {
      d.setDate(d.getDate() - 1);
    }
    const seed = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${dailySeedOffset}`;
    
    const getSeededIndex = (str: string, max: number) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const x = Math.sin(hash) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };

    const combinedWords = [...GAME_WORDS_LVL1, ...GAME_WORDS_LVL2];
    
    // STRICT ORDER: 1. words (zuzen idatzita), 2. proverbs (atsotitzak), 3. hieroglyphs (eroglifikoak), 4. synonyms (sinonimoak)
    return [
      { type: 'words' as GameMode, data: combinedWords[getSeededIndex(seed + "word", combinedWords.length) % combinedWords.length] },
      { type: 'proverbs' as GameMode, data: ATSOTITZAK[getSeededIndex(seed + "prov", ATSOTITZAK.length)] },
      { type: 'hieroglyphs' as GameMode, data: HIEROGLYPHS[getSeededIndex(seed + "hiero", HIEROGLYPHS.length)] },
      { type: 'synonyms' as GameMode, data: SINONIMOAK[getSeededIndex(seed + "syn", SINONIMOAK.length)] }
    ];
  }, [dailySeedOffset]);

  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }, []);

  const getBalancedSubset = useCallback((fullList: GameEntry[], size: number) => {
    let shuffledPool = shuffleArray(fullList);
    let subset = shuffledPool.slice(0, size);
    const hasWrong = subset.some(item => item.egoera === 'gaizki dago');
    
    if (!hasWrong) {
      const wrongOnes = fullList.filter(item => item.egoera === 'gaizki dago');
      if (wrongOnes.length > 0) {
        const randomWrong = wrongOnes[Math.floor(Math.random() * wrongOnes.length)];
        const replaceIdx = Math.floor(Math.random() * size);
        subset[replaceIdx] = randomWrong;
      }
    }
    return shuffleArray(subset);
  }, [shuffleArray]);

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

  const correctSynonymForRound = useMemo(() => {
    const activeMode = getActiveMode();
    if (activeMode !== 'synonyms' || !currentItem) return "";
    const synItem = currentItem as SynonymEntry;
    return synItem.sinonimoak[0];
  }, [currentItem, getActiveMode]);

  const synonymOptions = useMemo(() => {
    const activeMode = getActiveMode();
    if (activeMode !== 'synonyms' || !currentItem || !correctSynonymForRound) return [];
    
    const synItem = currentItem as SynonymEntry;
    const correctOnes = synItem.sinonimoak;
    
    // Categorized options logic
    const targetType = synItem.mota;
    const sameTypeEntries = SINONIMOAK.filter(s => s.mota === targetType && s.hitz !== synItem.hitz);
    const distractorsPool = Array.from(new Set(sameTypeEntries.flatMap(s => s.sinonimoak)))
      .filter(s => !correctOnes.includes(s));
    
    // Shuffle and pick 3 same-type distractors
    let pickedDistractors = distractorsPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Fallback: If not enough distractors of the same type, fill from the global pool
    if (pickedDistractors.length < 3) {
      const globalPool = Array.from(new Set(SINONIMOAK.flatMap(s => s.sinonimoak)))
        .filter(s => !correctOnes.includes(s) && !pickedDistractors.includes(s));
      const extraDistractors = globalPool.sort(() => 0.5 - Math.random()).slice(0, 3 - pickedDistractors.length);
      pickedDistractors = [...pickedDistractors, ...extraDistractors];
    }
    
    const finalOptions = [correctSynonymForRound, ...pickedDistractors];
    return finalOptions.sort(() => 0.5 - Math.random());
  }, [getActiveMode, currentItem, correctSynonymForRound]);

  const currentListData = useMemo(() => {
    if (mode === 'words' || mode === 'proverbs') {
      return sessionWords;
    }
    return [];
  }, [mode, sessionWords]);

  useEffect(() => {
    if (view === 'game') {
      setShowSolution(false);
      setUserGuess("");
      setGuessFeedback(null);
      setSelectedOption(null);
      
      const activeMode = getActiveMode();
      // Timer applies to Hieroglyphs always, and to Words, Proverbs, Synonyms ONLY in Daily Mode
      const isDailyTimed = mode === 'daily' && (activeMode === 'words' || activeMode === 'proverbs' || activeMode === 'synonyms');
      const needsTimer = activeMode === 'hieroglyphs' || isDailyTimed;

      if (needsTimer) {
        setTimer(activeMode === 'hieroglyphs' ? 40 : 10);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setFailedCount(f => f + 1);
              setShowSolution(true);
              setGuessFeedback("wrong");
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
  }, [view, getActiveMode, gameLevel, mode]);

  const finishGame = useCallback(() => {
    setEndTime(Date.now());
  }, []);

  const nextChallenge = useCallback(() => {
    const total = mode === 'daily' ? 4 : (mode === 'hieroglyphs' ? shuffledHieros.length : shuffledSynonyms.length);
    if (gameLevel < total - 1) {
      setGameLevel(prev => prev + 1);
    } else {
       setGameLevel(total); 
       finishGame();
    }
  }, [mode, gameLevel, shuffledHieros.length, shuffledSynonyms.length, finishGame]);

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

  const handleResolveChallenge = useCallback(() => {
    if (showSolution) return;
    setFailedCount(f => f + 1);
    setShowSolution(true);
    setGuessFeedback("wrong");
    // Penalty for skipping Hieroglyph is 40 seconds (as per request: "se contara como 40 segundos")
    setPenaltyTime(p => p + 40000);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [showSolution]);

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
    if (timerRef.current) clearInterval(timerRef.current);
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
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentItem, showSolution]);

  const startGame = useCallback((gameMode: GameMode) => {
    setMode(gameMode);
    setView('game');
    setLevel(1);
    setGameLevel(0);
    setCorrectCount(0);
    setFailedCount(0);
    setRevealedIndexes(new Set());
    setStartTime(Date.now());
    setEndTime(null);
    setPenaltyTime(0);
    setHasLost(false);
    setDailySeedOffset(0);
    
    if (gameMode === 'words') {
      const allWords = [...GAME_WORDS_LVL1, ...GAME_WORDS_LVL2];
      setSessionWords(getBalancedSubset(allWords, 6));
    } else if (gameMode === 'proverbs') {
      setSessionWords(getBalancedSubset(ATSOTITZAK, 6));
    } else if (gameMode === 'hieroglyphs') {
      setShuffledHieros(shuffleArray(HIEROGLYPHS));
    } else if (gameMode === 'synonyms') {
      setShuffledSynonyms(shuffleArray(SINONIMOAK));
    }
  }, [shuffleArray, getBalancedSubset]);

  const refreshDailyQuestions = useCallback(() => {
    setDailySeedOffset(prev => prev + 1);
    setGameLevel(0);
    setCorrectCount(0);
    setFailedCount(0);
    setPenaltyTime(0);
    setStartTime(Date.now());
    setEndTime(null);
    setShowSolution(false);
    setUserGuess("");
    setGuessFeedback(null);
    setSelectedOption(null);
  }, []);

  const nextList = useCallback(() => {
    setLevel(prev => prev + 1);
    setRevealedIndexes(new Set());
    setHasLost(false);
    setStartTime(Date.now());
    setEndTime(null);
    if (mode === 'words') {
      const allWords = [...GAME_WORDS_LVL1, ...GAME_WORDS_LVL2];
      setSessionWords(getBalancedSubset(allWords, 6));
    } else if (mode === 'proverbs') {
      setSessionWords(getBalancedSubset(ATSOTITZAK, 6));
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, [mode, getBalancedSubset]);

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
    setStartTime(null);
    setEndTime(null);
    setPenaltyTime(0);
    setHasLost(false);
    setDailySeedOffset(0);
  }, []);

  const calculateTotalTime = useMemo(() => {
    if (!startTime || !endTime) return "0.00";
    const actualDuration = endTime - startTime;
    const total = (actualDuration + penaltyTime) / 1000;
    return total.toFixed(2);
  }, [startTime, endTime, penaltyTime]);

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

    const getModeLabel = (m: GameMode) => {
      switch(m) {
        case 'words': return UI_STRINGS.modeWords;
        case 'proverbs': return UI_STRINGS.modeProverbs;
        case 'hieroglyphs': return UI_STRINGS.modeHieroglyphs;
        case 'synonyms': return UI_STRINGS.modeSynonyms;
        default: return UI_STRINGS.modeDaily;
      }
    };

    const showTimerInThisMode = activeMode === 'hieroglyphs' || (mode === 'daily' && (activeMode === 'words' || activeMode === 'proverbs' || activeMode === 'synonyms'));

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
            <div className="flex items-center gap-3">
              {mode === 'daily' && !isFinished && (
                <button
                  onClick={refreshDailyQuestions}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl active:scale-95"
                  title={UI_STRINGS.refreshDaily}
                >
                  <i className="fa-solid fa-rotate"></i>
                  <span className="font-bold text-[10px] md:text-xs">{UI_STRINGS.refreshDaily}</span>
                </button>
              )}
              <h2 className="text-sm md:text-xl font-black text-slate-800 tracking-tight game-title text-right">
                {mode === 'daily' ? UI_STRINGS.modeDaily : getModeLabel(mode)}
              </h2>
            </div>
          </div>

          {(mode === 'daily' || mode === 'hieroglyphs' || mode === 'synonyms') ? (
            <div className="flex flex-col items-center gap-4 md:gap-6">
              {!isFinished && (
                <>
                  {mode === 'daily' && (
                    <div className="w-full mb-2 px-5 py-3 bg-blue-50 border-l-4 border-blue-600 rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                      <p className="text-[10px] md:text-xs font-black text-blue-800 uppercase tracking-[0.2em] flex justify-between items-center">
                        <span>{gameLevel + 1} / 4</span>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full">{getModeLabel(activeMode)}</span>
                      </p>
                    </div>
                  )}

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
                </>
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
                        <p className="text-[10px] md:text-xs font-black text-slate-400 tracking-[0.3em] mb-4 uppercase">
                          {activeMode === 'words' ? UI_STRINGS.isCorrectQuestion : UI_STRINGS.isProverbCorrectQuestion}
                        </p>
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
                    {/* Timer display for timed modes (including Daily Game) */}
                    {showTimerInThisMode && !showSolution && (
                      <div className="flex flex-col items-center gap-4 md:gap-6 mb-6">
                         <div className={`text-4xl md:text-5xl font-black tabular-nums transition-colors ${timer <= 3 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                           {timer}
                         </div>
                      </div>
                    )}

                    {activeMode === 'hieroglyphs' && !showSolution && (
                      <div className="flex flex-col items-center gap-4 md:gap-6">
                         <div className="w-full">
                            <input 
                              type="text" 
                              value={userGuess} 
                              onChange={(e) => setUserGuess(e.target.value)} 
                              onKeyDown={(e) => e.key === 'Enter' && handleGuessCheck()} 
                              placeholder={UI_STRINGS.guessPlaceholder} 
                              className={`w-full bg-slate-50 border-2 rounded-xl py-3 md:py-4 px-6 text-lg md:text-xl focus:outline-none transition-all ${guessFeedback === 'wrong' ? 'border-red-500 animate-shake' : 'border-slate-200 focus:border-blue-500'}`} 
                              autoFocus 
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              <button onClick={handleGuessCheck} className="py-3 md:py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all game-title active:scale-95">{UI_STRINGS.checkButton}</button>
                              <button onClick={handleResolveChallenge} className="py-3 md:py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl shadow-sm hover:bg-slate-50 transition-all game-title active:scale-95">{UI_STRINGS.solution}</button>
                            </div>
                         </div>
                      </div>
                    )}

                    {(activeMode === 'words' || activeMode === 'proverbs') && !showSolution && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <button onClick={() => handleSpellingChoice('ondo dago')} className="py-4 md:py-6 bg-green-600 text-white font-black rounded-2xl shadow-lg hover:bg-green-700 transition-all text-lg md:text-xl game-title active:scale-95">
                          {activeMode === 'words' ? UI_STRINGS.ondo : UI_STRINGS.zuzena}
                        </button>
                        <button onClick={() => handleSpellingChoice('gaizki dago')} className="py-4 md:py-6 bg-red-600 text-white font-black rounded-2xl shadow-lg hover:bg-red-700 transition-all text-lg md:text-xl game-title active:scale-95">
                          {activeMode === 'words' ? UI_STRINGS.gaizki : UI_STRINGS.okerra}
                        </button>
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
                            {timer === 0 && guessFeedback === 'wrong' ? UI_STRINGS.timerExpired : (guessFeedback === 'correct' ? UI_STRINGS.correctFeedback : UI_STRINGS.wrongFeedback)}
                          </p>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 mb-3 tracking-[0.2em] uppercase">{UI_STRINGS.hiddenSolution}</p>
                          {activeMode === 'hieroglyphs' ? (
                            <p className="text-3xl md:text-4xl font-black text-slate-900 game-title">{(currentItem as HieroglyphEntry).solution}</p>
                          ) : (activeMode === 'words' || activeMode === 'proverbs') ? (
                            <p className="text-3xl md:text-4xl font-black text-slate-900 game-title">
                              {(currentItem as GameEntry).egoera === 'ondo dago' 
                                ? (activeMode === 'words' ? UI_STRINGS.ondo : UI_STRINGS.zuzena) 
                                : (activeMode === 'words' ? UI_STRINGS.gaizki : UI_STRINGS.okerra)
                              }
                            </p>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-2">
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
                <div className="w-full p-8 md:p-12 bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[2.5rem] text-center shadow-2xl animate-in zoom-in duration-300">
                   <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-6 md:mb-8 game-title leading-tight">{mode === 'daily' ? UI_STRINGS.dailyFinished : "Jokoa amaitu da!"}</h2>
                   <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
                      <div className="p-4 md:p-6 bg-green-50 rounded-2xl md:rounded-3xl border-2 border-green-100">
                        <p className="text-[8px] md:text-xs font-black text-green-700 tracking-widest mb-1 md:mb-2 uppercase">Asmatuta</p>
                        <p className="text-3xl md:text-5xl font-black text-green-600">{correctCount}</p>
                      </div>
                      <div className="p-4 md:p-6 bg-red-50 rounded-2xl md:rounded-3xl border-2 border-red-100">
                        <p className="text-[8px] md:text-xs font-black text-red-700 tracking-widest mb-1 md:mb-2 uppercase">Huts egin da</p>
                        <p className="text-3xl md:text-5xl font-black text-red-600">{failedCount}</p>
                      </div>
                   </div>
                   
                   <div className="w-full mb-8 p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] md:text-xs font-black text-blue-800 uppercase tracking-[0.2em] mb-2">Denbora guztira</p>
                      <p className="text-3xl md:text-4xl font-black text-blue-600 game-title">{calculateTotalTime} segundo</p>
                   </div>

                   <button onClick={resetGame} className="w-full py-4 md:py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all game-title shadow-xl active:scale-95">{UI_STRINGS.backMenu}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Puntuazioa</p>
                  <p className="text-lg md:text-xl font-bold text-slate-800">{correctCount} - {failedCount}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Zuzenak falta</p>
                  <p className="text-lg md:text-xl font-bold text-green-600">{currentListData.filter(d => d.egoera === 'ondo dago').length - currentListData.filter((d, i) => revealedIndexes.has(i) && d.egoera === 'ondo dago').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Okerrak falta</p>
                  <p className="text-lg md:text-xl font-bold text-red-600">{currentListData.filter(d => d.egoera === 'gaizki dago').length - currentListData.filter((d, i) => revealedIndexes.has(i) && d.egoera === 'gaizki dago').length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-3 text-center shadow-sm">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Guztira falta</p>
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
                    showDictionary={mode !== 'proverbs'}
                    onClick={() => {
                      if (hasLost) return;
                      const itemToReveal = currentListData[idx];
                      
                      if (mode === 'words') {
                        // Sudden death logic for spelling list
                        if (itemToReveal.egoera === 'gaizki dago') {
                          setHasLost(true);
                          setFailedCount(prev => prev + 1);
                          // Reveal all items on loss
                          const allIdx = new Set(currentListData.map((_, i) => i));
                          setRevealedIndexes(allIdx);
                          finishGame();
                        } else {
                          setCorrectCount(prev => prev + 1);
                          setRevealedIndexes(prev => {
                            const n = new Set(prev);
                            n.add(idx);
                            
                            const totalCorrect = currentListData.filter(d => d.egoera === 'ondo dago').length;
                            const foundCorrect = [...n].filter(i => currentListData[i].egoera === 'ondo dago').length;
                            
                            if (foundCorrect === totalCorrect) {
                              // Win condition: found all correct ones
                              // Also reveal the wrong ones to show we finished
                              const allIdx = new Set(currentListData.map((_, i) => i));
                              finishGame();
                              return allIdx;
                            }
                            return n;
                          });
                        }
                      } else {
                        // Regular logic for proverbs or other lists
                        if (itemToReveal.egoera === 'ondo dago') {
                          setCorrectCount(prev => prev + 1);
                        } else {
                          setFailedCount(prev => prev + 1);
                        }
                        setRevealedIndexes(prev => {
                          const n = new Set(prev);
                          n.add(idx);
                          if (n.size === currentListData.length) {
                            finishGame();
                          }
                          return n;
                        });
                      }
                    }} 
                  />
                ))}
              </div>
              {revealedIndexes.size === currentListData.length && (
                <div className={`mt-8 p-6 md:p-10 ${hasLost ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border rounded-[2rem] md:rounded-[2.5rem] text-center shadow-inner`}>
                  <p className={`text-xl md:text-2xl font-black mb-6 game-title ${hasLost ? 'text-red-900' : 'text-blue-900'}`}>
                    {hasLost ? UI_STRINGS.loseMessage : UI_STRINGS.winMessage}
                  </p>
                  
                  {!hasLost && (
                    <div className="w-full mb-8 p-6 bg-white border border-blue-100 rounded-2xl shadow-sm">
                        <p className="text-[10px] md:text-xs font-black text-blue-800 uppercase tracking-[0.2em] mb-2">Denbora guztira</p>
                        <p className="text-3xl md:text-4xl font-black text-blue-600 game-title">{calculateTotalTime} segundo</p>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                    {!hasLost && (
                      <button 
                        onClick={nextList} 
                        className="px-8 py-3 md:py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg active:scale-95"
                      >
                        {UI_STRINGS.nextLevel}
                      </button>
                    )}
                    <button onClick={resetGame} className={`px-8 py-3 md:py-4 bg-white border ${hasLost ? 'border-red-300 text-red-700' : 'border-slate-300 text-slate-700'} font-black rounded-xl active:scale-95`}>{UI_STRINGS.backMenu}</button>
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
