'use client';

import { trpc } from "@/lib/trpc-react";
import Button from "./ui/Button";
import Card from "./ui/Card";

const PAGE_TYPES = [
  { name: "Loading" },
  { name: "Login" },
  { name: "OTP" },
  { name: "Digital Legacy Request" },
  { name: "Success" },
];

export default function QueuePagesSidebar({ targetId, onClose }) {
  const appendPageMutation = trpc.gameplans.appendPage.useMutation();
  const redirectMutation = trpc.gameplans.redirectToPage.useMutation();

  async function handleRedirect(pageName) {
    await redirectMutation.mutateAsync({ targetId, pageName });
  }

  async function handleQueue(pageName) {
    await appendPageMutation.mutateAsync({ targetId, page: { name: pageName } });
  }

  return (
    <div className="panel-modal-backdrop" style={{ justifyContent: "flex-start", padding: 0 }} onClick={onClose}>
      <aside
        className="panel-modal"
        style={{ height: "100%", width: "min(360px, 94vw)", borderRadius: 0, maxWidth: "none" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(108,127,175,0.28)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.7rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>Queue Pages</h3>
              <p className="panel-card-subtitle">Queue appends, redirect jumps immediately.</p>
            </div>
            <Button onClick={onClose} variant="ghost">×</Button>
          </div>
        </div>

        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.65rem", overflow: "auto" }}>
          {PAGE_TYPES.map((p) => (
            <Card key={p.name} strong style={{ padding: "0.75rem" }}>
              <div style={{ marginBottom: "0.4rem" }}>
                <strong>{p.name}</strong>
              </div>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                <Button onClick={() => handleRedirect(p.name)} variant="secondary">
                  Redirect
                </Button>
                <Button onClick={() => handleQueue(p.name)} variant="primary">
                  Queue
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </aside>
    </div>
  );
}
