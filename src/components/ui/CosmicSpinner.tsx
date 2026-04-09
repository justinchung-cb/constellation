"use client";

export function CosmicSpinner({ message = "Entering the galaxy..." }: { message?: string }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a1a",
        zIndex: 100,
      }}
    >
      {/* Orbiting rings */}
      <div className="cosmic-spinner">
        <div className="cosmic-ring cosmic-ring-1" />
        <div className="cosmic-ring cosmic-ring-2" />
        <div className="cosmic-ring cosmic-ring-3" />
        <div className="cosmic-core" />
      </div>

      {/* Loading text */}
      <p
        style={{
          marginTop: 32,
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: "rgba(255, 255, 255, 0.5)",
          animation: "cosmic-text-pulse 2s ease-in-out infinite",
        }}
      >
        {message}
      </p>

      <style>{`
        .cosmic-spinner {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .cosmic-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          margin: -5px 0 0 -5px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow:
            0 0 12px 4px rgba(0, 255, 170, 0.5),
            0 0 30px 8px rgba(0, 82, 255, 0.25);
          animation: cosmic-core-pulse 1.5s ease-in-out infinite;
        }

        .cosmic-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid transparent;
        }

        .cosmic-ring-1 {
          border-top-color: rgba(0, 255, 170, 0.6);
          border-right-color: rgba(0, 255, 170, 0.15);
          animation: cosmic-spin 1.8s linear infinite;
          filter: drop-shadow(0 0 4px rgba(0, 255, 170, 0.4));
        }

        .cosmic-ring-2 {
          inset: 12px;
          border-top-color: rgba(0, 82, 255, 0.6);
          border-left-color: rgba(0, 82, 255, 0.15);
          animation: cosmic-spin 1.3s linear infinite reverse;
          filter: drop-shadow(0 0 4px rgba(0, 82, 255, 0.3));
        }

        .cosmic-ring-3 {
          inset: 24px;
          border-bottom-color: rgba(255, 255, 255, 0.4);
          border-right-color: rgba(255, 255, 255, 0.1);
          animation: cosmic-spin 2.2s linear infinite;
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.2));
        }

        @keyframes cosmic-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes cosmic-core-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        @keyframes cosmic-text-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
