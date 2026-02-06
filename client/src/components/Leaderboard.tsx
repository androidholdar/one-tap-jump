import { useScores } from "@/hooks/use-scores";
import { Trophy, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function Leaderboard({ className }: { className?: string }) {
  const { data: scores, isLoading } = useScores();

  return (
    <div className={cn("glass-panel p-6 w-full max-w-sm mx-auto", className)}>
      <div className="flex items-center justify-center space-x-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h3 className="text-2xl text-center text-foreground">Top Jumpers</h3>
      </div>

      <ScrollArea className="h-64 pr-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {scores?.sort((a, b) => b.score - a.score).map((score, index) => (
              <div
                key={score.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.02]",
                  index === 0 ? "bg-yellow-50 border-yellow-200" :
                  index === 1 ? "bg-slate-50 border-slate-200" :
                  index === 2 ? "bg-orange-50 border-orange-200" :
                  "bg-white border-transparent hover:border-slate-100"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-yellow-400 text-yellow-900" :
                    index === 1 ? "bg-slate-300 text-slate-700" :
                    index === 2 ? "bg-orange-300 text-orange-800" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                    {score.username}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-mono font-bold text-lg text-primary">
                    {score.score}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">m</span>
                </div>
              </div>
            ))}
            
            {scores?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No scores yet. Be the first!
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
