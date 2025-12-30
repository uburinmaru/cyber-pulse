import { NextResponse } from 'next/server';

export const revalidate = 3600; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  // 読み込みやすく、かつ専門性の高いソースに厳選
  const SOURCES = [
    { name: "THE_HACKER_NEWS", url: "https://feeds.feedburner.com/TheHackersNews" },
    { name: "DARK_READING", url: "https://www.darkreading.com/rss.xml" },
    { name: "SECURITY_WEEK", url: "https://services.radio-canada.ca/rss/v1/news" }, // 代替案として読み取りやすい大手
    { name: "CYBER_SCOOP", url: "https://cyberscoop.com/feed/" }
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        // タイムアウトを設定してフリーズを防止
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(source.url, { 
          next: { revalidate: 3600 },
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        const xml = await res.text();
        const items = xml.split('<item>').slice(1, 6);
        return items.map(item => {
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
          return titleMatch ? titleMatch[1].trim() : "";
        });
      } catch { return []; }
    }));

    const titlesForAi = allNews.flat().filter(t => t !== "").join('\n');
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ summary: "APIキーが設定されていません。" });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたはサイバーセキュリティのスペシャリストです。
以下の最新ニュースから、最も技術的に重要なインシデントを1つ抽出し、プロ向けに分析してください。

【出力ルール：絶対遵守】
・挨拶（経営層各位、承知しました等）は一切禁止。
・マークダウン記号（#や*）は一切禁止。
・以下の2項目のみを出力してください。

🚨 脅威の特定と技術的背景
（対象、攻撃手法、CVE番号などを300字程度で詳細に）

🛡️ 推奨される即時アクション
（技術的な対策案）

ニュース：
${titlesForAi}` }] }]
      })
    });

    const geminiData = await geminiRes.json();
    const aiSummary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "ニュースを分析中...";

    return NextResponse.json({ summary: aiSummary.trim() });
  } catch {
    return NextResponse.json({ summary: "インテリジェンスの取得に失敗しました。" });
  }
}