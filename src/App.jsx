import { commonTamil } from "./Data/translations";
import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  X,
  Globe2,
  ChevronRight,
} from "lucide-react";
import { api } from "./utils/api";
import { Workspace } from "./utils/context";
import { navigation, tamil } from "./Data/navigation";
import Login from "./Pages/Login";
import WorkspacePage, { pages } from "./Pages/WorkspacePage";
import Sidebar from "./Components/Common/Sidebar";
import { Loading, ErrorBox, Modal } from "./Components/Common/UI";
import "./Styles/app.css";
export default function App() {
  const [signed, setSigned] = useState(!!sessionStorage.getItem("shirt-token")),
    [bootstrap, setBootstrap] = useState(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0),
    [active, setActive] = useState(location.hash.slice(1) || "dashboard"),
    [toast, setToast] = useState(null),
    [mobile, setMobile] = useState(false),
    [language, setLanguage] = useState(
      localStorage.getItem("shirt-language") || "en",
    ),
    [search, setSearch] = useState(""),
    [alerts, setAlerts] = useState(null);
  const t = (text) =>
    language === "ta" ? tamil[text] || commonTamil[text] || text : text;
  const notify = (message, type = "success") => setToast({ message, type });
  const navigate = (key) => {
    location.hash = key;
    setActive(key);
    setSearch("");
    window.scrollTo(0, 0);
  };
  const refresh = () => setVersion((v) => v + 1);
  useEffect(() => {
    const fn = () =>
      setActive(
        pages[location.hash.slice(1)] ? location.hash.slice(1) : "dashboard",
      );
    const expired = () => {
      setSigned(false);
      setBootstrap(null);
    };
    window.addEventListener("hashchange", fn);
    window.addEventListener("session-expired", expired);
    return () => {
      window.removeEventListener("hashchange", fn);
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  useEffect(() => {
    if (!signed) return;
    let cancelled = false;
    api("/bootstrap")
      .then((d) => {
        if (!cancelled) {
          setBootstrap(d);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [signed, version]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("shirt-language", language);
  }, [language]);
  if (!signed)
    return (
      <Login
        onLogin={() => {
          setSigned(true);
          refresh();
        }}
      />
    );
  if (error && !bootstrap) return <ErrorBox message={error} retry={refresh} />;
  if (!bootstrap) return <Loading />;
  const value = {
    bootstrap,
    active,
    navigate,
    refresh,
    notify,
    version,
    language,
    t,
  };
  const pageLabel =
    navigation.flatMap((g) => g.items).find((i) => i[0] === active)?.[1] ||
    "Dashboard";
  const results = search
    ? navigation
        .flatMap((g) => g.items)
        .filter(([, label]) =>
          label.toLowerCase().includes(search.toLowerCase()),
        )
    : [];
  return (
    <Workspace.Provider value={value}>
      <div className="app-shell">
        <Sidebar
          open={mobile}
          onClose={() => setMobile(false)}
          onLogout={() => {
            sessionStorage.removeItem("shirt-token");
            setSigned(false);
            setBootstrap(null);
          }}
        />
        <div className="main-shell">
          <header className="topbar">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>{t("Manufacturing workspace")}</span>
              <ChevronRight size={14} />
              <strong>{t(pageLabel)}</strong>
            </div>
            <div className="topbar-actions">
              <div className="global-search">
                <Search size={17} />
                <input
                  aria-label="Find a module"
                  placeholder={
                    language === "ta" ? "பகுதியைத் தேடுங்கள்…" : "Find a module…"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <div className="search-results">
                    {results.length ? (
                      results.map(([key, label, Icon]) => (
                        <button key={key} onClick={() => navigate(key)}>
                          <Icon size={16} />
                          {t(label)}
                        </button>
                      ))
                    ) : (
                      <span>No matching modules</span>
                    )}
                  </div>
                )}
              </div>
              <label className="language-picker">
                <Globe2 size={16} />
                <select
                  aria-label="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                </select>
              </label>
              <button
                className="icon-button notification-button"
                aria-label="View stock alerts"
                onClick={async () => {
                  try {
                    const d = await api("/dashboard");
                    setAlerts(d);
                  } catch (e) {
                    notify(e.message, "error");
                  }
                }}
              >
                <Bell size={19} />
                <i />
              </button>
              <span className="top-avatar">
                {bootstrap.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
          </header>
          <main className="page-content" key={active}>
            <WorkspacePage active={active} />
          </main>
        </div>
      </div>
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <CheckCircle2 size={19} />
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {alerts && (
        <Modal title="Workspace activity" onClose={() => setAlerts(null)}>
          <div className="detail-content">
            <h3>Stock alerts</h3>
            {alerts.lowStock.map((s) => (
              <p key={s.id}>
                {s.name}:{" "}
                <b>
                  {s.quantity} {s.unit}
                </b>{" "}
                remaining
              </p>
            ))}
            <h3>Recent activity</h3>
            {alerts.activity.map((a) => (
              <div className="activity-item" key={a.id}>
                <strong>{a.action}</strong>
                <span>
                  {a.actor} · {a.entity}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </Workspace.Provider>
  );
}
