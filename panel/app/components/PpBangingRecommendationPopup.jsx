'use client';

import Button from "./ui/Button";
import Modal from "./ui/Modal";

export default function PpBangingRecommendationPopup({ onDismiss }) {
  return (
    <Modal
      title="pp banging panel recommendation"
      subtitle="Intake hardening advice"
      onClose={onDismiss}
      maxWidth={460}
      footer={(
        <Button onClick={onDismiss} variant="primary">
          Got It
        </Button>
      )}
    >
      <p style={{ margin: 0 }}>
        pp banging panel recommends turning <strong>Allow new visitors</strong> off to help prevent redpaging.
        This does not affect the current visitor, only future arrivals.
      </p>
    </Modal>
  );
}
