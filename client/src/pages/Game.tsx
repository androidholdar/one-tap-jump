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
  const [highScore, setHighScore] = useState(0); // Local high score
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [username, setUsername] = useState("");
  
  const submitScoreMutation = useSubmitScore();

  // Load high score from local storage
  useEffect(() => {
    const saved = localStorage.getItem("jump_high_score");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleStart = () => {
    setScore(0);
    setGameState("PLAYING");
  };

  const handleGameOver = (finalScore: number) => {
    setGameState("GAMEOVER");
    setScore(finalScore);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("jump_high_score", finalScore.toString());
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowSaveDialog(true);
    } else if (finalScore > 0) {
      // Prompt to save decent scores too? Let's just prompt for high scores or any score > 50
      if (finalScore > 50) setShowSaveDialog(true);
    }
  };

  const handleSaveScore = async () => {
    if (!username.trim()) return;
    try {
      await submitScoreMutation.mutateAsync({ 
        username: username, 
        score: score 
      });
      setShowSaveDialog(false);
    } catch (e) {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-0 font-sans overflow-hidden">
      <div className="game-container bg-gradient-to-b from-sky-200 to-white flex flex-col relative h-full w-full">
        
        {/* Header / HUD - Safe Area Aware */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-8 flex justify-between items-center pointer-events-none">
          {gameState === "PLAYING" ? (
             <div className="flex flex-col">
               <span className="text-4xl font-black text-slate-800 drop-shadow-sm font-display">
                 {score}
               </span>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meters</span>
             </div>
          ) : (
             <div /> /* Spacer */
          )}
          
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="pointer-events-auto p-2 bg-white/50 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6 text-slate-700"/> : <VolumeX className="w-6 h-6 text-slate-400"/>}
          </button>
        </div>

        {/* Game Canvas Layer */}
        <div className="flex-1 relative overflow-hidden flex flex-col justify-center items-center">
          {/* Clouds Background Decoration */}
          <div className="absolute top-20 left-10 text-white/40 animate-float pointer-events-none z-0">
             <CloudIcon className="w-24 h-24" />
          </div>
          <div className="absolute top-40 right-10 text-white/30 animate-float pointer-events-none z-0" style={{animationDelay: "2s"}}>
             <CloudIcon className="w-16 h-16" />
          </div>

          <GameCanvas 
            isPlaying={gameState === "PLAYING"} 
            onGameOver={handleGameOver}
            onScoreUpdate={setScore}
          />

          {/* MENUS OVERLAY */}
          <AnimatePresence>
            {gameState === "MENU" && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm p-6 pb-32"
              >
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-6xl text-primary font-black tracking-tight drop-shadow-md mb-2">
                    JUMP<br/><span className="text-slate-800">UP!</span>
                  </h1>
                  <p className="text-slate-600 font-medium">Tap & Hold to Move</p>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="btn-primary mb-6 shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <Play className="fill-current w-6 h-6" />
                    <span>Start Game</span>
                  </div>
                </motion.button>
                
                <div className="mt-8 flex-1 overflow-auto w-full max-h-[40vh]">
                  <Leaderboard className="scale-90 origin-top" />
                </div>
              </motion.div>
            )}

            {gameState === "GAMEOVER" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-6 pb-32"
              >
                <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-slate-100">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Game Over!</h2>
                  
                  <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                    <div className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-1">Score</div>
                    <div className="text-5xl font-black text-primary mb-4">{score}</div>
                    
                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-slate-400 text-sm font-semibold">BEST</span>
                      <span className="text-slate-700 font-bold text-lg">{highScore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleStart} className="btn-primary flex items-center justify-center space-x-2 py-3 text-lg col-span-2">
                      <RotateCcw className="w-5 h-5" />
                      <span>Try Again</span>
                    </button>
                    
                    <button onClick={() => setGameState("MENU")} className="btn-secondary flex items-center justify-center col-span-2">
                      <Home className="w-5 h-5 mr-2" />
                      <span>Main Menu</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ad Space - Always at bottom, dedicated container */}
        {(gameState === "MENU" || gameState === "GAMEOVER") && (
          <div className="z-40 relative bg-white mt-auto pb-[env(safe-area-inset-bottom,0px)]">
            <BannerAd />
          </div>
        )}
      </div>

      {/* Save Score Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">New High Score! 🎉</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">{score}</span>
              <p className="text-sm text-muted-foreground mt-2">Enter your name for the leaderboard</p>
            </div>
            <Input
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center text-lg font-bold"
              maxLength={10}
            />
            <Button 
              onClick={handleSaveScore} 
              disabled={submitScoreMutation.isPending || !username}
              className="w-full btn-primary"
            >
              {submitScoreMutation.isPending ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CloudIcon({className, ...props}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.34,0.032-0.672,0.091-0.995C11.594,12.235,11.056,12,10.5,12 c-2.481,0-4.5,2.019-4.5,4.5c0,0.184,0.017,0.364,0.046,0.54C6.012,17.013,6.006,17.006,6,17.006C2.691,17.006,0,14.315,0,11.006 c0-3.309,2.691-6,6-6c0.418,0,0.824,0.045,1.218,0.126C8.046,2.053,11.176,0,14.5,0c4.136,0,7.5,3.364,7.5,7.5 c0,0.224-0.012,0.444-0.034,0.662C23.116,8.552,24,9.948,24,11.5c0,3.033-2.467,5.5-5.5,5.5c-0.334,0-0.66-0.032-0.978-0.089 C17.513,18.232,17.506,19,17.5,19z"/>
    </svg>
  );
}
