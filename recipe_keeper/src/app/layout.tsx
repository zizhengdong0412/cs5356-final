import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe keeper",
  description: "Let's organize your favorite recipes with binders! ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* Site Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Recipe Keeper</h1>
          <a
            href="/auth/sign-in"
            className="text-blue-600 hover:text-blue-800 transition"
          >
            Sign In
          </a>
        </header>

        {/* Main content area */}
        <main className="p-4 max-w-4xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
