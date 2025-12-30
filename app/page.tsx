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
        // 履歴の管理
        const saved = JSON.parse(localStorage.getItem('cyber_pulse_logs_v3') || '[]');
        if (data.title && !saved.some((l: any) => l.date === data.date)) {
          const updated = [{ ...data }, ...saved].slice(0, 15);
          setLogs(updated);
          localStorage.setItem('cyber_pulse_logs_v3', JSON.stringify(updated));
        } else {
          setLogs(saved);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-zinc-900 font-sans flex flex-col items-center p-6 md:p-12">
      <header className="w-full max-w-[800px] mb-16 border-b-8 border-red-600 pb-8">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-red-600 uppercase">Cyber<br/>Pulse</h1>
        <p className="text-[10px] font-bold tracking-[0.5em] text-zinc-400 mt-4 uppercase">Elite Incident Intelligence</p>
      </header>

      <main className="w-full max-w-[800px] space-y-20">
        {loading ? (
          <div className="py-20 text-center font-black animate-pulse text-zinc-200 uppercase tracking-widest">Scanning Network...</div>
        ) : (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">Today's Brief</span>
              <span className="text-xs font-mono font-bold text-zinc-400">{current?.date}</span>
            </div>
            <div className="bg-zinc-50 p-10 md:p-16 border border-zinc-100 shadow-sm">
              <div className="text-lg md:text-xl leading-[2.5] font-bold text-zinc-800 whitespace-pre-wrap tracking-tight">
                {current?.summary}
              </div>
            </div>
          </section>
        )}

        {/* 履歴セクション：日付ごとにまとめる */}
        <section className="pt-20 border-t border-zinc-100">
          <h2 className="text-2xl font-black mb-10 italic uppercase tracking-tighter">Incident Logs</h2>
          <div className="space-y-6">
            {logs.map((log, i) => (
              <details key={i} className="group border border-zinc-100 bg-white">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-50 transition-all list-none">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                    <span className="text-[10px] font-bold font-mono text-zinc-400">{log.date}</span>
                    <span className="text-sm font-black text-zinc-900 uppercase group-open:text-red-600 transition-colors">{log.title}</span>
                  </div>
                  <span className="text-zinc-300 font-bold group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <div className="p-8 md:p-12 bg-zinc-50/50 border-t border-zinc-50 text-base leading-[2] font-bold text-zinc-600 whitespace-pre-wrap">
                  {log.summary}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-40 text-[9px] font-black text-zinc-200 tracking-widest uppercase">
        © Intelligence Pulse // Incident Tracking Unit
      </footer>
    </div>
  );
}