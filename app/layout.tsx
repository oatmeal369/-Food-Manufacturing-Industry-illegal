import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "식품제조가공업 행정처분 검색",
  description: "식품제조가공업 행정처분 사례를 식품유형과 처분종류로 검색합니다."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
