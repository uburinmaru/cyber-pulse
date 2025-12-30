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
        const saved = JSON.parse(localStorage.getItem('cyber_pulse_v5') || '[]');
        // 同じ内容でなければ保存
        if (data.summary && !saved.some((l: any) => l.summary === data.summary)) {
          const updated = [data, ...saved].slice(0, 30);
          setLogs(updated);
          localStorage.setItem('cyber_pulse_v5', JSON.stringify(updated));
        } else {
          setLogs(saved);
        }
      }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 lg:p-24">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-16 border-b-4 border-slate-900 pb-8">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic mb-4">CYBER PULSE</h1>
        <p className="text-xs font-bold tracking-[0.4em] text-slate-400 uppercase">Expert Intelligence Report</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-24">
        {/* Main Incident Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">LATEST</span>
            <span className="text-xs font-bold text-slate-400">{current?.date}</span>
          </div>
          
          <div className="bg-white border-2 border-slate-900 p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
            {loading ? (
              <div className="py-20 text-center text-slate-400 font-bold animate-pulse">ANALYZING NEWS...</div>
            ) : (
              <div className="text-lg md:text-xl leading-[2.2] font-medium text-slate-800 whitespace-pre-wrap">
                {current?.summary}
              </div>
            )}
          </div>
        </section>

        {/* Archives Section: 日付ごとにまとめた表示 */}
        <section className="pt-20">
          <h2 className="text-3xl font-black mb-12 italic border-l-8 border-slate-900 pl-4 uppercase">Archive Logs</h2>
          <div className="space-y-8">
            {logs.length === 0 ? (
              <p className="text-slate-400 font-bold">No history available.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-red-500 transition-colors"></div>
                  <div className="pl-6 py-2">
                    <span className="text-[10px] font-black text-slate-400 mb-2 block tracking-widest uppercase">{log.date}</span>
                    <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-red-600 transition-colors">
                      {log.title}
                    </h3>
                    <div className="bg-white border border-slate-200 p-6 text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                      {log.summary}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-4xl mx-auto mt-40 pt-10 border-t border-slate-200 text-[10px] font-bold text-slate-300 tracking-widest uppercase flex justify-between">
        <span>Strategic Intelligence Unit</span>
        <span>© 2025 CP Pulse</span>
      </footer>
    </div>
  );
}