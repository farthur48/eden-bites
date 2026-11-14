"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fcfcf9",
          color: "#141414",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: "30rem",
            textAlign: "center",
            border: "1px solid #e6e4d8",
            borderRadius: "1.5rem",
            backgroundColor: "#FFFFFF",
            padding: "2.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#174B20",
              opacity: 0.7,
            }}
          >
            Eden Bites
          </p>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.9rem", lineHeight: 1.15, color: "#0e3215" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "1rem", fontSize: "0.95rem", lineHeight: 1.7, color: "#5f6b60" }}>
            The application encountered an unexpected error. Please try again.
          </p>
          {error.digest ? (
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#5f6b60" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              height: "3rem",
              padding: "0 1.75rem",
              border: "none",
              borderRadius: "0.75rem",
              backgroundColor: "#b5f522",
              color: "#141414",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
