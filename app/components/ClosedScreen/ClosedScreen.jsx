'use client';

export default function ClosedScreen() {
  return (
    <div className="closed-screen" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      padding: "2rem",
      textAlign: "center",
    }}>
      <h2 style={{ marginBottom: "1rem", color: "inherit" }}>
        We're currently closed
      </h2>
      <p style={{ color: "#888", maxWidth: 400 }}>
        New visitors are not being accepted at this time. Please try again later.
      </p>
    </div>
  );
}
