import { useState } from "react";
import { Package, Boxes, TriangleAlert } from "lucide-react";
import { useData, useWorkspace } from "../../utils/context";
import { api } from "../../utils/api";
import {
  PageHeader,
  DataTable,
  Stat,
  Tabs,
  Modal,
  AddButton,
  Loading,
  ErrorBox,
  Badge,
} from "../Common/UI";
import RecordForm from "../Common/RecordForm";
export default function Inventory() {
  const { version, bootstrap, refresh, notify } = useWorkspace();
  const [tab, setTab] = useState("stock"),
    [open, setOpen] = useState(false);
  const { data, error, loading, reload } = useData(
    "/records/inventory",
    version,
  );
  const movements = useData("/records/stockMovements", version);
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Every thread, every garment. Always accounted for."
      >
        {bootstrap.user.role === "Admin" && (
          <AddButton onClick={() => setOpen(true)}>Adjust stock</AddButton>
        )}
      </PageHeader>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <>
          <div className="stats-grid three">
            <Stat
              label="Stock items"
              value={data.length}
              detail="Across materials and finished goods"
              icon={Boxes}
            />
            <Stat
              label="Finished garments"
              value={data
                .filter((p) => p.category === "Finished goods")
                .reduce((s, p) => s + p.quantity, 0)
                .toLocaleString()}
              detail="Pieces available for sale"
              icon={Package}
            />
            <Stat
              label="Below reorder level"
              value={data.filter((p) => p.quantity <= p.reorder).length}
              detail="Materials that need your attention"
              icon={TriangleAlert}
            />
          </div>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: "stock", label: "Stock overview" },
              { key: "movements", label: "Movement history" },
            ]}
          />
          {tab === "stock" ? (
            <DataTable
              rows={data}
              exportName="inventory.csv"
              columns={[
                { key: "sku", label: "SKU" },
                { key: "name", label: "Item" },
                { key: "category", label: "Category" },
                { key: "quantity", label: "Available" },
                { key: "unit", label: "Unit" },
                { key: "location", label: "Location" },
                {
                  key: "status",
                  label: "Stock status",
                  render: (r) => (
                    <Badge>
                      {r.quantity <= r.reorder ? "Low stock" : "In stock"}
                    </Badge>
                  ),
                },
              ]}
            />
          ) : movements.error ? (
            <ErrorBox message={movements.error} />
          ) : (
            <DataTable
              rows={movements.data || []}
              exportName="stock-history.csv"
              columns={[
                { key: "name", label: "Item" },
                { key: "quantity", label: "Change" },
                { key: "balance", label: "Balance after" },
                { key: "reason", label: "Reason" },
                { key: "reference", label: "Reference" },
                { key: "date", label: "Date", type: "date" },
              ]}
            />
          )}
        </>
      )}
      {open && (
        <Modal title="Stock adjustment" onClose={() => setOpen(false)}>
          <StockAdjustment
            onSave={async (values) => {
              await api("/inventory/adjust", { method: "POST", body: values });
              setOpen(false);
              refresh();
              notify("Stock updated");
            }}
            products={bootstrap.products}
          />
        </Modal>
      )}
    </>
  );
}
function StockAdjustment({ onSave, products }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="record-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(Object.fromEntries(new FormData(e.currentTarget)));
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <ErrorBox message={error} />}
      <label className="field">
        <span>Product</span>
        <select name="productId" required>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Quantity change (negative to remove)</span>
        <input name="quantity" type="number" step="0.01" required />
      </label>
      <label className="field">
        <span>Reason</span>
        <input name="reason" required />
      </label>
      <button className="button primary" disabled={busy}>
        {busy ? "Saving…" : "Apply adjustment"}
      </button>
    </form>
  );
}
