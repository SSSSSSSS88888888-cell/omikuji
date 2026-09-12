import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'でかぼ御籤',
  description: '風神雷神が運ぶ、デカボ行動のおみくじ体験',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
