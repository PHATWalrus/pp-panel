'use client';

export default function WaitingScreen() {
  return (
    <div className="waiting-screen" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      padding: "2rem",
      textAlign: "center",
    }}>
      <h2 style={{ marginBottom: "1rem", color: "inherit" }}>
        A support agent will be with you shortly...
      </h2>
      <p style={{ color: "#888", maxWidth: 400 }}>
        Please wait while we connect you with a representative.
      </p>
    </div>
  );
}
