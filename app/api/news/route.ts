import { NextResponse } from 'next/server';

export const revalidate = 3600; 

export async function GET() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SOURCES = [
    { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/" },
    { name: "THE_REGISTER", url: "https://www.theregister.com/security/headlines.atom" }
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, { next: { revalidate: 3600 } });
        const text = await res.text();
        const matches = text.match(/<title[^>]*>([\s\S]*?)<\/title>/g) || [];
        return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).slice(1, 10);
      } catch { return []; }
    }));

    const titles = allNews.flat().filter(t => t.length > 20).join('\n');

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `サイバーインテリジェンス官として報告。
最新ニュース群から「最も重大なインシデント」を1つ選び、報告せよ。

【ルール】
・挨拶や前置き、マークダウン（#や*）は一切禁止。
・1行目は必ず「事件を象徴する簡潔なタイトル」のみを記載。
・2行目以降に「🚨 状況分析」「🛡️ 推奨対策」を記述。

ニュース：
${titles}` }] }]
      })
    });

    const data = await geminiRes.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const lines = aiText.split('\n');

    return NextResponse.json({ 
      title: lines[0]?.trim() || "Critical Incident",
      summary: lines.slice(1).join('\n').trim(),
      date: new Date().toLocaleDateString('ja-JP')
    });
  } catch {
    return NextResponse.json({ summary: "SYSTEM ERROR" });
  }
}