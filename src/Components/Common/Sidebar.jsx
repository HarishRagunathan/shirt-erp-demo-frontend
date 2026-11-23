import { Shirt, ChevronsUpDown, LogOut, X } from "lucide-react";
import { navigation } from "../../Data/navigation";
import { useWorkspace } from "../../utils/context";
export default function Sidebar({ open, onClose, onLogout }) {
  const { active, navigate, bootstrap, t } = useWorkspace();
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Shirt size={25} strokeWidth={1.8} />
          </span>
          <div>
            <strong>
              SHIRT<span>ERP</span>
            </strong>
            <small>Made for makers.</small>
          </div>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="company-switch">
          <span className="company-avatar">S</span>
          <div>
            <strong>{bootstrap.company.name}</strong>
            <small>{t("Demo workspace")}</small>
          </div>
          <ChevronsUpDown size={14} />
        </div>
        <nav>
          {navigation.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-label">{t(group.title)}</div>
              {group.items.map(([key, label, Icon]) => (
                <button
                  key={key}
                  className={`nav-item ${active === key ? "active" : ""}`}
                  onClick={() => {
                    navigate(key);
                    onClose();
                  }}
                >
                  <Icon size={18} strokeWidth={1.7} />
                  <span>{t(label)}</span>
                  {key === "production" && (
                    <span className="nav-mini">Floor</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">
            {bootstrap.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div>
            <strong>{bootstrap.user.name}</strong>
            <small>{bootstrap.user.role}</small>
          </div>
          <button
            aria-label={t("Sign out")}
            title={t("Sign out")}
            onClick={onLogout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
