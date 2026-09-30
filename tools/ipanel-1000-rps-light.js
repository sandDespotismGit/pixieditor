import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://admin.i-panel.pro:8787";
const PATH = __ENV.PATH || "/metrics";
const RPS = Number(__ENV.RPS || 1000);
const DURATION = __ENV.DURATION || "60s";

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    rps_1000: {
      executor: "constant-arrival-rate",
      rate: RPS,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 1200,
      maxVUs: 3000,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}${PATH}`, { headers: { accept: "text/plain,application/json,*/*" } });
  check(res, { "status ok": (r) => r.status >= 200 && r.status < 400 });
}
