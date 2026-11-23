import { useState } from "react";
import { Download } from "lucide-react";
import { useData, useWorkspace } from "../../utils/context";
import { api, download } from "../../utils/api";
import {
  PageHeader,
  Tabs,
  DataTable,
  AddButton,
  Modal,
  ErrorBox,
  Loading,
} from "../Common/UI";
import RecordForm from "../Common/RecordForm";
export default function Settings() {
  const { bootstrap, refresh, notify, version } = useWorkspace();
  const [tab, setTab] = useState("company"),
    [open, setOpen] = useState(false);
  if (bootstrap.user.role !== "Admin")
    return (
      <>
        <PageHeader title="Company & settings" description="Company profile" />
        <div className="panel detail-content">
          <h2>{bootstrap.company.name}</h2>
          <p>{bootstrap.company.address}</p>
          <p>{bootstrap.company.email}</p>
          <p>Administrative controls are available to administrators.</p>
        </div>
      </>
    );
  return (
    <>
      <PageHeader
        title="Company & settings"
        description="A workspace that works the way you do."
      >
        <button
          className="button secondary"
          onClick={() =>
            download("/backup", "shirt-erp-export.json").catch((e) =>
              notify(e.message, "error"),
            )
          }
        >
          <Download size={16} /> Export database
        </button>
      </PageHeader>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: "company", label: "Company & invoice settings" },
          { key: "users", label: "Users & roles" },
          { key: "audit", label: "Activity log" },
          { key: "shares", label: "Simulated communications" },
        ]}
      />
      {tab === "company" ? (
        <div className="panel settings-form">
          <LogoSetting />
          <RecordForm
            fields={[
              { key: "name", label: "Company name", type: "text" },
              { key: "address", label: "Address", type: "text" },
              { key: "gstin", label: "GSTIN", type: "text" },
              { key: "cin", label: "CIN", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone", type: "text" },
              { key: "bank", label: "Bank details", type: "text" },
              { key: "taxRate", label: "Default GST %", type: "number" },
              { key: "footer", label: "Invoice footer", type: "text" },
              { key: "paymentTerms", label: "Payment terms", type: "text" },
            ]}
            initial={bootstrap.company}
            onSubmit={async (values) => {
              await api("/company", {
                method: "PUT",
                body: { ...values, logo: bootstrap.company.logo },
              });
              refresh();
              notify("Company settings saved");
            }}
            submitLabel="Save company settings"
          />
        </div>
      ) : (
        <>
          <div className="sub-toolbar">
            {tab === "users" && (
              <AddButton onClick={() => setOpen(true)}>Add user</AddButton>
            )}
          </div>
          <SettingsTable tab={tab} version={version} />
        </>
      )}
      {open && (
        <Modal title="Add workspace user" onClose={() => setOpen(false)}>
          <RecordForm
            fields={[
              { key: "name", label: "Full name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              {
                key: "password",
                label: "Password (8+ characters)",
                type: "password",
              },
              {
                key: "role",
                label: "Role",
                type: "select",
                options: ["Viewer", "Manager", "Accountant", "Admin"],
              },
            ]}
            onSubmit={async (values) => {
              await api("/users", { method: "POST", body: values });
              setOpen(false);
              refresh();
              notify("User added");
            }}
          />
        </Modal>
      )}
    </>
  );
}
function SettingsTable({ tab, version }) {
  const { bootstrap, refresh, notify } = useWorkspace();
  const { data, error, loading, reload } = useData(
    tab === "shares" ? "/records/shares" : `/${tab}`,
    version,
  );
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (loading) return <Loading />;
  return (
    <DataTable
      rows={data}
      actions={
        tab === "users"
          ? (row) =>
              row.id !== bootstrap.user.id && (
                <>
                  <select
                    aria-label={`Role for ${row.name}`}
                    value={row.role}
                    onChange={async (e) => {
                      try {
                        await api(`/users/${row.id}`, {
                          method: "PATCH",
                          body: { role: e.target.value, active: row.active },
                        });
                        refresh();
                        notify("User role updated");
                      } catch (e) {
                        notify(e.message, "error");
                      }
                    }}
                  >
                    {["Admin", "Manager", "Accountant", "Viewer"].map(
                      (role) => (
                        <option key={role}>{role}</option>
                      ),
                    )}
                  </select>
                  <button
                    onClick={async () => {
                      try {
                        await api(`/users/${row.id}`, {
                          method: "PATCH",
                          body: { role: row.role, active: !row.active },
                        });
                        refresh();
                        notify("User access updated");
                      } catch (e) {
                        notify(e.message, "error");
                      }
                    }}
                  >
                    {row.active ? "Deactivate" : "Activate"}
                  </button>
                </>
              )
          : undefined
      }
      columns={
        tab === "users"
          ? [
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "active", label: "Active" },
            ]
          : tab === "audit"
            ? [
                { key: "actor", label: "User" },
                { key: "action", label: "Activity" },
                { key: "entity", label: "Module / reference" },
                { key: "created_at", label: "Date", type: "date" },
              ]
            : [
                { key: "type", label: "Document" },
                { key: "channel", label: "Channel" },
                { key: "status", label: "Status", type: "status" },
                { key: "date", label: "Date", type: "date" },
              ]
      }
    />
  );
}

function LogoSetting() {
  const { bootstrap, refresh, notify } = useWorkspace();
  const [busy, setBusy] = useState(false);
  return (
    <div className="logo-setting">
      {bootstrap.company.logo && (
        <img src={bootstrap.company.logo} alt="Company logo" />
      )}
      <label className="field">
        <span>Invoice logo (PNG / JPEG, up to 300 KB)</span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (
              file.size > 300000 ||
              !["image/png", "image/jpeg"].includes(file.type)
            ) {
              notify("Choose a PNG or JPEG smaller than 300 KB", "error");
              return;
            }
            setBusy(true);
            try {
              const logo = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              await api("/company", {
                method: "PUT",
                body: { ...bootstrap.company, logo },
              });
              refresh();
              notify("Company logo saved");
            } catch (e) {
              notify(e.message || "Logo upload failed", "error");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </div>
  );
}
