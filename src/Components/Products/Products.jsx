import ModulePage from "../Common/ModulePage";
export default function Products() {
  return (
    <ModulePage
      kind="products"
      columns={[
        { key: "sku", label: "SKU" },
        { key: "name", label: "Product" },
        { key: "category", label: "Category" },
        { key: "size", label: "Size" },
        { key: "colour", label: "Colour" },
        { key: "price", label: "Price", type: "money" },
      ]}
    />
  );
}
