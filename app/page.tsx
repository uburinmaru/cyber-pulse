"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ブラウザから直接RSSを読みに行かず、作成したAPI経由でデータを取得します
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary);
        setLoading(false);
      })
      .catch(() => {
        setSummary("Intelligence synchronization failed.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-zinc-900 font-sans flex flex-col items-center">
      <header className="w-full max-w-[800px] pt-24 pb-12 px-8">
        <p className="text-[10px] font-black tracking-[0.4em] text-zinc-400 mb-4 uppercase">
          Verified Intelligence Real-Time Analysis
        </p>
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-red-600 leading-none mb-12">
          CYBER<br/>PULSE
        </h1>
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight uppercase">Latest Intelligence</h2>
          <p className="text-zinc-500 font-bold tracking-widest text-sm">世界から収集された最新の脅威実態</p>
        </div>
      </header>

      <main className="w-full max-w-[800px] px-8 py-10 flex-grow">
        {loading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black tracking-[0.5em] text-zinc-300 uppercase">Connecting to Secure Sources...</p>
          </div>
        ) : (
          <article className="space-y-12">
            <div className="bg-zinc-50 border-l-[16px] border-red-600 p-10 md:p-16 shadow-sm">
              <div className="text-lg md:text-xl leading-[2.5] font-bold text-zinc-800 whitespace-pre-wrap tracking-tight">
                {summary || "現在、解析対象となる重要インシデントは確認されていません。"}
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-8 border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all duration-500 font-black text-xs tracking-[1em] uppercase"
            >
              Update Intelligence
            </button>
          </article>
        )}
      </main>

      <footer className="w-full max-w-[800px] py-20 px-8 text-[9px] font-black text-zinc-300 tracking-[0.3em] uppercase border-t border-zinc-100 mt-20">
        © Intelligence Pulse // Critical Infrastructure Defense
      </footer>
    </div>
  );
}