import { useState } from "react";
import { Shirt, ShieldCheck, Factory, Boxes, Receipt } from "lucide-react";
import { api } from "../utils/api";
export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@shirterp.demo"),
    [password, setPassword] = useState("ShirtDemo@123"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <Shirt size={30} /> SHIRTERP
        </div>
        <div>
          <span className="eyebrow">MADE FOR MAKERS</span>
          <h1>
            Great garments.
            <br />
            Even better
            <br />
            <em>business.</em>
          </h1>
          <p>
            Bring your people, production and finances together in one
            thoughtful workspace.
          </p>
          <div className="login-features">
            <span>
              <Factory size={20} /> Plan production
            </span>
            <span>
              <Boxes size={20} /> Know your stock
            </span>
            <span>
              <Receipt size={20} /> Get every payment right
            </span>
          </div>
        </div>
        <small>From the first thread to the final invoice.</small>
      </section>
      <section className="login-form-wrap">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              const result = await api("/auth/login", {
                method: "POST",
                body: { email, password },
              });
              sessionStorage.setItem("shirt-token", result.token);
              onLogin();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="login-badge">
            <ShieldCheck size={16} /> DEMO WORKSPACE
          </span>
          <h2>Welcome to your workspace.</h2>
          <p>Sign in to see your business, beautifully connected.</p>
          {error && <div className="error-box">{error}</div>}
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button primary login-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to SHIRTERP"}
          </button>
          <div className="demo-credentials">
            <strong>Your demo is ready to explore</strong>
            <span>Admin: admin@shirterp.demo</span>
            <span>Read-only: viewer@shirterp.demo</span>
            <span>Password: ShirtDemo@123</span>
          </div>
          <small className="muted">
            Seeded business data. Simulated integrations. Real workflows.
          </small>
        </form>
      </section>
    </main>
  );
}
