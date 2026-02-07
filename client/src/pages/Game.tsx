import { useState, useEffect } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { BannerAd } from "@/components/BannerAd";
import { Leaderboard } from "@/components/Leaderboard";
import { useSubmitScore } from "@/hooks/use-scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Volume2, VolumeX, Play, RotateCcw, Home } from "lucide-react";

type GameState = "MENU" | "PLAYING" | "GAMEOVER";

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [username, setUsername] = useState("");
  const [gameOverCount, setGameOverCount] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);
  const [revived, setRevived] = useState(false);
  const [reviveTrigger, setReviveTrigger] = useState(0);
  
  const submitScoreMutation = useSubmitScore();

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("jump_high_score");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleStart = () => {
    setScore(0);
    setGameState("PLAYING");
    setRevived(false);
  };

  const handleGameOver = (finalScore: number) => {
    setGameState("GAMEOVER");
    setScore(finalScore);
    const newCount = gameOverCount + 1;
    setGameOverCount(newCount);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("jump_high_score", finalScore.toString());
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowSaveDialog(true);
    }
  };

  const handleReplay = () => {
    if (gameOverCount % 2 === 0) {
      setShowInterstitial(true);
      setTimeout(() => {
        setShowInterstitial(false);
        handleStart();
      }, 2000);
    } else {
      handleStart();
    }
  };

  const handleContinue = () => {
    setShowRewarded(true);
    setTimeout(() => {
      setShowRewarded(false);
      setRevived(true);
      setReviveTrigger(prev => prev + 1);
      setGameState("PLAYING");
    }, 2000);
  };

  const handleSaveScore = async () => {
    if (!username.trim()) return;
    try {
      await submitScoreMutation.mutateAsync({ username, score });
      setShowSaveDialog(false);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center font-sans overflow-hidden select-none touch-none">
      <div className="game-container bg-gradient-to-b from-sky-300 via-sky-100 to-white flex flex-col relative h-full w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header / HUD */}
        <div className="absolute top-0 left-0 right-0 z-20 p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex justify-between items-center pointer-events-none">
          {gameState === "PLAYING" ? (
             <div className="flex flex-col bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30">
               <span className="text-3xl font-black text-slate-800 font-display leading-none">
                 {score}
               </span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
             </div>
          ) : <div />}
          
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="pointer-events-auto p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white hover:scale-110 transition-transform active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6 text-sky-600"/> : <VolumeX className="w-6 h-6 text-slate-400"/>}
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center">
          <GameCanvas 
            isPlaying={gameState === "PLAYING"} 
            onGameOver={handleGameOver}
            onScoreUpdate={setScore}
            reviveTrigger={reviveTrigger}
          />

          {/* Overlay Menus */}
          <AnimatePresence>
            {gameState === "MENU" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md p-6 pb-40"
              >
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-7xl text-sky-600 font-black tracking-tighter drop-shadow-xl font-display mb-2">
                    JUMP<br/><span className="text-slate-800">ONE!</span>
                  </h1>
                  <p className="text-slate-600 font-bold text-lg bg-white/50 px-4 py-1 rounded-full border border-white/50 inline-block">Tap to Jump</p>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="btn-primary mb-8 shadow-[0_10px_30px_rgba(14,165,233,0.4)] w-64 py-5 text-2xl rounded-3xl"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Play className="fill-current w-8 h-8" />
                    <span className="font-black">PLAY NOW</span>
                  </div>
                </motion.button>
                
                <div className="w-full max-h-[35vh] overflow-hidden rounded-2xl bg-white/50 border border-white shadow-inner">
                  <Leaderboard className="scale-90 origin-top" />
                </div>
              </motion.div>
            )}

            {gameState === "GAMEOVER" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 pb-40"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t-8 border-sky-400"
                >
                  <h2 className="text-4xl font-black text-slate-800 mb-6 font-display">Time Up!</h2>
                  
                  <div className="bg-sky-50 rounded-3xl p-6 mb-8 border border-sky-100">
                    <div className="text-xs text-sky-500 uppercase tracking-[0.2em] font-black mb-2">Final Score</div>
                    <div className="text-6xl font-black text-sky-600 mb-4">{score}</div>
                    
                    <div className="flex justify-between items-center bg-white rounded-2xl px-5 py-3 shadow-sm border border-sky-100">
                      <span className="text-slate-400 text-xs font-black uppercase">Personal Best</span>
                      <span className="text-sky-600 font-black text-xl">{highScore}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {!revived && (
                      <button
                        onClick={handleContinue}
                        className="bg-emerald-500 text-white w-full flex items-center justify-center space-x-3 py-4 rounded-3xl font-black shadow-lg shadow-emerald-100 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>CONTINUE (AD)</span>
                      </button>
                    )}

                    <button
                      onClick={handleReplay}
                      className="btn-primary w-full flex items-center justify-center space-x-3 py-5 text-xl rounded-3xl shadow-lg shadow-sky-200"
                    >
                      <RotateCcw className="w-6 h-6 stroke-[3px]" />
                      <span className="font-black">REPLAY</span>
                    </button>
                    
                    <button
                      onClick={() => setGameState("MENU")}
                      className="bg-slate-100 text-slate-600 w-full flex items-center justify-center py-4 rounded-2xl font-black border border-slate-200 active:bg-slate-200 transition-colors"
                    >
                      <Home className="w-5 h-5 mr-2" />
                      <span>EXIT MENU</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ad Space - Mobile Safe Zone */}
        {(gameState === "MENU" || gameState === "GAMEOVER") && (
          <div className="mt-auto bg-white border-t border-slate-100 pb-[env(safe-area-inset-bottom,1rem)] pt-2 relative z-40 h-[100px] flex items-center">
            <BannerAd />
          </div>
        )}

        {/* Interstitial Ad Simulator */}
        {showInterstitial && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
             <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold">SPONSORED VIDEO</h3>
                <p className="text-slate-400 text-sm">Ad ends in 2 seconds...</p>
             </div>
          </div>
        )}

        {/* Rewarded Ad Simulator */}
        {showRewarded && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-10 text-center">
             <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
                <Play className="w-10 h-10 fill-white" />
             </div>
             <h3 className="text-2xl font-black mb-2">REWARDED AD</h3>
             <p className="text-slate-400">Watch to revive and keep your score!</p>
             <div className="w-full bg-slate-800 h-2 mt-8 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full animate-progress-fast"></div>
             </div>
          </div>
        )}
      </div>

      {/* Save Score Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md rounded-[30px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-black font-display text-sky-600">New High Score! 🎉</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-6 py-4">
            <div className="text-center bg-sky-50 rounded-3xl p-6 border border-sky-100">
              <span className="text-6xl font-black text-sky-600">{score}</span>
              <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">Global Rank Pending</p>
            </div>
            <Input
              placeholder="YOUR NAME"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center text-2xl font-black h-16 rounded-2xl border-2 border-slate-200 focus:border-sky-500 placeholder:text-slate-300"
              maxLength={10}
            />
            <Button 
              onClick={handleSaveScore} 
              disabled={submitScoreMutation.isPending || !username}
              className="w-full py-8 text-2xl font-black rounded-3xl btn-primary"
            >
              {submitScoreMutation.isPending ? "SAVING..." : "SAVE SCORE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
