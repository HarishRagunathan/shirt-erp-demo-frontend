import ModulePage from "../Common/ModulePage";
export default function Gst() {
  return (
    <ModulePage
      kind="eway"
      columns={[
        { key: "number", label: "Demo e-way bill" },
        { key: "invoice", label: "Invoice" },
        { key: "vehicle", label: "Vehicle" },
        { key: "destination", label: "Destination" },
        { key: "distance", label: "Distance (km)" },
        { key: "status", label: "Status", type: "status" },
      ]}
    />
  );
}
