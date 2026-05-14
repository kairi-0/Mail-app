import Providers from "./providers";

export const metadata = {
  title: "顧客メール モニター",
  description: "Gmail × Claude AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
