"use client";

import { useEffect, useState } from "react";

/**
 * PWA installer — shows an "Install Marqai" banner when the browser
 * fires `beforeinstallprompt` (Chrome/Edge/Samsung). On iOS Safari,
 * shows a tooltip telling the user to tap Share → Add to Home Screen.
 */
export function PwaInstaller() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect iOS Safari (no beforeinstallprompt event there).
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in document);
    setIsIos(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as any);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Show iOS tip once per session if not previously dismissed.
    if (ios && !sessionStorage.getItem("marqai-ios-tip-dismissed")) {
      const t = setTimeout(() => setShowIosTip(true), 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === "accepted") {
      setPromptEvent(null);
    }
  }

  // Register the service worker on first mount (client-only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failure is non-fatal — app still works online.
    });
  }, []);

  if (dismissed) return null;

  // iOS tip
  if (isIos && showIosTip) {
    return (
      <div
        role="dialog"
        aria-label="Install Marqai on iOS"
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: "0 auto",
          background: "#0f766e",
          color: "#fff",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)",
          zIndex: 9999,
          fontSize: 14,
          fontFamily: "inherit",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>⭐</span> Install Marqai
        </div>
        <div style={{ marginBottom: 10, lineHeight: 1.4 }}>
          Tap the <strong>Share</strong> button in Safari, then{" "}
          <strong>Add to Home Screen</strong> to install Marqai as an app.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setShowIosTip(false);
              sessionStorage.setItem("marqai-ios-tip-dismissed", "1");
            }}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // Chrome/Edge/Samsung install prompt
  if (promptEvent) {
    return (
      <div
        role="dialog"
        aria-label="Install Marqai app"
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: "0 auto",
          background: "#fff",
          color: "#0f172a",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)",
          zIndex: 9999,
          fontSize: 14,
          fontFamily: "inherit",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "#0d9488" }}>⬇</span> Install Marqai app
        </div>
        <div style={{ marginBottom: 10, color: "#475569", lineHeight: 1.4 }}>
          Install Marqai on your device for quick access — works offline, opens in its own window.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: "transparent",
              border: "1px solid #e2e8f0",
              color: "#475569",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            style={{
              background: "#0d9488",
              border: "none",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
}
