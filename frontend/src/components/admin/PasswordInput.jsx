import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import styles from "./Admin.module.css";

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Password",
  readOnly = false,
  autoComplete = "new-password",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={styles.settingsPasswordField}>
      {label ? <span className={styles.settingsPasswordLabel}>{label}</span> : null}
      <div className={styles.passwordInputWrap}>
        <input
          type={visible ? "text" : "password"}
          className={`${styles.input} ${styles.passwordInput}`}
          value={value}
          onChange={readOnly ? undefined : onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className={styles.passwordToggleBtn}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={readOnly ? -1 : 0}
        >
          {visible ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
        </button>
      </div>
    </label>
  );
}
