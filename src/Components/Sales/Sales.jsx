import ModulePage from "../Common/ModulePage";
export default function Sales() {
  return (
    <ModulePage
      kind="sales"
      columns={[
        { key: "number", label: "Order" },
        { key: "customer", label: "Customer" },
        { key: "date", label: "Order date", type: "date" },
        { key: "dueDate", label: "Delivery", type: "date" },
        { key: "total", label: "Total", type: "money" },
        { key: "status", label: "Status", type: "status" },
      ]}
    />
  );
}
