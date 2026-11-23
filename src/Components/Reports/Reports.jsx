import { useState } from "react";
import { Printer, Download } from "lucide-react";
import { useData, useWorkspace } from "../../utils/context";
import { csv } from "../../utils/api";
import { PageHeader, DataTable, Field, Loading, ErrorBox } from "../Common/UI";
export default function Reports() {
  const { version, bootstrap } = useWorkspace();
  const [printAll, setPrintAll] = useState(false);
  const [filters, setFilters] = useState({
    type: "sales",
    from: "",
    to: "",
    customer: "",
    supplier: "",
    search: "",
  });
  const { data, error, loading, reload } = useData(
    `/reports?${new URLSearchParams(filters)}`,
    version,
  );
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const columns = data?.length
    ? Object.keys(data[0])
        .filter(
          (k) =>
            ![
              "id",
              "customerId",
              "supplierId",
              "productId",
              "items",
              "totals",
            ].includes(k) && typeof data[0][k] !== "object",
        )
        .map((key) => ({
          key,
          label: key.replace(/_/g, " ").replace(/([A-Z])/g, " $1"),
          type: [
            "total",
            "paid",
            "outstanding",
            "amount",
            "tax",
            "price",
            "cost",
          ].includes(key)
            ? "money"
            : key === "status"
              ? "status"
              : undefined,
        }))
    : [];
  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Useful answers, straight from your business records."
      >
        <button
          className="button secondary"
          onClick={() => {
            setPrintAll(true);
            setTimeout(() => {
              window.print();
              setPrintAll(false);
            }, 150);
          }}
        >
          <Printer size={16} /> Print / Save PDF
        </button>
        <button
          className="button primary"
          disabled={!data?.length}
          onClick={() => csv(data, `${filters.type}-report.csv`)}
        >
          <Download size={16} /> Export CSV
        </button>
      </PageHeader>
      <div className="report-filters">
        <Field label="Report">
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters({
                ...filters,
                type: e.target.value,
                customer: "",
                supplier: "",
              })
            }
          >
            {[
              ["sales", "Sales report"],
              ["purchases", "Purchase report"],
              ["stock", "Stock report"],
              ["gst", "GST report"],
              ["customers", "Customer report"],
              ["outstanding", "Outstanding report"],
              ["payments", "Installment payment history"],
              ["settlements", "Invoice settlements"],
              ["profit", "Profit & loss report"],
              ["expenses", "Expense report"],
            ].map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </Field>
        {["sales", "gst", "outstanding", "payments", "settlements"].includes(
          filters.type,
        ) && (
          <Field label="Customer">
            <select
              value={filters.customer}
              onChange={(e) => set("customer", e.target.value)}
            >
              <option value="">All customers</option>
              {bootstrap.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {filters.type === "purchases" && (
          <Field label="Supplier">
            <select
              value={filters.supplier}
              onChange={(e) => set("supplier", e.target.value)}
            >
              <option value="">All suppliers</option>
              {bootstrap.suppliers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Product / category / keyword">
          <input
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Filter report…"
          />
        </Field>
      </div>
      {filters.from && filters.to && filters.from > filters.to ? (
        <ErrorBox message="From date must be before To date." />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : loading ? (
        <Loading />
      ) : (
        <DataTable
          printAll={printAll}
          rows={data || []}
          columns={columns}
          search={false}
        />
      )}
    </>
  );
}
