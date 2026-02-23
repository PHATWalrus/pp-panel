import "./globals.css";
import TRPCProvider from "./providers/TRPCProvider";

export const metadata = {
  title: "pp banging panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          <div className="panel-shell">
            <header className="panel-header">
              <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="panel-chip panel-chip--success">Connected</span>
                pp banging panel
              </h1>
              <nav>
                <a href="/home">Panel</a>
                <a href="/home">Account</a>
              </nav>
            </header>
            <main className="panel-main">{children}</main>
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}
