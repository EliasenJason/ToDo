import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "To Do App",
  description: "Learning Web Sockets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
