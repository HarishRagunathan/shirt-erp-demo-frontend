import { useState } from "react";
import ModulePage from "../Common/ModulePage";
import { DataTable, Tabs, ErrorBox, Loading } from "../Common/UI";
import { useData, useWorkspace } from "../../utils/context";
import { api } from "../../utils/api";
export default function HR() {
  const [tab, setTab] = useState("employees");
  const { version, bootstrap, refresh, notify } = useWorkspace();
  const extra = useData(
    `/records/${tab === "employees" ? "attendance" : tab}`,
    version,
  );
  const tabs = (
    <Tabs
      value={tab}
      onChange={setTab}
      items={[
        { key: "employees", label: "Employees" },
        { key: "attendance", label: "Attendance" },
        { key: "leaves", label: "Leave requests" },
        { key: "payroll", label: "Payroll history" },
      ]}
    />
  );
  return tab === "employees" ? (
    <ModulePage
      kind="employees"
      columns={[
        { key: "name", label: "Employee" },
        { key: "department", label: "Department" },
        { key: "designation", label: "Designation" },
        { key: "salary", label: "Base salary", type: "money" },
        { key: "joined", label: "Joined", type: "date" },
      ]}
    >
      {tabs}
    </ModulePage>
  ) : (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PEOPLE & CULTURE</div>
          <h1>HR & payroll</h1>
          <p>Attendance, leave approvals and monthly salary records.</p>
        </div>
      </div>
      {tabs}
      {extra.error ? (
        <ErrorBox message={extra.error} />
      ) : extra.loading ? (
        <Loading />
      ) : (
        <DataTable
          rows={extra.data}
          exportName={`${tab}.csv`}
          columns={
            tab === "attendance"
              ? [
                  { key: "name", label: "Employee" },
                  { key: "date", label: "Date", type: "date" },
                  { key: "status", label: "Status", type: "status" },
                ]
              : tab === "leaves"
                ? [
                    { key: "name", label: "Employee" },
                    { key: "from", label: "From", type: "date" },
                    { key: "to", label: "To", type: "date" },
                    { key: "reason", label: "Reason" },
                    { key: "status", label: "Status", type: "status" },
                  ]
                : [
                    { key: "name", label: "Employee" },
                    { key: "month", label: "Month" },
                    { key: "base", label: "Base", type: "money" },
                    { key: "bonus", label: "Bonus", type: "money" },
                    { key: "deductions", label: "Deductions", type: "money" },
                    { key: "net", label: "Net pay", type: "money" },
                    { key: "status", label: "Status", type: "status" },
                  ]
          }
          actions={
            tab === "leaves" && bootstrap.user.role === "Admin"
              ? (r) =>
                  r.status === "Pending" &&
                  ["Approved", "Rejected"].map((status) => (
                    <button
                      key={status}
                      onClick={async () => {
                        try {
                          await api(`/leaves/${r.id}/decision`, {
                            method: "POST",
                            body: { status },
                          });
                          refresh();
                          notify(`Leave ${status.toLowerCase()}`);
                        } catch (e) {
                          notify(e.message, "error");
                        }
                      }}
                    >
                      {status === "Approved" ? "Approve" : "Reject"}
                    </button>
                  ))
              : undefined
          }
        />
      )}
    </>
  );
}
