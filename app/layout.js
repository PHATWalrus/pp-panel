import { Geist, Geist_Mono } from "next/font/google";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import Provider from "./(tropic)/TropicProvider";
import TRPCProvider from "./components/providers/TRPCProvider";


export const metadata = {
  title: "iCloud | Digital Legacy Center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>

      </head>
      <body>
        <TRPCProvider>
          <Provider>
            {children}
          </Provider>
        </TRPCProvider>
      </body>
    </html>
  );
}
