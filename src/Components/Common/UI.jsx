import { useWorkspace } from "../../utils/context";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { csv, money, date } from "../../utils/api";
export function Translated({ text }) {
  const workspace = useWorkspace();
  return typeof text === "string" ? workspace?.t(text) || text : text;
}
export function Badge({ children }) {
  const text = String(children || "");
  const kind =
    /paid|active|successful|completed|approved|received|present|confirmed/i.test(
      text,
    ) && !/partial|unpaid|part received|inactive/i.test(text)
      ? "green"
      : /failed|cancelled|refunded|rejected|low/i.test(text)
        ? "red"
        : /partial|pending|planned|draft|ordered|cutting|stitching|checking|packing|ironing|part received/i.test(
              text,
            )
          ? "amber"
          : "gray";
  return (
    <span className={`badge ${kind}`}>
      <Translated text={text} />
    </span>
  );
}
export function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={24} /> Loading your workspace…
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  return (
    <div className="error-box">
      <AlertCircle size={20} />
      <span>{message}</span>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}
export function PageHeader({
  eyebrow = "WORKSPACE",
  title,
  description,
  children,
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          <Translated text={title} />
        </h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
const ModalContext = createContext(null);
export function useModal() {
  return useContext(ModalContext);
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  const closeRef = useRef(onClose);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  closeRef.current = onClose;
  const close = () => {
    if (!busyRef.current) closeRef.current();
  };
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handle = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const elements = [
          ...(ref.current?.querySelectorAll(
            'button,input,select,textarea,a[href],[tabindex="0"]',
          ) || []),
        ].filter((el) => !el.disabled && el.getClientRects().length);
        if (!elements.length) {
          e.preventDefault();
          return;
        }
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <header>
          <div>
            <span className="modal-eyebrow">WORKSPACE RECORD</span>
            <h2>
              <Translated text={title} />
            </h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            disabled={busy}
            onClick={close}
          >
            <X size={20} />
          </button>
        </header>
        <ModalContext.Provider
          value={{
            close,
            setBusy: (value) => {
              busyRef.current = value;
              setBusy(value);
            },
          }}
        >
          {children}
        </ModalContext.Provider>
      </section>
    </div>,
    document.body,
  );
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>
        <Translated text={label} />
      </span>
      {children}
    </label>
  );
}
export function DataTable({
  rows = [],
  columns,
  actions,
  search = true,
  exportName,
  printAll = false,
  empty = "No records match your filters.",
  onRow,
}) {
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0);
  const filtered = rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, pages - 1);
  return (
    <div className="table-card">
      {(search || exportName) && (
        <div className="table-toolbar">
          {search && (
            <label className="search-input">
              <Search size={17} />
              <input
                aria-label="Search records"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search records…"
              />
            </label>
          )}
          <span className="muted">{filtered.length} records</span>
          {exportName && (
            <button
              className="button secondary small"
              disabled={!filtered.length}
              onClick={() => csv(filtered, exportName)}
            >
              <Download size={15} /> <Translated text="Export CSV" />
            </button>
          )}
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <Translated text={c.label} />
                </th>
              ))}
              {actions && (
                <th>
                  <Translated text="Actions" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {(printAll
              ? filtered
              : filtered.slice(current * 8, current * 8 + 8)
            ).map((r, index) => (
              <tr
                key={r.id ?? index}
                onClick={onRow ? () => onRow(r) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(r) : format(r[c.key], c.type)}
                  </td>
                ))}
                {actions && (
                  <td>
                    <div
                      className="row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(r)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="empty"
                >
                  <div className="empty-state">
                    <Search size={28} />
                    <strong>
                      {query ? "No matching records" : "No records yet"}
                    </strong>
                    <span>{empty}</span>
                    {query && (
                      <button
                        className="button secondary small"
                        onClick={() => {
                          setQuery("");
                          setPage(0);
                        }}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          Showing {filtered.length ? current * 8 + 1 : 0}–
          {Math.min((current + 1) * 8, filtered.length)} of {filtered.length}
        </span>
        <div>
          <button
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
function format(value, type) {
  if (type === "money") return money(value);
  if (type === "date") return date(value);
  if (type === "status") return <Badge>{value}</Badge>;
  if (value === undefined || value === null) return "—";
  return String(value);
}
export function AddButton({ children = "Add record", onClick }) {
  return (
    <button className="button primary" onClick={onClick}>
      <Plus size={17} />
      {children}
    </button>
  );
}
export function Stat({ label, value, detail, icon: Icon, tone = "" }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="stat-top">
        <span>
          <Translated text={label} />
        </span>
        {Icon && <Icon size={19} />}
      </div>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}
export function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => (
        <button
          key={item.key}
          className={value === item.key ? "active" : ""}
          onClick={() => onChange(item.key)}
        >
          <Translated text={item.label} />
        </button>
      ))}
    </div>
  );
}
