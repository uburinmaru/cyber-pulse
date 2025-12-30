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
        const saved = JSON.parse(localStorage.getItem('cyber_pulse_v6') || '[]');
        if (data.summary && !saved.some((l: any) => l.summary === data.summary)) {
          const updated = [data, ...saved].slice(0, 20);
          setLogs(updated);
          localStorage.setItem('cyber_pulse_v6', JSON.stringify(updated));
        } else { setLogs(saved); }
      }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-red-100">
      <main className="max-w-[900px] mx-auto px-6 py-16 md:py-24">
        
        {/* Header Section */}
        <header className="mb-20 space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic text-slate-950">
              Cyber Pulse
            </h1>
            <div className="h-[2px] flex-grow bg-slate-200"></div>
          </div>
          <p className="text-[11px] font-bold tracking-[0.5em] text-slate-400 uppercase">
            Intelligence Analysis Dashboard // 2025
          </p>
        </header>

        {/* Current Intelligence Card */}
        <section className="mb-32">
          <div className="flex justify-between items-end mb-8 px-2">
            <div className="space-y-1">
              <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest rounded-sm">Priority Alpha</span>
              <h2 className="text-2xl font-black text-slate-900">{current?.title || "Scanning..."}</h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{current?.date}</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-14 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-300 tracking-[0.3em]">SYNCHRONIZING SOURCES</p>
              </div>
            ) : (
              <div className="text-base md:text-lg leading-[2] text-slate-700 whitespace-pre-wrap font-medium">
                {current?.summary}
              </div>
            )}
          </div>
        </section>

        {/* Archive Section */}
        <section>
          <div className="flex items-center gap-6 mb-16">
            <h3 className="text-xs font-black tracking-[0.4em] text-slate-400 uppercase whitespace-nowrap italic">Archive Logs</h3>
            <div className="h-[1px] w-full bg-slate-100"></div>
          </div>
          
          <div className="space-y-6">
            {logs.map((log, i) => (
              <details key={i} className="group overflow-hidden bg-white border border-slate-100 rounded-xl hover:border-slate-300 transition-all duration-300 shadow-sm">
                <summary className="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none select-none">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
                    <span className="text-[10px] font-bold font-mono text-slate-300 uppercase">{log.date}</span>
                    <span className="text-sm font-black text-slate-800 group-open:text-red-600 transition-colors uppercase tracking-tight">
                      {log.title}
                    </span>
                  </div>
                  <span className="text-slate-300 text-xs group-open:rotate-180 transition-transform font-bold">▼</span>
                </summary>
                <div className="px-8 pb-10 md:px-14 md:pb-14 pt-2 text-slate-500 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-medium">
                  {log.summary}
                </div>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-40 text-center space-y-4 border-t border-slate-100 pt-16">
          <p className="text-[10px] font-black text-slate-200 tracking-[0.8em] uppercase italic">
            Confidential Feed // Unauthorized Access Prohibited
          </p>
          <p className="text-[10px] font-bold text-slate-300 uppercase">
            © 2025 CP Intelligence Pulse
          </p>
        </footer>
      </main>
    </div>
  );
}