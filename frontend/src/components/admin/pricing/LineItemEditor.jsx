import OptionEditor from "./OptionEditor.jsx";
import styles from "../Admin.module.css";

export default function LineItemEditor({ line, onChange, onDelete, onAddOption, inlineAddOption = false }) {
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
        <input
          className={styles.input}
          value={line.blurb}
          onChange={(e) => onChange({ ...line, blurb: e.target.value })}
          placeholder="Blurb (optional)"
          style={{ marginTop: 8 }}
        />
      ) : (
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => onChange({ ...line, blurb: "" })}
          style={{ marginTop: 8 }}
        >
          + Add blurb
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
    </div>
  );
}

