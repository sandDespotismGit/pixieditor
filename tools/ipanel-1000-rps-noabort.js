import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "https://admin.i-panel.pro:8787";
const USERNAME = __ENV.USERNAME || "mainadmin";
const PASSWORD = __ENV.PASSWORD || "mainadmin";
const FABRICS = (__ENV.FABRICS || "11110007,11110011,11110012").split(",");
const RPS = Number(__ENV.RPS || 1000);
const DURATION = __ENV.DURATION || "60s";
const MAX_VUS = Number(__ENV.MAX_VUS || 5000);

export const apiFailures = new Rate("ipanel_1000rps_noabort_failures");

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    constant_rps: {
      executor: "constant-arrival-rate",
      rate: RPS,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 1000,
      maxVUs: MAX_VUS,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.20"],
    ipanel_1000rps_noabort_failures: ["rate<0.20"],
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

export function setup() {
  const login = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { "Content-Type": "application/json", accept: "application/json" } },
  );
  check(login, {
    "login ok": (r) => r.status === 200,
    "token exists": (r) => !!r.json("access_token"),
  });
  return { token: login.json("access_token") };
}

export default function (data) {
  const token = data.token;
  const fabric = FABRICS[__ITER % FABRICS.length].trim();
  const kind = __ITER % 5;
  let res;

  if (kind === 0) {
    res = http.get(`${BASE_URL}/api/panels/theme_id/${fabric}`, authHeaders(token));
  } else if (kind === 1) {
    res = http.post(
      `${BASE_URL}/api/parse/batch`,
      JSON.stringify({
        widgets: ["weather", "news", "traffic", "rates", "metals"],
        include_media: true,
        panel_ids: [fabric],
      }),
      postHeaders(token),
    );
  } else if (kind === 2) {
    res = http.get(`${BASE_URL}/api/parse/rates`, authHeaders(token));
  } else if (kind === 3) {
    res = http.get(`${BASE_URL}/api/parse/traffic`, authHeaders(token));
  } else {
    res = http.get(`${BASE_URL}/api/panels/get_all_panels`, authHeaders(token));
  }

  const ok = res.status >= 200 && res.status < 400;
  apiFailures.add(!ok);
  check(res, { "status ok": () => ok });
}
