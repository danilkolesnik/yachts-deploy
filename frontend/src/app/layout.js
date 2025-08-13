import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "./AuthProvider";
import StoreProvider from "./StoreProvider";
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
    icon: "../../public/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head> */}
        <StoreProvider>
          <AuthProvider>
            <ToastContainer />
            {children}
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
