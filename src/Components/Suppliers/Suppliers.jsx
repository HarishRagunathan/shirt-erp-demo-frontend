import ModulePage from "../Common/ModulePage";
export default function Suppliers() {
  return (
    <ModulePage
      kind="suppliers"
      columns={[
        { key: "name", label: "Supplier" },
        { key: "category", label: "Speciality" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status", type: "status" },
      ]}
    />
  );
}
