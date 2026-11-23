import { useState } from "react";
import { Plus, Trash2, LoaderCircle, Check } from "lucide-react";
import { Field, ErrorBox, useModal } from "./UI";
import { useWorkspace } from "../../utils/context";
import { money, today } from "../../utils/api";
export default function RecordForm({
  fields,
  onSubmit,
  initial = {},
  lines = false,
  submitLabel = "Save record",
}) {
  const { bootstrap } = useWorkspace();
  const modal = useModal();
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.key,
        initial[f.key] ??
          (f.type === "date"
            ? today()
            : f.type === "select"
              ? f.options[0]
              : f.key === "taxRate"
                ? bootstrap.company.taxRate
                : f.type === "number"
                  ? 0
                  : ""),
      ]),
    ),
  );
  const [items, setItems] = useState(
    initial.items || [{ productId: "", quantity: 1, price: 0 }],
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    modal?.setBusy(true);
    setError("");
    try {
      await onSubmit({ ...values, ...(lines ? { items } : {}) });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      modal?.setBusy(false);
    }
  }
  const subtotal = items.reduce(
    (s, i) => s + Number(i.quantity) * Number(i.price),
    0,
  );
  const discount =
    values.discountType === "percent"
      ? (subtotal * Number(values.discountValue || 0)) / 100
      : Number(values.discountValue || 0);
  const total = (subtotal - discount) * (1 + Number(values.taxRate || 0) / 100);
  return (
    <form onSubmit={submit} className="record-form">
      <div className="form-intro">
        <h3>Record information</h3>
        <p>
          Complete the details below, then review and save. All fields are
          required.
        </p>
      </div>
      {error && <ErrorBox message={error} />}
      <fieldset className="form-fields" disabled={busy}>
        <div className="form-grid">
          {fields.map((f) => {
            const options = {
              customer: bootstrap.customers,
              supplier: bootstrap.suppliers,
              product: bootstrap.products,
              invoice: bootstrap.invoices,
            }[f.type];
            return (
              <Field key={f.key} label={f.label}>
                {options ? (
                  <select
                    required
                    value={values[f.key]}
                    onChange={(e) => {
                      set(f.key, e.target.value);
                      if (f.key === "productId") {
                        const p = bootstrap.products.find(
                          (p) => p.id === Number(e.target.value),
                        );
                        if (p) set("price", p.price);
                      }
                    }}
                  >
                    <option value="">Choose {f.label.toLowerCase()}</option>
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name || o.number}
                      </option>
                    ))}
                  </select>
                ) : f.type === "select" ? (
                  <select
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                  >
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      f.type === "number"
                        ? "number"
                        : f.type === "date"
                          ? "date"
                          : f.type === "email"
                            ? "email"
                            : f.type === "password"
                              ? "password"
                              : "text"
                    }
                    step={f.type === "number" ? "0.01" : undefined}
                    min={f.type === "number" ? "0" : undefined}
                    required
                    value={values[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    maxLength={1000}
                  />
                )}
              </Field>
            );
          })}
        </div>
        {lines && (
          <div className="line-items">
            <h3>Line items</h3>
            {items.map((item, index) => (
              <div className="line-item" key={index}>
                <Field label="Product">
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => {
                      const product = bootstrap.products.find(
                        (p) => p.id === Number(e.target.value),
                      );
                      setItems(
                        items.map((i, n) =>
                          n === index
                            ? {
                                ...i,
                                productId: e.target.value,
                                price: product?.price || 0,
                              }
                            : i,
                        ),
                      );
                    }}
                  >
                    <option value="">Choose a product</option>
                    {bootstrap.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems(
                        items.map((i, n) =>
                          n === index ? { ...i, quantity: e.target.value } : i,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Unit price">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      setItems(
                        items.map((i, n) =>
                          n === index ? { ...i, price: e.target.value } : i,
                        ),
                      )
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove line item"
                  disabled={items.length === 1}
                  onClick={() => setItems(items.filter((_, n) => n !== index))}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button secondary small"
              onClick={() =>
                setItems([...items, { productId: "", quantity: 1, price: 0 }])
              }
            >
              <Plus size={15} /> Add line item
            </button>
            <div className="invoice-totals">
              <span>
                Subtotal <b>{money(subtotal)}</b>
              </span>
              <span>
                Discount <b>{money(discount)}</b>
              </span>
              <span>
                GST{" "}
                <b>
                  {money(
                    ((subtotal - discount) * Number(values.taxRate || 0)) / 100,
                  )}
                </b>
              </span>
              <strong>
                Total payable <b>{money(total)}</b>
              </strong>
            </div>
          </div>
        )}
      </fieldset>
      <footer className="form-footer">
        <span className="muted">
          {busy ? "Saving your changes…" : "Review your details before saving"}
        </span>
        <div className="button-row">
          {modal && (
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={modal.close}
            >
              Cancel
            </button>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Check size={16} />
            )}
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </footer>
    </form>
  );
}
