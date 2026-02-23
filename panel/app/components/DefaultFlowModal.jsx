'use client';

import { useEffect, useMemo, useState } from "react";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import SortablePageList from "./flow/SortablePageList";

const DEFAULT_PAGE_TYPES = [
  "Loading",
  "Login",
  "OTP",
  "Digital Legacy Request",
  "Success",
];

export default function DefaultFlowModal({
  initialPages,
  onClose,
  onSave,
  isSaving,
}) {
  const [pages, setPages] = useState([]);
  const [pageToAdd, setPageToAdd] = useState(DEFAULT_PAGE_TYPES[0]);

  function createPageItem(name) {
    return {
      id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(name || ""),
    };
  }

  useEffect(() => {
    const next = Array.isArray(initialPages) && initialPages.length > 0
      ? initialPages
      : DEFAULT_PAGE_TYPES.map((name) => ({ name }));
    setPages(next.map((page) => createPageItem(page?.name)));
  }, [initialPages]);

  const filteredPageChoices = useMemo(() => {
    const used = new Set(pages.map((page) => page.name));
    return DEFAULT_PAGE_TYPES.filter((name) => !used.has(name));
  }, [pages]);

  useEffect(() => {
    if (filteredPageChoices.length > 0 && !filteredPageChoices.includes(pageToAdd)) {
      setPageToAdd(filteredPageChoices[0]);
    }
  }, [filteredPageChoices, pageToAdd]);

  function removePage(index) {
    if (pages.length <= 1) {
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  function addPage() {
    if (!pageToAdd) {
      return;
    }
    setPages((prev) => [...prev, createPageItem(pageToAdd)]);
  }

  async function saveFlow() {
    const cleaned = pages
      .map((page) => ({ name: String(page?.name || "").trim() }))
      .filter((page) => page.name.length > 0);
    if (cleaned.length === 0) {
      return;
    }
    await onSave(cleaned);
  }

  return (
    <Modal
      title="Edit Default Flow"
      subtitle="Configure the default queue for newly accepted visitors."
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveFlow} disabled={isSaving || pages.length === 0}>
            {isSaving ? "Saving..." : "Save flow"}
          </Button>
        </>
      )}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <SortablePageList
          items={pages}
          getItemId={(page) => page.id}
          onReorder={({ nextItems }) => setPages(nextItems)}
          renderItem={({ item: page, index, dragHandleProps }) => (
            <div
              className="panel-card"
              style={{
                padding: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <Button
                  variant="ghost"
                  className="panel-drag-handle"
                  aria-label={`Drag step ${index + 1}`}
                  title="Drag to reorder"
                  {...dragHandleProps}
                >
                  ::
                </Button>
                <div>
                  <div style={{ fontSize: "0.75rem" }} className="panel-soft">
                    Step {index + 1}
                  </div>
                  <strong>{page.name || "Unnamed"}</strong>
                </div>
              </div>
              <Button variant="danger" onClick={() => removePage(index)} disabled={pages.length <= 1}>
                Remove
              </Button>
            </div>
          )}
        />

        <div className="panel-card" style={{ padding: "0.8rem" }}>
          <label className="panel-field-label" htmlFor="new-default-page">
            Add page to flow
          </label>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
            <select
              id="new-default-page"
              className="panel-input"
              value={pageToAdd}
              onChange={(event) => setPageToAdd(event.target.value)}
              disabled={filteredPageChoices.length === 0}
              style={{ flex: 1, minWidth: 180 }}
            >
              {filteredPageChoices.length === 0 ? (
                <option value="">All default pages are already included</option>
              ) : (
                filteredPageChoices.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
            <Button
              variant="secondary"
              onClick={addPage}
              disabled={filteredPageChoices.length === 0 || !pageToAdd}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
