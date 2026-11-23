import { useState } from "react";
import {
  IndianRupee,
  ShoppingBag,
  Factory,
  Wallet,
  CalendarDays,
  Plus,
  ArrowUpRight,
  Package,
  Clock3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useData, useWorkspace } from "../../utils/context";
import { money, date } from "../../utils/api";
import {
  PageHeader,
  Loading,
  ErrorBox,
  Stat,
  DataTable,
  Badge,
} from "../Common/UI";
export default function Dashboard() {
  const [period, setPeriod] = useState("month");
  const { version, navigate, bootstrap } = useWorkspace();
  const { data, error, loading, reload } = useData(
    `/dashboard?period=${period}`,
    version,
  );
  if (error) return <ErrorBox message={error} retry={reload} />;
  if (loading) return <Loading />;
  const stages = [
    "Planned",
    "Cutting",
    "Stitching",
    "Checking",
    "Ironing",
    "Packing",
    "Completed",
  ];
  return (
    <>
      <PageHeader
        eyebrow="YOUR BUSINESS, AT A GLANCE"
        title={`A good day to make great things.`}
        description={`Welcome back, ${bootstrap.user.name.split(" ")[0]}. Here’s what’s happening on your floor.`}
      >
        <div className="date-chip">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })}
        </div>
        <button className="button primary" onClick={() => navigate("sales")}>
          <Plus size={17} /> New sales order
        </button>
      </PageHeader>
      <div className="section-label">
        <h2>
          Business overview{" "}
          <span className="live-label">Live business data</span>
        </h2>
        <select
          aria-label="Dashboard period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="day">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="year">Last 12 months</option>
        </select>
      </div>
      <div className="stats-grid">
        <Stat
          label="Total sales"
          value={money(data.stats.sales)}
          detail="Invoice value · selected period"
          icon={IndianRupee}
          tone="featured"
        />
        <Stat
          label="Total purchases"
          value={money(data.stats.purchases)}
          detail="Purchase orders · selected period"
          icon={ShoppingBag}
        />
        <Stat
          label="Customer outstanding"
          value={money(data.stats.outstanding)}
          detail="Across all unsettled invoices"
          icon={Wallet}
        />
        <Stat
          label="Active work orders"
          value={data.stats.activeProduction.toString().padStart(2, "0")}
          detail="Currently on the production floor"
          icon={Factory}
        />
      </div>
      <div className="dashboard-middle">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Sales & purchases</h2>
              <p>A six-month view of your business</p>
            </div>
            <div className="chart-legend">
              <span>
                <i className="sales-dot" />
                Sales
              </span>
              <span>
                <i className="purchase-dot" />
                Purchases
              </span>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.chart}
                margin={{ top: 15, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#267556" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#267556" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="#e9ecea"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#7b8680", fontSize: 13 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                  tick={{ fill: "#7b8680", fontSize: 12 }}
                  width={58}
                />
                <Tooltip
                  formatter={(value) => money(value)}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e3e8e4",
                  }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="sales"
                  stroke="#267556"
                  strokeWidth={3}
                  fill="url(#salesFill)"
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="purchases"
                  stroke="#cba771"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel production-panel">
          <div className="panel-heading">
            <div>
              <h2>On the production floor</h2>
              <p>Good work, in progress</p>
            </div>
            <Factory size={20} />
          </div>
          <div className="production-list">
            {data.production.map((p) => (
              <button
                key={p.id}
                className="production-item"
                onClick={() => navigate("production")}
              >
                <div>
                  <span className="order-number">{p.number}</span>
                  <Badge>{p.status}</Badge>
                </div>
                <strong>{p.product}</strong>
                <div className="progress">
                  <span
                    style={{
                      width: `${(stages.indexOf(p.status) / 6) * 100}%`,
                    }}
                  />
                </div>
                <div className="production-meta">
                  <span>
                    {p.quantity} pieces · {p.line}
                  </span>
                  <span>Due {date(p.dueDate).slice(0, 6)}</span>
                </div>
              </button>
            ))}
          </div>
          <button className="panel-link" onClick={() => navigate("production")}>
            View all work orders
          </button>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel invoices-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent invoices</h2>
              <p>The latest from your sales desk</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("invoices")}
            >
              View all invoices
            </button>
          </div>
          <DataTable
            search={false}
            rows={data.recentInvoices}
            columns={[
              {
                key: "number",
                label: "Invoice",
                render: (r) => (
                  <strong className="record-number">{r.number}</strong>
                ),
              },
              { key: "customer", label: "Customer" },
              { key: "total", label: "Amount", type: "money" },
              { key: "status", label: "Payment status", type: "status" },
            ]}
          />
        </section>
        <section className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>A little planning goes a long way</p>
            </div>
            <span className="count-pill">{data.lowStock.length}</span>
          </div>
          {data.lowStock.map((p) => (
            <button
              key={p.id}
              className="stock-alert"
              onClick={() => navigate("inventory")}
            >
              <span className="stock-icon">
                <Package size={19} />
              </span>
              <div>
                <strong>{p.name}</strong>
                <span>
                  {p.quantity} {p.unit} left · Reorder at {p.reorder}
                </span>
              </div>
              <Badge>Low stock</Badge>
            </button>
          ))}
          <div className="supplier-summary">
            <Wallet size={18} />
            <span>
              Supplier outstanding
              <strong>{money(data.stats.supplierOutstanding)}</strong>
            </span>
            <button
              className="text-button"
              onClick={() => navigate("purchases")}
            >
              Review
            </button>
          </div>
        </section>
      </div>
      <div className="workspace-foot">
        <span>
          <span className="green-dot" />
          All systems connected
        </span>
        <span>Thoughtfully made for the way you manufacture.</span>
        <span>SHIRTERP · Demo workspace</span>
      </div>
    </>
  );
}
