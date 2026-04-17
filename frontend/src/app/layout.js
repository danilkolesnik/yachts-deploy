import { Geist, Geist_Mono } from "next/font/google";
import StoreProvider from "./StoreProvider";
import AuthProvider from "./AuthProvider";
import { ToastContainer, toast } from 'react-toastify';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "All Services Marine",
  description: "Yacht Service Management Program",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </StoreProvider>
        <ToastContainer 
          position="bottom-right"
          zIndex={10000}
          style={{
            zIndex: 10000,
            position: "bottom-right",
          }}
        />
      </body>
    </html>
  );
}
