import "./globals.css";
import { AuthProvider } from "./providers";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
