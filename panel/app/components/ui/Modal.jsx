'use client';

import Button from "./Button";

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 680,
}) {
  return (
    <div className="panel-modal-backdrop" onClick={onClose}>
      <div
        className="panel-modal"
        style={{ maxWidth }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid rgba(108,127,175,0.28)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h3 className="panel-card-title" style={{ marginBottom: 0 }}>
                {title}
              </h3>
              {subtitle ? <p className="panel-card-subtitle">{subtitle}</p> : null}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close modal">
              ×
            </Button>
          </div>
        </div>
        <div style={{ padding: "1rem 1.1rem" }}>{children}</div>
        {footer ? (
          <div
            style={{
              padding: "0.9rem 1.1rem 1.1rem",
              borderTop: "1px solid rgba(108,127,175,0.22)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.55rem",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
