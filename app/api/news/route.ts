import { NextResponse } from 'next/server';

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
        const res = await fetch(source.url, { 
          next: { revalidate: 300 } // 5分間キャッシュして効率化
        });
        const xml = await res.text();
        
        // <item>タグで分割
        const items = xml.split('<item>').slice(1);

        return items.map(item => {
          // 正規表現をより柔軟に（改行等に対応）
          const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1].trim() || "";
          const link = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1].trim() || "#";
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
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
        console.error(`Error fetching ${source.name}:`, e);
        return []; 
      }
    }));

    // フィルタリングを少し緩めてテスト
    const incidentKeywords = ["ransomware", "breach", "leak", "hacked", "stolen", "attack", "compromised", "malware", "cyber", "espionage", "security", "threat"];
    // ノイズ判定を一旦コメントアウトして、ニュースが出るか確認するのも手です
    const noiseKeywords = ["patch", "update"]; 

    const filteredNews = allNews.flat()
      .filter(n => n.title !== "" && n.timestamp !== 0) // 最低限のバリデーション
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