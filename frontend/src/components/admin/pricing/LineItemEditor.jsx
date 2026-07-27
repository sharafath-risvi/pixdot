import OptionEditor from "./OptionEditor.jsx";
import styles from "../Admin.module.css";

export default function LineItemEditor({ line, onChange, onDelete, onAddOption, onSave, inlineAddOption = false }) {
  return (
    <div className={styles.pricingLine}>
      <div className={styles.row}>
        <input
          className={styles.input}
          value={line.name}
          onChange={(e) => onChange({ ...line, name: e.target.value })}
        />
        <div className={styles.topbarActions}>
          {!inlineAddOption ? (
            <button type="button" className={styles.buttonGhost} onClick={onAddOption}>
              + Add Option
            </button>
          ) : null}
          <button type="button" className={styles.buttonDanger} onClick={onDelete}>
            Delete line
          </button>
        </div>
      </div>
      {line.blurb ? (
        <div style={{ marginTop: 8 }}>
          <textarea
            className={styles.textarea}
            value={line.blurb}
            onChange={(e) => onChange({ ...line, blurb: e.target.value })}
            placeholder="Description"
          />
        </div>
      ) : (
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => onChange({ ...line, blurb: " " })}
          style={{ marginTop: 8 }}
        >
          + Add Description
        </button>
      )}
      <div className={styles.pricingOptions}>
        {(line.options ?? []).map((opt) => (
          <OptionEditor
            key={opt.id}
            option={opt}
            onChange={(next) =>
              onChange({
                ...line,
                options: (line.options ?? []).map((x) => (x.id === opt.id ? next : x)),
              })
            }
            onDelete={() =>
              onChange({
                ...line,
                options: (line.options ?? []).filter((x) => x.id !== opt.id),
              })
            }
          />
        ))}
      </div>
      {onSave && (
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

