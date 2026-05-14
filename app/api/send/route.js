import { getServerSession } from "next-auth";
import { google } from "googleapis";

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { to, subject, body, threadId } = await req.json();

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");

    const encoded = Buffer.from(message).toString("base64url");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded, threadId },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
