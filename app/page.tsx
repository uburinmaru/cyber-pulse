"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [current, setCurrent] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        setCurrent(data);
        setLoading(false);
        const saved = JSON.parse(localStorage.getItem('cyber_pulse_v4') || '[]');
        if (data.title && !saved.some((l: any) => l.summary === data.summary)) {
          const updated = [data, ...saved].slice(0, 20);
          setLogs(updated);
          localStorage.setItem('cyber_pulse_v4', JSON.stringify(updated));
        } else { setLogs(saved); }
      }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-400 font-mono p-4 md:p-12">
      {/* Header */}
      <header className="max-w-[1000px] mx-auto mb-20 border-b border-zinc-800 pb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-2 italic">CYBER PULSE</h1>
            <p className="text-[10px] tracking-[0.6em] text-red-600 font-bold uppercase">Critical Incident Feed // Level 5 Clearance</p>
          </div>
          <div className="text-right hidden md:block border-l border-zinc-800 pl-6">
            <p className="text-[10px] text-zinc-600 uppercase">System Status</p>
            <p className="text-xs text-green-500 font-bold tracking-widest">● LIVE_FEED</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto space-y-24">
        {/* Current Brief */}
        <section className="relative">
          <div className="absolute -top-3 left-6 bg-red-600 text-white text-[9px] font-black px-3 py-1 z-10 uppercase tracking-widest">Priority Alpha</div>
          <div className="bg-[#111] border border-zinc-800 p-8 md:p-16 shadow-2xl">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-zinc-600 tracking-widest">FETCHING INTELLIGENCE...</div>
            ) : (
              <div className="text-lg md:text-xl leading-[2.2] text-zinc-200 whitespace-pre-wrap">
                {current?.summary}
              </div>
            )}
          </div>
        </section>

        {/* Logs Section */}
        <section>
          <div className="flex items-center gap-6 mb-12">
            <h2 className="text-xs font-black tracking-[0.4em] uppercase text-zinc-500 italic">Archive Logs</h2>
            <div className="h-[1px] bg-zinc-800 flex-grow"></div>
          </div>
          
          <div className="grid gap-2">
            {logs.map((log, i) => (
              <details key={i} className="group bg-[#111] border border-zinc-900 hover:border-zinc-700 transition-all">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <div className="flex items-center gap-8">
                    <span className="text-[10px] text-zinc-600 font-bold w-20">{log.date}</span>
                    <span className="text-sm font-black text-zinc-400 group-open:text-red-500 transition-colors uppercase tracking-tight">
                      {log.title}
                    </span>
                  </div>
                  <span className="text-zinc-700 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-14 pb-12 text-zinc-500 leading-relaxed text-sm whitespace-pre-wrap border-t border-zinc-900/50 pt-8">
                  {log.summary}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-[1000px] mx-auto mt-40 pt-10 border-t border-zinc-900 flex justify-between text-[9px] font-bold text-zinc-700 tracking-widest uppercase italic">
        <span>© CYBER PULSE INTELLIGENCE UNIT</span>
        <span>2025 // ENCRYPTED</span>
      </footer>
    </div>
  );
}