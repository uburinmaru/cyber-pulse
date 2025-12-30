import { NextResponse } from 'next/server';

export const revalidate = 3600; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  // 信頼性の高いプロフェッショナルなソースを選定
  const SOURCES = [
    { name: "CISA_ALERTS", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml" }, // 米国政府サイバーセキュリティ庁
    { name: "FBI_IC3", url: "https://www.ic3.gov/rss/default.xml" }, // FBI サイバー犯罪センター
    { name: "UNIT42", url: "https://unit42.paloaltonetworks.com/feed/" }, // Palo Alto Networks (世界最強の調査チーム)
    { name: "MANDIANT", url: "https://www.mandiant.com/resources/blog/rss.xml" } // Google Cloud Mandiant (国家レベルの攻撃分析)
  ];

  try {
    const allNews = await Promise.all(SOURCES.map(async (source) => {
      try {
        const res = await fetch(source.url, { next: { revalidate: 3600 } });
        const xml = await res.text();
        const items = xml.split('<item>').slice(1, 8);
        return items.map(item => {
          const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
          return titleMatch ? titleMatch[1].trim() : "";
        });
      } catch { return []; }
    }));

    const titlesForAi = allNews.flat().filter(t => t !== "").join('\n');
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ summary: "API Key Configuration Missing." });
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `あなたは世界トップクラスのサイバーセキュリティ・アナリストです。
以下のニュースソース（CISA、FBI、UNIT42等）から最重要の技術的インシデントを1つ抽出し、専門家向けに報告してください。

【出力ルール：絶対遵守】
・挨拶（経営層各位、承知しました等）は一切禁止。
・マークダウン記号（#や*）は一切禁止。
・句読点や改行を適切に使い、以下の2項目のみを出力してください。

🚨 脅威の特定と技術的背景
（対象組織、CVE番号、攻撃手法（TTPs）を300字程度で詳細かつ具体的に記述）

🛡️ 推奨される即時アクション
（パッチ、IoC、構成変更など、現場が取るべき具体的な技術対策）

ニュースソース：
${titlesForAi}` }] }]
      })
    });

    const geminiData = await geminiRes.json();
    const aiSummary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Intelligence Pending...";

    return NextResponse.json({ summary: aiSummary.trim() });
  } catch {
    return NextResponse.json({ summary: "Failed to connect to primary intelligence sources." });
  }
}