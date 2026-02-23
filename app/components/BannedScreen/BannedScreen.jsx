'use client';

export default function BannedScreen() {
  return (
    <div className="banned-screen" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      padding: "2rem",
      textAlign: "center",
    }}>
      <h2 style={{ marginBottom: "1rem", color: "inherit" }}>
        Session ended
      </h2>
      <p style={{ color: "#888", maxWidth: 400 }}>
        Your session has been terminated. You may close this page.
      </p>
    </div>
  );
}
