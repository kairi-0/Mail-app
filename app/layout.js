import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "顧客メール モニター",
  description: "Gmail × Claude AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
