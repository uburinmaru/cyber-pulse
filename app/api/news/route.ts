import { NextResponse } from 'next/server';

// キャッシュを無効化し、常に最新のRSSを取得させる設定
export const revalidate = 0;
export const dynamic = 'force-dynamic';

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
        // キャッシュを無視してフェッチ
        const res = await fetch(source.url, { cache: 'no-store' });
        const xml = await res.text();
        
        // <item>タグで分割
        const items = xml.split('<item>').slice(1);

        return items.map(item => {
          // タイトルとリンクを抽出（CDATA対応）
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
          const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
          const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

          const title = titleMatch ? titleMatch[1].trim() : "";
          const link = linkMatch ? linkMatch[1].trim() : "#";
          const pubDate = pubDateMatch ? pubDateMatch[1] : "";
          
          const dateObj = new Date(pubDate);
          
          return {
            title,
            link,
            date: isNaN(dateObj.getTime()) ? "Unknown" : dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.'),
            timestamp: dateObj.getTime() || 0,
            source: source.name,
            sourceColor: source.color
          };
        });
      } catch (e) { 
        return []; 
      }
    }));

    // フィルタリング（インシデントに関連するキーワード）
    const incidentKeywords = ["ransomware", "breach", "leak", "hacked", "stolen", "attack", "compromised", "malware", "cyber", "espionage", "security", "threat", "incident"];
    const noiseKeywords = ["patch", "update", "fix"];

    const filteredNews = allNews.flat()
      .filter(n => n.title !== "" && n.timestamp !== 0)
      .filter(n => 
        incidentKeywords.some(key => n.title.toLowerCase().includes(key)) && 
        !noiseKeywords.some(key => n.title.toLowerCase().includes(key))
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40);

    return NextResponse.json(filteredNews);
  } catch (error) {
    return NextResponse.json([]);
  }
}