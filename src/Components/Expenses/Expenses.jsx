import ModulePage from "../Common/ModulePage";
export default function Expenses() {
  return (
    <ModulePage
      kind="expenses"
      columns={[
        { key: "number", label: "Reference" },
        { key: "name", label: "Description" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", type: "money" },
        { key: "date", label: "Date", type: "date" },
        { key: "method", label: "Payment method" },
      ]}
    />
  );
}
