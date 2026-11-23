import ModulePage from "../Common/ModulePage";
export default function Production() {
  return (
    <ModulePage
      kind="production"
      columns={[
        { key: "number", label: "Work order" },
        { key: "product", label: "Product" },
        { key: "quantity", label: "Planned pcs" },
        { key: "material", label: "BOM material" },
        { key: "materialPerUnit", label: "Per garment" },
        { key: "line", label: "Line" },
        { key: "dueDate", label: "Due", type: "date" },
        { key: "status", label: "Stage", type: "status" },
      ]}
    >
      <div className="stage-strip">
        {[
          "Planned",
          "Cutting",
          "Stitching",
          "Checking",
          "Ironing",
          "Packing",
          "Completed",
        ].map((s, i) => (
          <span key={s}>
            <b>{i + 1}</b>
            {s}
          </span>
        ))}
      </div>
    </ModulePage>
  );
}
