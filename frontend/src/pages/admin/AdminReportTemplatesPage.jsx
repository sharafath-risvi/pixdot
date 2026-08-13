import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClipboardList, FaPlus, FaTrash, FaPen, FaListUl } from "react-icons/fa6";
import api from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import styles from "../../components/admin/Admin.module.css";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "combobox", label: "Combobox (type or choose)" },
  { value: "dropdown", label: "Dropdown (type or choose)" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "number", label: "Number" },
  { value: "client", label: "Client picker" },
  { value: "status", label: "Status" },
];

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className={styles.cardTitle} style={{ marginTop: 0 }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export default function AdminReportTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");

  const [templateModal, setTemplateModal] = useState(null); // { mode, template? }
  const [fieldModal, setFieldModal] = useState(null); // { mode, field? }
  const [optionsModal, setOptionsModal] = useState(null); // field
  const [optionEdit, setOptionEdit] = useState(null); // { mode, option? }

  const [confirm, setConfirm] = useState(null);

  const [tplForm, setTplForm] = useState({ name: "", description: "", roles: [] });
  const [fieldForm, setFieldForm] = useState({
    label: "",
    fieldType: "combobox",
    required: false,
  });
  const [optionForm, setOptionForm] = useState({ label: "", value: "" });

  const selected = useMemo(
    () => templates.find((t) => String(t.id || t._id) === String(selectedId)) || null,
    [templates, selectedId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, roleRes] = await Promise.all([
        api.get("/api/report-templates"),
        api.get("/api/report-templates/roles"),
      ]);
      const list = tplRes.data?.data || [];
      setTemplates(list);
      setRoles(roleRes.data?.data || []);
      setSelectedId((prev) => {
        if (prev && list.some((t) => String(t.id || t._id) === String(prev))) return prev;
        return list[0] ? String(list[0].id || list[0]._id) : "";
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load report templates.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateTemplate = () => {
    setTplForm({ name: "", description: "", roles: [] });
    setTemplateModal({ mode: "create" });
  };

  const openEditTemplate = () => {
    if (!selected) return;
    setTplForm({
      name: selected.name || "",
      description: selected.description || "",
      roles: [...(selected.roles || [])],
    });
    setTemplateModal({ mode: "edit", template: selected });
  };

  const saveTemplate = async () => {
    if (!tplForm.name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    try {
      if (templateModal?.mode === "edit" && selected) {
        await api.put(`/api/report-templates/${selected.id || selected._id}`, tplForm);
        toast.success("Template updated.");
      } else {
        const res = await api.post("/api/report-templates", { ...tplForm, seedDefaults: true });
        toast.success("Template created.");
        const id = res.data?.data?.id || res.data?.data?._id;
        if (id) setSelectedId(String(id));
      }
      setTemplateModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save template.");
    }
  };

  const deleteTemplate = async () => {
    if (!selected) return;
    try {
      await api.delete(`/api/report-templates/${selected.id || selected._id}`);
      toast.success("Template deleted.");
      setConfirm(null);
      setSelectedId("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete template.");
    }
  };

  const openAddField = () => {
    setFieldForm({ label: "", fieldType: "combobox", required: false });
    setFieldModal({ mode: "create" });
  };

  const openEditField = (field) => {
    setFieldForm({
      label: field.label || "",
      fieldType: field.fieldType || "text",
      required: Boolean(field.required),
    });
    setFieldModal({ mode: "edit", field });
  };

  const saveField = async () => {
    if (!selected || !fieldForm.label.trim()) {
      toast.error("Field label is required.");
      return;
    }
    try {
      if (fieldModal?.mode === "edit" && fieldModal.field) {
        await api.put(`/api/report-templates/fields/${fieldModal.field.id || fieldModal.field._id}`, {
          label: fieldForm.label.trim(),
          fieldType: fieldForm.fieldType,
          required: fieldForm.required,
        });
        toast.success("Field updated.");
      } else {
        await api.post(`/api/report-templates/${selected.id || selected._id}/fields`, {
          label: fieldForm.label.trim(),
          fieldType: fieldForm.fieldType,
          required: fieldForm.required,
        });
        toast.success("Field added.");
      }
      setFieldModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save field.");
    }
  };

  const deleteField = async (field) => {
    try {
      await api.delete(`/api/report-templates/fields/${field.id || field._id}`);
      toast.success("Field deleted.");
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete field.");
    }
  };

  const openOptions = (field) => {
    setOptionsModal(field);
    setOptionEdit(null);
  };

  // Keep options modal in sync after reload
  const optionsField = useMemo(() => {
    if (!optionsModal || !selected) return null;
    const id = String(optionsModal.id || optionsModal._id);
    return (selected.fields || []).find((f) => String(f.id || f._id) === id) || null;
  }, [optionsModal, selected]);

  const saveOption = async () => {
    const field = optionsField;
    if (!field || !optionForm.label.trim()) {
      toast.error("Option name is required.");
      return;
    }
    try {
      if (optionEdit?.mode === "edit" && optionEdit.option) {
        await api.put(`/api/report-templates/options/${optionEdit.option.id || optionEdit.option._id}`, {
          label: optionForm.label.trim(),
          value: optionForm.value.trim() || optionForm.label.trim(),
        });
        toast.success("Option updated.");
      } else {
        await api.post(`/api/report-templates/fields/${field.id || field._id}/options`, {
          label: optionForm.label.trim(),
          value: optionForm.value.trim() || optionForm.label.trim(),
        });
        toast.success("Option added.");
      }
      setOptionEdit(null);
      setOptionForm({ label: "", value: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save option.");
    }
  };

  const deleteOption = async (option) => {
    try {
      await api.delete(`/api/report-templates/options/${option.id || option._id}`);
      toast.success("Option deleted.");
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete option.");
    }
  };

  const toggleRole = (role) => {
    setTplForm((prev) => {
      const set = new Set(prev.roles);
      if (set.has(role)) set.delete(role);
      else set.add(role);
      return { ...prev, roles: [...set] };
    });
  };

  return (
    <section className={styles.adminPageSection}>
      <header className={styles.clientsPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Report Templates</h2>
          <p className={styles.pageHeadingSub}>
            Manage Daily Report headings and dropdown options per staff role. Staff can still type custom
            values; only Admin can add permanent options.
          </p>
        </div>
        <button type="button" className={styles.buttonPrimary} onClick={openCreateTemplate}>
          <FaPlus style={{ marginRight: 8 }} />
          Create Template
        </button>
      </header>

      {loading ? (
        <p className={styles.cardSub}>Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="dash-empty-container">
          <FaClipboardList className="dash-empty-icon" />
          <p className="dash-empty-title">No templates yet</p>
          <p className="dash-empty-desc">Create a template and assign it to staff roles.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>
          <div className={styles.card} style={{ padding: 12 }}>
            <p className={styles.cardSub} style={{ marginTop: 0, marginBottom: 8 }}>
              Templates
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {templates.map((t) => {
                const id = String(t.id || t._id);
                const active = id === String(selectedId);
                return (
                  <button
                    key={id}
                    type="button"
                    className={active ? styles.buttonPrimary : styles.buttonGhost}
                    style={{ textAlign: "left", justifyContent: "flex-start" }}
                    onClick={() => setSelectedId(id)}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {selected ? (
            <div className={styles.card} style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 className={styles.cardTitle} style={{ margin: 0 }}>
                    {selected.name}
                  </h3>
                  <p className={styles.cardSub} style={{ marginBottom: 0 }}>
                    Roles:{" "}
                    {(selected.roles || []).length
                      ? selected.roles.join(", ")
                      : "Fallback (any unassigned role)"}
                    {selected.isSystem ? " · System" : ""}
                  </p>
                  {selected.description ? (
                    <p className={styles.cardSub}>{selected.description}</p>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className={styles.buttonGhost} onClick={openEditTemplate}>
                    <FaPen style={{ marginRight: 6 }} />
                    Edit template
                  </button>
                  {!selected.isSystem ? (
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={() =>
                        setConfirm({
                          kind: "template",
                          message: "Are you sure you want to delete this template?",
                          onConfirm: deleteTemplate,
                        })
                      }
                    >
                      <FaTrash style={{ marginRight: 6 }} />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #e8eaed", margin: "16px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0 }}>Fields</h4>
                <button type="button" className={styles.buttonPrimary} onClick={openAddField}>
                  <FaPlus style={{ marginRight: 6 }} />
                  Add Field
                </button>
              </div>

              <ol style={{ margin: "12px 0 0", paddingLeft: 20 }}>
                {(selected.fields || [])
                  .filter((f) => f.isActive !== false)
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((field) => (
                    <li key={field.id || field._id} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>{field.label}</strong>
                          <span className={styles.cardSub} style={{ marginLeft: 8 }}>
                            {field.fieldType}
                            {field.isSystem ? " · system" : ""}
                            {(field.options || []).length
                              ? ` · ${(field.options || []).length} options`
                              : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() => openEditField(field)}
                          >
                            Edit
                          </button>
                          {["combobox", "dropdown", "status", "project", "task"].includes(
                            field.fieldType,
                          ) || (field.options || []).length > 0 ? (
                            <button
                              type="button"
                              className={styles.buttonGhost}
                              onClick={() => openOptions(field)}
                            >
                              <FaListUl style={{ marginRight: 6 }} />
                              Manage Options
                            </button>
                          ) : null}
                          {!field.isSystem ? (
                            <button
                              type="button"
                              className={styles.buttonDanger}
                              onClick={() =>
                                setConfirm({
                                  kind: "field",
                                  message: "Are you sure you want to delete this heading?",
                                  onConfirm: () => deleteField(field),
                                })
                              }
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}

      {/* Template modal */}
      <Modal
        open={Boolean(templateModal)}
        title={templateModal?.mode === "edit" ? "Edit template" : "Create template"}
        onClose={() => setTemplateModal(null)}
      >
        <label className={styles.fieldLabel}>Template name</label>
        <input
          className={styles.input}
          value={tplForm.name}
          onChange={(e) => setTplForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Designer Daily Report"
        />
        <label className={styles.fieldLabel} style={{ marginTop: 12 }}>
          Description
        </label>
        <textarea
          className={styles.input}
          rows={2}
          value={tplForm.description}
          onChange={(e) => setTplForm((p) => ({ ...p, description: e.target.value }))}
        />
        <label className={styles.fieldLabel} style={{ marginTop: 12 }}>
          Assigned roles
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {roles.length === 0 ? (
            <p className={styles.cardSub}>No staff roles yet — create staff in Team first.</p>
          ) : (
            roles.map((role) => (
              <label key={role} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={tplForm.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))
          )}
        </div>
        <p className={styles.cardSub}>Leave roles empty to use as fallback for unassigned roles.</p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.buttonGhost} onClick={() => setTemplateModal(null)}>
            Cancel
          </button>
          <button type="button" className={styles.buttonPrimary} onClick={saveTemplate}>
            Save
          </button>
        </div>
      </Modal>

      {/* Field modal */}
      <Modal
        open={Boolean(fieldModal)}
        title={fieldModal?.mode === "edit" ? "Edit field" : "Add field"}
        onClose={() => setFieldModal(null)}
      >
        <label className={styles.fieldLabel}>Field label (heading)</label>
        <input
          className={styles.input}
          value={fieldForm.label}
          onChange={(e) => setFieldForm((p) => ({ ...p, label: e.target.value }))}
          placeholder="Project Type"
        />
        <label className={styles.fieldLabel} style={{ marginTop: 12 }}>
          Field type
        </label>
        <select
          className={styles.input}
          value={fieldForm.fieldType}
          onChange={(e) => setFieldForm((p) => ({ ...p, fieldType: e.target.value }))}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={fieldForm.required}
            onChange={(e) => setFieldForm((p) => ({ ...p, required: e.target.checked }))}
          />
          Required
        </label>
        <div className={styles.modalActions}>
          <button type="button" className={styles.buttonGhost} onClick={() => setFieldModal(null)}>
            Cancel
          </button>
          <button type="button" className={styles.buttonPrimary} onClick={saveField}>
            Save
          </button>
        </div>
      </Modal>

      {/* Options modal */}
      <Modal
        open={Boolean(optionsField)}
        title={`${optionsField?.label || "Field"} Options`}
        onClose={() => {
          setOptionsModal(null);
          setOptionEdit(null);
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
          {(optionsField?.options || []).map((opt) => (
            <li
              key={opt.id || opt._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>{opt.label}</span>
              <span style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={styles.buttonGhost}
                  onClick={() => {
                    setOptionEdit({ mode: "edit", option: opt });
                    setOptionForm({ label: opt.label || "", value: opt.value || "" });
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.buttonDanger}
                  onClick={() =>
                    setConfirm({
                      kind: "option",
                      message: "Are you sure you want to delete this option?",
                      onConfirm: () => deleteOption(opt),
                    })
                  }
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>

        <label className={styles.fieldLabel}>
          {optionEdit?.mode === "edit" ? "Edit option" : "Add option"}
        </label>
        <input
          className={styles.input}
          placeholder="Option name (e.g. Poster)"
          value={optionForm.label}
          onChange={(e) => setOptionForm((p) => ({ ...p, label: e.target.value }))}
        />
        <input
          className={styles.input}
          style={{ marginTop: 8 }}
          placeholder="Value (optional)"
          value={optionForm.value}
          onChange={(e) => setOptionForm((p) => ({ ...p, value: e.target.value }))}
        />
        <div className={styles.modalActions}>
          {optionEdit ? (
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => {
                setOptionEdit(null);
                setOptionForm({ label: "", value: "" });
              }}
            >
              Cancel edit
            </button>
          ) : (
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => {
                setOptionsModal(null);
                setOptionEdit(null);
              }}
            >
              Close
            </button>
          )}
          <button type="button" className={styles.buttonPrimary} onClick={saveOption}>
            {optionEdit?.mode === "edit" ? "Update option" : "Add option"}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(confirm)}
        title="Confirm delete"
        message={confirm?.message || "Are you sure?"}
        confirmText="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
      />
    </section>
  );
}
