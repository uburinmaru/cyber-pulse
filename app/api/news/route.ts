import { NextResponse } from 'next/server';

export const revalidate = 3600; 

export async function GET() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 確実にインシデント情報を配信しているグローバルソース
  const SOURCES = [
    { name: "THE_REGISTER", url: "https://www.theregister.com/security/headlines.atom" },
    { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/" },
    { name: "HACKER_NEWS", url: "https://feeds.feedburner.com/TheHackersNews" }
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, { next: { revalidate: 3600 } });
        const text = await res.text();
        // Titleタグを広範囲に検索
        const matches = text.match(/<title[^>]*>([\s\S]*?)<\/title>/g) || [];
        return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).slice(1, 10);
      } catch { return []; }
    }));

    const titles = allNews.flat().filter(t => t.length > 20).join('\n');

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは世界最高峰のサイバーインテリジェンス官です。
以下の最新ニュース群から、現在進行中の「重大なサイバー攻撃・侵害事例（インシデント）」を1つ選び、プロフェッショナル向けに極秘レポートを作成してください。

【出力ルール：絶対遵守】
・挨拶、装飾、マークダウン（#や*）は一切禁止。
・「🚨 状況分析」と「🛡️ 防御指示」の2項目のみ。
・被害組織、攻撃手法、影響範囲を具体的に記述。

ソース：
${titles}` }] }]
      })
    });

    const data = await geminiRes.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "NO CRITICAL THREAT DETECTED.";

    return NextResponse.json({ 
      summary: aiText.trim(),
      date: new Date().toLocaleDateString('ja-JP'),
      title: aiText.split('\n')[0]?.replace('🚨 ', '') || "SITUATION REPORT"
    });
  } catch {
    return NextResponse.json({ summary: "SYSTEM OFFLINE" });
  }
}