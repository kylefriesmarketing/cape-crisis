import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-static';
export const metadata: Metadata = {icons:{icon:'favicon.svg'},title:'CAPE // CRISIS - A Superhero Arcade Shooter',description:'Three heroes. Six chapters. One very bad alien invasion. An original twin-stick survival shooter with local co-op and a reactive soundtrack.'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="en" className="dark"><body>{children}</body></html>;}