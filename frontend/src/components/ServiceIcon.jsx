import {
  FaBoxOpen,
  FaBullhorn,
  FaGlobe,
  FaMobile,
  FaPalette,
  FaUserTie,
} from "react-icons/fa6";

/** Name must match `icon` in servicesData.json (Font Awesome 6 solid via react-icons). */
const ICONS = {
  FaPalette,
  FaBoxOpen,
  FaBullhorn,
  FaUserTie,
  FaGlobe,
  FaMobile,
};

export default function ServiceIcon({ name, className = "h-5 w-5" }) {
  const Icon = ICONS[name] ?? FaGlobe;
  return <Icon className={className} aria-hidden />;
}
