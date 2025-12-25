import { NextResponse } from 'next/server';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// ★取得したAPIキーを正確に貼り付けてください
const GEMINI_API_KEY = "AIzaSyAjoRhAlz9B9-EuIIjy_nYBDYNKBE-gdLs";

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
        const res = await fetch(source.url, { cache: 'no-store' });
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

    let aiSummary = "AI分析を生成できませんでした。";

    if (filteredNews.length > 0) {
      try {
        // タイムアウトを避けるため上位10件に制限
        const titlesForAi = filteredNews.slice(0, 10).map(n => n.title).join('\n');
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `あなたは世界屈指のサイバー戦略アナリストです。最新ニュースを分析し、全国の経営層に向けて専門的かつ深い洞察を含んだ日本語レポートを作成してください。

🚨 【深層リスク：事業継続へのインパクト】
🛡️ 【戦術的防衛：今、現場に命じるべきこと】
💡 【戦略的潮流：次なる脅威の予兆】

ニュース：
${titlesForAi}` }] }]
          })
        });

        const geminiData = await geminiRes.json();

        if (geminiData.error) {
          aiSummary = `エラー: ${geminiData.error.message}`;
        } else if (geminiData.candidates && geminiData.candidates[0].content) {
          aiSummary = geminiData.candidates[0].content.parts[0].text;
        }
      } catch (e: any) {
        aiSummary = "分析実行中にエラーが発生しました。";
      }
    }

    return NextResponse.json({ news: filteredNews, summary: aiSummary });
  } catch (error) {
    return NextResponse.json({ news: [], summary: "システム全体のエラーです。" });
  }
}