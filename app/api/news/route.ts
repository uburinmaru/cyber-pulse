import { NextResponse } from 'next/server';

export const revalidate = 3600; 

// ★取得したAPIキーを正確に貼り付けてください
const GEMINI_API_KEY = "AIzaSyDzpBHu_xfHJ6HArkdeT-esCCNH0sWrbvo";

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
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `サイバーセキュリティのプロとして、経営層向けに最新の脅威を極めて濃密に分析してください。

【厳守事項】
・「宛先」「序文」「作成日」などは一切不要。いきなり本題から書くこと。
・マークダウン記号（# や *）は絶対に使用しない。
・改行と絵文字を効果的に使い、視覚的に分かりやすくすること。

以下の2構成で、各300字程度でまとめてください：

🚨 最新インシデントの深層分析
（現在の攻撃の技術的本質、標的となっている資産、事業継続への具体的リスクを詳細に）

🛡️ 実効的な防御技術と対策
（EDR/XDR、認証基盤、パッチ管理など、現場が導入・強化すべき技術的詳細と優先順位を詳細に）

ニュース：
${titlesForAi}` }] }]
          })
        });

        const geminiData = await geminiRes.json();
        if (geminiData.candidates && geminiData.candidates[0].content) {
          aiSummary = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (e) { aiSummary = "分析エンジン待機中..."; }
    }
    return NextResponse.json({ news: filteredNews, summary: aiSummary });
  } catch (error) {
    return NextResponse.json({ news: [], summary: "システム復旧中..." });
  }
}