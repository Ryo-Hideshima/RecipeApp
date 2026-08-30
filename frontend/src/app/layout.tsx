import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Recipe - レシピ共有アプリ",
  description: "レシピを投稿・検索・お気に入りできる学習用アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-4xl px-4 pb-20 pt-5">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
