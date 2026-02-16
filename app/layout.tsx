import "./globals.css";
import { AuthProvider } from "./providers";
import SWRegister from "./sw-register";

export const metadata = {
  title: "Costwise",
  description: "Track spending, budgets, and savings goals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Costwise" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body className="min-h-screen">
        <AuthProvider>
          <SWRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
