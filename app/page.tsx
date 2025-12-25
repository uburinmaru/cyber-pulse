"use client";
import { useState, useEffect, useCallback } from "react";

export default function Home() {
  const [groupedNews, setGroupedNews] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      const newsArray = await res.json();
      if (newsArray && newsArray.length > 0) {
        const groups = newsArray.reduce((acc: any, item: any) => {
          const d = item.date;
          if (!acc[d]) acc[d] = [];
          acc[d].push(item);
          return acc;
        }, {});
        setGroupedNews(groups);
      }
      setLastUpdate(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
      setLoading(false);
    } catch (e) { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 180000); 
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="w-full min-h-screen bg-[#fbfbfd] flex flex-col items-center px-12 md:px-24 overflow-x-hidden">
      
      {/* 左右に大きな余白を持たせたヘッダー */}
      <header className="w-full max-w-[800px] pt-32 pb-20 border-b border-zinc-100">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Breaking</span>
            <span className="text-[9px] font-bold text-zinc-400 tracking-[0.4em] uppercase italic">Multi-Source Stream</span>
          </div>
          <h1 className="brand-logo">Cyber Pulse</h1>
          <div className="mt-10 flex items-center gap-6 text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
              Live Sync Active
            </span>
            <span className="text-zinc-300">Sync: {lastUpdate}</span>
          </div>
        </div>
      </header>

      {/* メイン：ソース名を独立させ視認性を向上 */}
      <main className="w-full max-w-[800px] py-24 pb-60">
        {loading ? (
          <div className="text-center font-mono text-zinc-200 py-40 tracking-[1em] uppercase text-[9px]">Analyzing Intelligence...</div>
        ) : Object.keys(groupedNews).map((date) => (
          <section key={date} className="mb-40">
            <div className="flex items-center gap-6 mb-16">
              <h2 className="text-4xl font-black tracking-tighter text-zinc-900 italic leading-none">{date}</h2>
              <div className="h-[1px] bg-red-600/10 flex-grow"></div>
            </div>

            <div className="flex flex-col gap-8">
              {groupedNews[date].map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="incident-card group">
                  <div className="flex flex-col items-start">
                    {/* ソースラベルをタイトルの上に独立配置 */}
                    <span 
                      className="source-badge"
                      style={{ backgroundColor: item.sourceColor }}
                    >
                      {item.source}
                    </span>
                    
                    {/* タイトル：青色と下線を廃止、サイズを最適化 */}
                    <h3 className="text-2xl lg:text-3xl font-bold leading-tight text-zinc-900 group-hover:text-red-600 transition-all duration-300 mb-10">
                      {item.title}
                    </h3>
                  </div>
                  
                  <div className="pt-8 border-t border-zinc-50 flex justify-between items-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                    <span>Intelligence Analysis // No Noise</span>
                    <span className="group-hover:text-red-600 transition-all transform group-hover:translate-x-3 duration-500">
                      View Detail →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="w-full py-40 bg-zinc-950 text-center">
        <p className="text-[10px] font-mono text-zinc-600 tracking-[1.5em] uppercase italic">Cyber Pulse Intelligence</p>
      </footer>
    </div>
  );
}