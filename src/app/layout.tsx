import "./globals.css";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.youtube.com/iframe_api"
          strategy="lazyOnload"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
