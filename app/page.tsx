"use client";
import { useState, useEffect, useCallback } from "react";

export default function Home() {
  const [groupedNews, setGroupedNews] = useState<Record<string, any[]>>({});
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        const groups = data.news.reduce((acc: any, item: any) => {
          const d = item.date;
          if (!acc[d]) acc[d] = [];
          acc[d].push(item);
          return acc;
        }, {});
        setGroupedNews(groups);
        setSummary(data.summary);
      }
      setLastUpdate(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
      setLoading(false);
    } catch (e) { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="w-full min-h-screen bg-[#fbfbfd] flex flex-col items-center px-6 md:px-24 overflow-x-hidden">
      <header className="w-full max-w-[900px] pt-32 pb-10">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Live Feed</span>
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.4em] uppercase italic">Cyber Pulse Intelligence</span>
          </div>
          <h1 className="brand-logo">CYBER PULSE</h1>
        </div>
      </header>

      {/* AI Intelligence Insight Section */}
      {!loading && summary && (
        <section className="w-full max-w-[900px] mt-10 p-10 bg-white border-t-[12px] border-red-600 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-b-3xl">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-100">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-red-600">Executive Insight</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Analysis at {lastUpdate}</span>
          </div>
          <div className="text-lg leading-[2.2] font-bold text-zinc-800 whitespace-pre-wrap tracking-tight">
            {summary}
          </div>
        </section>
      )}

      {/* News Section */}
      <main className="w-full max-w-[900px] py-40">
        <div className="mb-24 flex flex-col items-start">
          <h2 className="text-7xl font-black tracking-tighter text-zinc-950 mb-4 leading-none">LATEST<br/>INTELLIGENCE</h2>
          <div className="h-1.5 w-40 bg-red-600 mb-6"></div>
          <p className="text-xs font-bold text-zinc-400 tracking-[0.5em] uppercase">世界から収集された最新の脅威実態</p>
        </div>

        {loading ? (
          <div className="text-center font-mono text-zinc-400 py-40 tracking-[1em] uppercase text-[10px] animate-pulse">Decrypting Intelligence...</div>
        ) : Object.keys(groupedNews).map((date) => (
          <section key={date} className="mb-48">
            <div className="flex items-center gap-8 mb-16">
              <h2 className="text-5xl font-black tracking-tighter text-zinc-950 italic">{date}</h2>
              <div className="h-[2px] bg-zinc-100 flex-grow"></div>
            </div>
            <div className="flex flex-col gap-10">
              {groupedNews[date].map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="incident-card group shadow-sm hover:shadow-2xl transition-all duration-500 bg-white">
                  <span className="source-badge" style={{ backgroundColor: item.sourceColor }}>{item.source}</span>
                  <h3 className="text-2xl lg:text-4xl font-extrabold leading-tight text-zinc-900 group-hover:text-red-600 transition-all duration-300 mb-12">
                    {item.title}
                  </h3>
                  <div className="pt-8 border-t border-zinc-50 flex justify-between items-center text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                    <span>Analysis Context // Verified</span>
                    <span className="text-red-600 opacity-0 group-hover:opacity-100 transform translate-x-[-20px] group-hover:translate-x-0 transition-all duration-500">
                      Access Report →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}