import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "https://admin.i-panel.pro:8787";
const USERNAME = __ENV.USERNAME || "mainadmin";
const PASSWORD = __ENV.PASSWORD || "mainadmin";
const DURATION = __ENV.DURATION || "3m";
const VUS = Number(__ENV.VUS || 200);
const POLL_SECONDS = Number(__ENV.POLL_SECONDS || 30);

export const panelThemeLatency = new Trend("ipanel_panel_theme_latency");
export const panelBatchLatency = new Trend("ipanel_panel_batch_latency");
export const panelFailures = new Rate("ipanel_panel_failures");
export const panelPolls = new Counter("ipanel_panel_polls");

export const options = {
  insecureSkipTLSVerify: true,
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
    ipanel_panel_failures: ["rate<0.02"],
    ipanel_panel_theme_latency: ["p(95)<1000"],
    ipanel_panel_batch_latency: ["p(95)<1500"],
  },
};

function authHeaders(token) {
  return { headers: { accept: "application/json", Authorization: `Bearer ${token}` } };
}

function postHeaders(token) {
  return {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

function extractFabricNumbers(payload) {
  const found = [];
  const walk = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "object") {
      const candidate =
        value.factory_number ||
        value.fabric_number ||
        value.factoryNumber ||
        value.fabricNumber ||
        value.number ||
        value.panel_number;
      if (candidate !== undefined && candidate !== null) {
        const text = String(candidate).trim();
        if (/^\d{6,}$/.test(text)) found.push(text);
      }
      Object.values(value).forEach(walk);
    }
  };
  walk(payload);
  return Array.from(new Set(found));
}

export function setup() {
  const login = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { "Content-Type": "application/json", accept: "application/json" } },
  );
  check(login, {
    "login 200": (r) => r.status === 200,
    "token exists": (r) => !!r.json("access_token"),
  });
  const token = login.json("access_token");
  const panels = http.get(`${BASE_URL}/api/panels/get_all_panels`, authHeaders(token));
  check(panels, { "panels loaded": (r) => r.status >= 200 && r.status < 400 });
  let fabricNumbers = [];
  try {
    fabricNumbers = extractFabricNumbers(panels.json());
  } catch (error) {
    fabricNumbers = [];
  }
  if (!fabricNumbers.length) fabricNumbers = ["11110007", "11110011", "11110012"];
  return { token, fabricNumbers };
}

export default function (data) {
  const token = data.token;
  const fabrics = data.fabricNumbers;
  const fabric = fabrics[(__VU - 1) % fabrics.length];

  const themeStart = Date.now();
  const theme = http.get(`${BASE_URL}/api/panels/theme_id/${fabric}`, authHeaders(token));
  panelThemeLatency.add(Date.now() - themeStart, { fabric });
  const themeOk = theme.status >= 200 && theme.status < 400;
  panelFailures.add(!themeOk, { endpoint: "theme" });
  check(theme, { "theme ok": () => themeOk });

  const body = JSON.stringify({
    widgets: ["weather", "news", "traffic", "rates", "metals"],
    include_media: true,
    panel_ids: [fabric],
  });
  const batchStart = Date.now();
  const batch = http.post(`${BASE_URL}/api/parse/batch`, body, postHeaders(token));
  panelBatchLatency.add(Date.now() - batchStart, { fabric });
  const batchOk = batch.status >= 200 && batch.status < 400;
  panelFailures.add(!batchOk, { endpoint: "parse_batch" });
  check(batch, { "batch ok": () => batchOk });

  panelPolls.add(1, { fabric });
  sleep(POLL_SECONDS + Math.random() * 3);
}
