import { NextResponse } from 'next/server';

export async function GET() {
  const SOURCES = [
    { name: "THE_HACKER_NEWS", url: "https://feeds.feedburner.com/TheHackersNews", color: "#1d4ed8" }, // Blue
    { name: "BLEEPING_COMPUTER", url: "https://www.bleepingcomputer.com/feed/", color: "#000000" }, // Black
    { name: "CISA_INTEL", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", color: "#b91c1c" }, // Red
    { name: "FBI_IC3", url: "https://www.ic3.gov/rss/default.xml", color: "#1e3a8a" } // Navy
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, { cache: 'no-store' });
        const xml = await res.text();
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        return items.map(item => {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
          const link = item.match(/<link>(.*?)<\/link>/)?.[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "#";
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
          const dateObj = new Date(pubDate);
          
          return {
            title,
            link,
            date: dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.'),
            timestamp: dateObj.getTime(),
            source: source.name,
            sourceColor: source.color
          };
        });
      } catch (e) { return []; }
    }));

    // インシデントに特化した厳格なフィルタリング
    const incidentKeywords = ["ransomware", "breach", "leak", "hacked", "stolen", "attack", "compromised", "malware", "cyber", "espionage"];
    const noiseKeywords = ["patch", "fix", "update", "mitigate", "discovery", "vulnerability"];

    const filteredNews = allNews.flat()
      .filter(n => 
        incidentKeywords.some(key => n.title.toLowerCase().includes(key)) && 
        !noiseKeywords.some(key => n.title.toLowerCase().includes(key))
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 40); // ソースが増えたので40件に増量

    return NextResponse.json(filteredNews);
  } catch (error) {
    return NextResponse.json([]);
  }
}