import { NextResponse } from 'next/server';

export const revalidate = 3600; 

// 直接書かずに、環境変数から読み出す設定に変更
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  const SOURCES = [
    { name: "THE_HACKER_NEWS", url: "https://feeds.feedburner.com/TheHackersNews", color: "#1d4ed8" },
    { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/", color: "#000000" },
    { name: "CISA_INTEL", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", color: "#b91c1c" },
    { name: "FBI_IC3", url: "https://www.ic3.gov/rss/default.xml", color: "#1e3a8a" }
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, { next: { revalidate: 3600 } });
        const xml = await res.text();
        const items = xml.split('<item>').slice(1);
        return items.map(item => {
          const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1].trim() || "";
          const link = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1].trim() || "#";
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
          const dateObj = new Date(pubDate);
          return {
            title, link,
            date: isNaN(dateObj.getTime()) ? "Unknown" : new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' }).format(dateObj).replace(/\//g, '.'),
            timestamp: dateObj.getTime() || 0,
            source: source.name,
            sourceColor: source.color
          };
        });
      } catch (e) { return []; }
    }));

    const incidentKeywords = ["ransomware", "breach", "leak", "hacked", "stolen", "attack", "compromised", "malware", "cyber", "espionage", "security", "threat", "incident"];
    const filteredNews = allNews.flat()
      .filter(n => n.title !== "" && n.timestamp !== 0 && incidentKeywords.some(key => n.title.toLowerCase().includes(key)))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40);

    let aiSummary = "";

    if (filteredNews.length > 0) {
      try {
        const titlesForAi = filteredNews.slice(0, 10).map(n => n.title).join('\n');
        
        // Gemini 2.5 Flash-Lite を使用
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `あなたは世界屈指のサイバー戦略アナリストです。最新ニュースを分析し、経営層に向けて深い洞察を含んだレポートを作成してください。

🚨 最新インシデントの深層分析
🛡️ 実効的な防御技術と対策

ニュース：
${titlesForAi}` }] }]
          })
        });

        const geminiData = await geminiRes.json();
        if (geminiData.candidates && geminiData.candidates[0].content) {
          aiSummary = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        aiSummary = "分析エンジン待機中...";
      }
    }

    return NextResponse.json({ news: filteredNews, summary: aiSummary });
  } catch (error) {
    return NextResponse.json({ news: [], summary: "システム復旧中..." });
  }
}