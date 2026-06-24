import { useEffect, useRef, useState } from "react";
import { FaGear, FaIndianRupeeSign, FaUser, FaUserPlus, FaUsers } from "react-icons/fa6";
import styles from "./Admin.module.css";

export default function AdminProfileMenu({
  onAddClient,
  onAddStaff,
  onServicePrices,
  onSettings,
  onNavigate,
  buttonClassName,
  placement = "header",
  collapsed = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isSidebar = placement === "sidebar";

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const run = (fn) => {
    setMenuOpen(false);
    fn?.();
    onNavigate?.();
  };

  const items = [
    { label: "Pricing", icon: FaIndianRupeeSign, onClick: onServicePrices },
    { label: "Add client", icon: FaUserPlus, onClick: onAddClient },
    { label: "Add staff", icon: FaUsers, onClick: onAddStaff },
    { label: "Settings", icon: FaGear, onClick: onSettings },
  ];

  return (
    <div
      className={`${styles.profileMenuWrap} ${isSidebar ? styles.profileMenuWrapSidebar : ""} ${
        collapsed ? styles.profileMenuWrapCollapsed : ""
      }`}
      ref={menuRef}
    >
      <button
        type="button"
        className={
          buttonClassName ||
          (isSidebar ? styles.sidebarProfileTrigger : styles.profileMenuBtn)
        }
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Admin quick actions"
      >
        <span className={styles.sidebarProfileIcon} aria-hidden>
          <FaUser />
        </span>
        {isSidebar && !collapsed ? <span className={styles.sidebarProfileLabel}>Quick actions</span> : null}
      </button>

      {menuOpen ? (
        <div
          className={`${styles.profileDropdown} ${
            isSidebar ? styles.profileDropdownSidebar : styles.profileDropdownHeader
          } ${menuOpen ? styles.profileDropdownOpen : ""}`}
          role="menu"
        >
          {items.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              className={styles.profileDropdownItem}
              onClick={() => run(onClick)}
            >
              <Icon aria-hidden />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
