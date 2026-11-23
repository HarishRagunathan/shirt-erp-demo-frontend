import ModulePage from "../Common/ModulePage";
export default function Purchases() {
  return (
    <ModulePage
      kind="purchases"
      columns={[
        { key: "number", label: "Purchase order" },
        { key: "supplier", label: "Supplier" },
        { key: "product", label: "Product" },
        { key: "quantity", label: "Ordered" },
        { key: "received", label: "Received" },
        { key: "total", label: "Total", type: "money" },
        { key: "paid", label: "Paid", type: "money" },
        { key: "status", label: "Status", type: "status" },
      ]}
    />
  );
}
