import { useState } from "react";
import { useServicePricing } from "../../../context/PricingContext.jsx";
import styles from "../Admin.module.css";
import LineItemEditor from "./LineItemEditor.jsx";
import AddLineItemModal from "./AddLineItemModal.jsx";
import AddOptionModal from "./AddOptionModal.jsx";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";
import { safeNumber } from "../../../lib/format.js";

function DigitalMarketingEditor({ service, onPatchService, onConfirmDelete }) {
  const d = service?.detail || {};
  const fixedPlans = d.fixedPlans ?? [];
  const alaCarte = d.alaCarte ?? [];
  const pageHandling = d.pageHandling ?? null;

  return (
    <div className={styles.pricingBlock}>
      <div className={styles.pricingRow}>
        <h4 className={styles.pricingH4}>Fixed Plans</h4>
      </div>
      <div className={styles.pricingGrid2}>
        {fixedPlans.map((p) => (
          <div key={p.id} className={styles.pricingMiniCard}>
            <div className={styles.row}>
              <input
                className={styles.input}
                value={p.name}
                onChange={(e) =>
                  onPatchService((svc) => ({
                    ...svc,
                    detail: {
                      ...svc.detail,
                      fixedPlans: (svc.detail.fixedPlans ?? []).map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)),
                    },
                  }))
                }
              />
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={() => onConfirmDelete({ type: "fixedPlan", id: p.id, name: p.name })}
              >
                Delete
              </button>
            </div>
            <div className={styles.inlineField}>
              <span className={styles.muted} style={{ alignSelf: "center" }}>
                Price
              </span>
              <input
                className={styles.input}
                inputMode="numeric"
                value={p.price}
                onChange={(e) =>
                  onPatchService((svc) => ({
                    ...svc,
                    detail: {
                      ...svc.detail,
                      fixedPlans: (svc.detail.fixedPlans ?? []).map((x) =>
                        x.id === p.id ? { ...x, price: safeNumber(e.target.value) } : x,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.buttonGhost}
        onClick={() =>
          onPatchService((svc) => ({
            ...svc,
            detail: {
              ...svc.detail,
              fixedPlans: [...(svc.detail.fixedPlans ?? []), { id: `plan-${Date.now()}`, name: "New Plan", price: 0, withContent: true, includes: [] }],
            },
          }), true)
        }
      >
        + Add Plan
      </button>

      <div className={styles.pricingDivider} />

      <div className={styles.pricingRow}>
        <h4 className={styles.pricingH4}>A-la-carte</h4>
      </div>
      <div className={styles.pricingGrid2}>
        {alaCarte.map((a) => (
          <div key={a.id} className={styles.pricingMiniCard}>
            <div className={styles.row}>
              <input
                className={styles.input}
                value={a.name}
                onChange={(e) =>
                  onPatchService((svc) => ({
                    ...svc,
                    detail: {
                      ...svc.detail,
                      alaCarte: (svc.detail.alaCarte ?? []).map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)),
                    },
                  }))
                }
              />
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={() => onConfirmDelete({ type: "alaCarte", id: a.id, name: a.name })}
              >
                Delete
              </button>
            </div>
            <div className={styles.pricingGrid3}>
              <div>
                <p className={styles.muted}>With content</p>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={a.withContent}
                  onChange={(e) =>
                    onPatchService((svc) => ({
                      ...svc,
                      detail: {
                        ...svc.detail,
                        alaCarte: (svc.detail.alaCarte ?? []).map((x) =>
                          x.id === a.id ? { ...x, withContent: safeNumber(e.target.value) } : x,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div>
                <p className={styles.muted}>Without content</p>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={a.withoutContent}
                  onChange={(e) =>
                    onPatchService((svc) => ({
                      ...svc,
                      detail: {
                        ...svc.detail,
                        alaCarte: (svc.detail.alaCarte ?? []).map((x) =>
                          x.id === a.id ? { ...x, withoutContent: safeNumber(e.target.value) } : x,
                        ),
                      },
                    }))
                  }
                />
              </div>
              <div style={{ display: "flex", alignItems: "end" }}>
                <span className={styles.muted}>₹</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.buttonGhost}
        onClick={() =>
          onPatchService((svc) => ({
            ...svc,
            detail: {
              ...svc.detail,
              alaCarte: [...(svc.detail.alaCarte ?? []), { id: `ala-${Date.now()}`, name: "New Item", withContent: 0, withoutContent: 0 }],
            },
          }), true)
        }
      >
        + Add A-la-carte item
      </button>

      <div className={styles.pricingDivider} />

      <div className={styles.pricingGrid2}>
        <div className={styles.pricingMiniCard}>
          <h4 className={styles.pricingH4}>Meta Ad Unit Price</h4>
          <input
            className={styles.input}
            inputMode="numeric"
            value={d.metaAdUnitPrice ?? 0}
            onChange={(e) =>
              onPatchService((svc) => ({
                ...svc,
                detail: { ...svc.detail, metaAdUnitPrice: safeNumber(e.target.value) },
              }))
            }
          />
          <p className={styles.muted}>{d.metaAdUnitLabel ?? "Meta ad setup (per ad)"}</p>
        </div>

        <div className={styles.pricingMiniCard}>
          <h4 className={styles.pricingH4}>Page Handling</h4>
          <input
            className={styles.input}
            value={pageHandling?.name ?? "Page handling (overall)"}
            onChange={(e) =>
              onPatchService((svc) => ({
                ...svc,
                detail: {
                  ...svc.detail,
                  pageHandling: { ...(svc.detail.pageHandling ?? { id: "page" }), name: e.target.value, price: svc.detail.pageHandling?.price ?? 0, description: svc.detail.pageHandling?.description ?? "" },
                },
              }))
            }
          />
          <input
            className={styles.input}
            inputMode="numeric"
            value={pageHandling?.price ?? 0}
            onChange={(e) =>
              onPatchService((svc) => ({
                ...svc,
                detail: {
                  ...svc.detail,
                  pageHandling: { ...(svc.detail.pageHandling ?? { id: "page" }), name: svc.detail.pageHandling?.name ?? "Page handling (overall)", price: safeNumber(e.target.value), description: svc.detail.pageHandling?.description ?? "" },
                },
              }))
            }
          />
          <textarea
            className={styles.textarea}
            value={pageHandling?.description ?? ""}
            onChange={(e) =>
              onPatchService((svc) => ({
                ...svc,
                detail: {
                  ...svc.detail,
                  pageHandling: { ...(svc.detail.pageHandling ?? { id: "page" }), name: svc.detail.pageHandling?.name ?? "Page handling (overall)", price: svc.detail.pageHandling?.price ?? 0, description: e.target.value },
                },
              }))
            }
            placeholder="Description"
          />
        </div>
      </div>
    </div>
  );
}

export default function ServiceEditorForm({ service, setServices, onDeleted, digitalOnly = false }) {
  const { saveService } = useServicePricing();
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [addOptForLine, setAddOptForLine] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }

  if (!service) return null;

  const isDigital = service?.detail?.type === "digital_marketing";
  const lineItems = service?.detail?.lineItems ?? [];

  // Update local state, and if immediateSave is true, also push to API
  const patchThisService = async (updater, immediateSave = false) => {
    // Compute the updated service so we can send it to the API immediately
    const nextService = typeof updater === "function" ? updater(service) : { ...service, ...updater };
    
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === service.id) {
          // Always apply updater to the latest state for absolute safety
          return typeof updater === "function" ? updater(s) : { ...s, ...updater };
        }
        return s;
      })
    );
    if (immediateSave) {
      await saveService(service.id, nextService);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "service") {
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      onDeleted?.();
      // Service delete logic handles its own state (often managed via API separately)
    } else if (deleteTarget.type === "lineItem") {
      await patchThisService((svc) => ({
        ...svc,
        detail: { ...svc.detail, lineItems: (svc.detail?.lineItems ?? []).filter((x) => x.id !== deleteTarget.id) },
      }), true);
    } else if (deleteTarget.type === "fixedPlan") {
      await patchThisService((svc) => ({
        ...svc,
        detail: { ...svc.detail, fixedPlans: (svc.detail.fixedPlans ?? []).filter((x) => x.id !== deleteTarget.id) },
      }), true);
    } else if (deleteTarget.type === "alaCarte") {
      await patchThisService((svc) => ({
        ...svc,
        detail: { ...svc.detail, alaCarte: (svc.detail.alaCarte ?? []).filter((x) => x.id !== deleteTarget.id) },
      }), true);
    }
    setDeleteTarget(null);
  };

  if (digitalOnly && isDigital) {
    return (
      <>
        <DigitalMarketingEditor service={service} onPatchService={patchThisService} onConfirmDelete={setDeleteTarget} />
        <ConfirmDeleteModal
          open={!!deleteTarget}
          title="Delete Item"
          message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
          onConfirm={executeDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </>
    );
  }



  return (
    <>
      <div className={styles.modalEditorActions}>
        <button type="button" className={styles.buttonSecondary} onClick={() => saveService(service.id, service)}>
          Save section
        </button>
        <button type="button" className={styles.buttonDanger} onClick={() => setDeleteTarget({ type: "service", id: service.id, name: service.name })}>
          Delete service
        </button>
      </div>

      <div className={styles.pricingDivider} />

      <div className={styles.pricingRow}>
        <div className={styles.pricingGrid2}>
          <div>
            <p className={styles.muted}>Service name</p>
            <input className={styles.input} value={service.name} onChange={(e) => patchThisService({ name: e.target.value })} />
          </div>
          <div>
            <p className={styles.muted}>Tagline</p>
            <input className={styles.input} value={service.tagline ?? ""} onChange={(e) => patchThisService({ tagline: e.target.value })} />
          </div>
        </div>
      </div>

      {isDigital ? (
        <DigitalMarketingEditor service={service} onPatchService={patchThisService} onConfirmDelete={setDeleteTarget} />
      ) : (
        <div className={styles.pricingBlock}>
          {lineItems.map((line) => (
            <LineItemEditor
              key={line.id}
              line={line}
              onChange={(nextLine) =>
                patchThisService((svc) => ({
                  ...svc,
                  detail: {
                    ...svc.detail,
                    lineItems: (svc.detail?.lineItems ?? []).map((x) => (x.id === line.id ? nextLine : x)),
                  },
                }))
              }
              onDelete={() => setDeleteTarget({ type: "lineItem", id: line.id, name: line.name })}
              onAddOption={() => setAddOptForLine(line)}
            />
          ))}

          <button type="button" className={styles.buttonGhost} onClick={() => setAddLineOpen(true)}>
            + Add Line Item
          </button>
        </div>
      )}

      <AddLineItemModal
        open={addLineOpen}
        onClose={() => setAddLineOpen(false)}
        onSubmit={(line) => {
          patchThisService((svc) => ({
            ...svc,
            detail: {
              ...svc.detail,
              lineItems: [...(svc.detail?.lineItems ?? []), { ...line, id: `line-${Date.now()}` }],
            },
          }), true);
        }}
      />

      <AddOptionModal
        open={!!addOptForLine}
        onClose={() => setAddOptForLine(null)}
        onSubmit={(opt) => {
          const line = addOptForLine;
          if (!line) return;
          patchThisService((svc) => ({
            ...svc,
            detail: {
              ...svc.detail,
              lineItems: (svc.detail?.lineItems ?? []).map((x) =>
                x.id === line.id ? { ...x, options: [...(x.options ?? []), { ...opt, id: `opt-${Date.now()}` }] } : x,
              ),
            },
          }), true);
        }}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete Item"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
