const base = import.meta.env.VITE_API_URL || "/api";
export async function api(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("shirt-token") || ""}`,
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (response.status === 401) {
    sessionStorage.removeItem("shirt-token");
    window.dispatchEvent(new Event("session-expired"));
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Unable to reach the server");
  }
  return response.json();
}
export async function download(path, filename) {
  const response = await fetch(base + path, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("shirt-token") || ""}`,
    },
  });
  if (!response.ok) throw new Error("Document download failed");
  const blob = await response.blob();
  saveBlob(blob, filename);
}
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(
    (k) => typeof rows[0][k] !== "object",
  );
  const escape = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  saveBlob(
    new Blob(
      [
        "\ufeff" +
          [
            keys.map(escape).join(","),
            ...rows.map((r) => keys.map((k) => escape(r[k])).join(",")),
          ].join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    ),
    filename,
  );
}
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
