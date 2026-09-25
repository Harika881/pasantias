// FILE: apps/web/app/layout.tsx
import "../styles/globals.css";
import Link from "next/link";

export const metadata = { title: "AI YouTube Studio", description: "AI-powered YouTube video production" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b bg-white px-6 py-3 flex gap-6 items-center">
          <Link href="/" className="font-bold text-lg">AI YouTube Studio</Link>
          <Link href="/create">Create Video</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/settings/providers">Provider Settings</Link>
          <Link href="/settings/youtube">YouTube</Link>
          <Link href="/settings/usage">Usage</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}