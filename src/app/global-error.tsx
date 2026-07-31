"use client";

/**
 * Last-resort boundary: catches errors thrown by the root layout
 * itself, where `error.tsx` cannot help because it renders inside that
 * same layout. Must render its own <html>/<body> and stays deliberately
 * minimal — if the root layout is broken, this should not depend on
 * anything that could also be broken.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
            Formetrix hit an unexpected error.
          </h2>
          <p style={{ maxWidth: "28rem", color: "#6b7280" }}>
            Please try again. If this keeps happening, reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #e5e5e5",
              background: "transparent",
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
