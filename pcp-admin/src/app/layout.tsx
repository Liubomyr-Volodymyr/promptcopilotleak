import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'GoP Copilot Admin Panel',
  description: 'Dashboard for managing',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
