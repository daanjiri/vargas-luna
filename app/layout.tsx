import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Art Exhibit Documentation Flow",
  description: "Visualize art exhibit documentation as a directed graph",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="adblocker-handler" strategy="beforeInteractive">
          {`
            // Override MutationObserver to handle ad blocker errors
            (function() {
              const OriginalMutationObserver = window.MutationObserver;
              window.MutationObserver = function(...args) {
                const observer = new OriginalMutationObserver(...args);
                const originalObserve = observer.observe;
                
                observer.observe = function(target, options) {
                  try {
                    if (target && target.nodeType) {
                      return originalObserve.call(this, target, options);
                    }
                  } catch (error) {
                    console.warn('MutationObserver error caught:', error);
                  }
                };
                
                return observer;
              };
              window.MutationObserver.prototype = OriginalMutationObserver.prototype;
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="system">
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
