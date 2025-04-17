import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Genre Classifier",
  description: "Upload a music file to classify its genre using AI technology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <header className="bg-gray-900 text-white p-4 shadow-md border-b border-blue-500/30">
          <nav className="container mx-auto flex items-center justify-between">
            <div className="text-xl font-bold flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                <span className="font-bold">♫</span>
              </div>
              <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                Music Classifier
              </Link>
            </div>
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/music-classifier"
                  className="hover:text-blue-400 transition-colors"
                >
                  Music Classifier
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        {children}
        <footer className="bg-gray-900 text-white py-4 text-center text-sm border-t border-blue-500/30">
          <div className="container mx-auto">
            <p className="mb-2">Music Genre Classification powered by AI</p>
            <p className="text-gray-400">Copyright © {new Date().getFullYear()} Music Classifier. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
