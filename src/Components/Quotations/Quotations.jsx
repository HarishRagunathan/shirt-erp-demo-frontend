import ModulePage from "../Common/ModulePage";
export default function Quotations() {
  return (
    <ModulePage
      kind="quotations"
      columns={[
        { key: "number", label: "Quotation" },
        { key: "customer", label: "Customer" },
        { key: "date", label: "Date", type: "date" },
        { key: "dueDate", label: "Valid until", type: "date" },
        { key: "total", label: "Total", type: "money" },
        { key: "status", label: "Status", type: "status" },
      ]}
    />
  );
}
