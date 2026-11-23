import Dashboard from "../Components/Dashboard/Dashboard";
import Customers from "../Components/Customers/Customers";
import Suppliers from "../Components/Suppliers/Suppliers";
import Products from "../Components/Products/Products";
import Inventory from "../Components/Inventory/Inventory";
import Purchases from "../Components/Purchases/Purchases";
import Sales from "../Components/Sales/Sales";
import Quotations from "../Components/Quotations/Quotations";
import Invoices from "../Components/Invoices/Invoices";
import Production from "../Components/Production/Production";
import Accounts from "../Components/Accounts/Accounts";
import Expenses from "../Components/Expenses/Expenses";
import HR from "../Components/HR/HR";
import Gst from "../Components/Gst/Gst";
import Reports from "../Components/Reports/Reports";
import Payments from "../Components/Payments/Payments";
import Settings from "../Components/Settings/Settings";
export const pages = {
  dashboard: Dashboard,
  customers: Customers,
  suppliers: Suppliers,
  products: Products,
  inventory: Inventory,
  purchases: Purchases,
  sales: Sales,
  quotations: Quotations,
  invoices: Invoices,
  production: Production,
  accounts: Accounts,
  expenses: Expenses,
  employees: HR,
  eway: Gst,
  reports: Reports,
  payments: Payments,
  settings: Settings,
};
export default function WorkspacePage({ active }) {
  const Page = pages[active] || Dashboard;
  return <Page />;
}
