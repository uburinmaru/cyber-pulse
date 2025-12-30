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
        return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).slice(1, 8);
      } catch { return []; }
    }));

    const titles = allNews.flat().filter(t => t.length > 20).join('\n');

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `サイバーセキュリティ・アナリストとして報告。
最新ニュースから重大なインシデントを1つ選び、詳細に解説せよ。

【ルール】
・挨拶、前置き、記号（#や*）は禁止。
・「🚨 状況分析」と「🛡️ 推奨対策」の2項目。
・300字程度で具体的に。

ソース：
${titles}` }] }]
      })
    });

    const data = await geminiRes.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No intelligence.";

    return NextResponse.json({ 
      summary: aiText.trim(),
      date: new Date().toLocaleDateString('ja-JP'),
      title: aiText.split('\n')[0]?.replace('🚨 ', '') || "インシデント・サマリー"
    });
  } catch {
    return NextResponse.json({ summary: "SYSTEM_ERROR" });
  }
}