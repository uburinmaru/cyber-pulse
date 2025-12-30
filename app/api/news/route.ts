import { NextResponse } from 'next/server';

export const revalidate = 3600; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  const SOURCES = [
    { name: "THE_HACKER_NEWS", url: "https://feeds.feedburner.com/TheHackersNews" },
    { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/" }
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, { next: { revalidate: 3600 } });
        const xml = await res.text();
        const items = xml.split('<item>').slice(1, 10);
        return items.map(item => {
          const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1].trim() || "";
          return title;
        });
      } catch { return []; }
    }));

    const titlesForAi = allNews.flat().filter(t => t !== "").join('\n');
    
    if (!GEMINI_API_KEY) return NextResponse.json({ summary: "Key Missing" });

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたはサイバーインテリジェンスのスペシャリストです。
以下のニュースから「実際に発生した攻撃・侵害（インシデント）」を1つ特定し、専門家向けに詳細報告してください。単なる脆弱性アップデート情報は除外すること。

【出力ルール：絶対遵守】
・挨拶、前置き、記号（#や*）は禁止。
・以下の2項目のみを出力。

🚨 インシデントの全容と技術的解析
（被害組織、攻撃主体、侵入経路、被害規模などを300字程度で具体的に。CVEではなく実際の挙動に焦点を当てること）

🛡️ 推奨される即時アクション
（現場が取るべき具体的な対抗措置）

ニュース：
${titlesForAi}` }] }]
      })
    });

    const data = await geminiRes.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No Incident Detected.";

    return NextResponse.json({ 
      summary: aiText.trim(),
      date: new Date().toLocaleDateString('ja-JP'),
      title: aiText.split('\n')[1]?.replace('🚨 ', '') || "Latest Incident"
    });
  } catch {
    return NextResponse.json({ summary: "Offline" });
  }
}