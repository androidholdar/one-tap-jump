import { Info } from "lucide-react";

export function BannerAd() {
  return (
    <div className="w-full h-16 bg-gray-100 border-t border-gray-200 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-50">
        <span className="text-xs font-mono text-gray-400 tracking-widest uppercase">Ad Space</span>
      </div>
      
      {/* Fake Ad Content */}
      <div className="z-10 flex items-center space-x-3 px-4 w-full">
        <div className="w-10 h-10 bg-blue-500 rounded-lg shrink-0 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-3 w-3/4 bg-gray-300 rounded mb-2"></div>
          <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
          INSTALL
        </button>
      </div>
      
      <div className="absolute top-0 right-0 p-1">
        <Info className="w-3 h-3 text-gray-300" />
      </div>
    </div>
  );
}
