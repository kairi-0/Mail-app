import { getServerSession } from "next-auth";
import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { keywords, days } = await req.json();

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    const from = new Date();
    from.setDate(from.getDate() - days);
    const dateStr = Math.floor(from.getTime() / 1000);
    const query = `after:${dateStr} in:inbox`;

    const listRes = await gmail.users.messages.list({
      userId: "me", q: query, maxResults: 20,
    });

    const messages = listRes.data.messages ?? [];
    const results = [];

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({ userId: "me", id: msg.id });
      const headers = detail.data.payload?.headers ?? [];
      const subject = headers.find(h => h.name === "Subject")?.value ?? "";
      const from2 = headers.find(h => h.name === "From")?.value ?? "";
      const date = headers.find(h => h.name === "Date")?.value ?? "";
      const snippet = detail.data.snippet ?? "";

      const text = `${subject} ${snippet}`;
      const matched = keywords.some(kw => text.includes(kw));
      if (!matched) continue;

      const aiRes = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `ビジネスメールのアシスタントです。以下のJSON形式のみで返してください：
{"summary":"3行以内の要約","action":"要返信|確認のみ|不要","priority":"高|中|低","reply":"返信案（要返信の場合のみ）"}`,
        messages: [{ role: "user", content: `件名: ${subject}\n差出人: ${from2}\n本文抜粋: ${snippet}` }],
      });

      let parsed = { summary: snippet, action: "確認のみ", priority: "中", reply: "" };
      try {
        const txt = aiRes.content[0].text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(txt);
      } catch (_) {}

      results.push({ id: msg.id, subject, from: from2, date, snippet, ...parsed });
    }

    return Response.json({ results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
