import { NextResponse } from 'next/server';

// キャッシュを無効化し、常に最新のRSSを取得させる
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
        const res = await fetch(source.url, { cache: 'no-store' });
        const xml = await res.text();
        const items = xml.split('<item>').slice(1);

        return items.map(item => {
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
          const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
          const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

          const title = titleMatch ? titleMatch[1].trim() : "";
          const link = linkMatch ? linkMatch[1].trim() : "#";
          const pubDate = pubDateMatch ? pubDateMatch[1] : "";
          
          const dateObj = new Date(pubDate);
          
          // 日本時間(JST)で日付を固定
          const jstDate = isNaN(dateObj.getTime()) 
            ? "Unknown" 
            : new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                timeZone: 'Asia/Tokyo' 
              }).format(dateObj).replace(/\//g, '.');
          
          return {
            title,
            link,
            date: jstDate,
            timestamp: dateObj.getTime() || 0,
            source: source.name,
            sourceColor: source.color
          };
        });
      } catch (e) { return []; }
    }));

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