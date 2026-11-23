import ModulePage from "../Common/ModulePage";
export default function Customers() {
  return (
    <ModulePage
      kind="customers"
      columns={[
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "gstin", label: "GSTIN" },
        { key: "status", label: "Status", type: "status" },
      ]}
    />
  );
}
