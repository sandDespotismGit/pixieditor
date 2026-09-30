const DEFAULT_BASE_URL = "https://admin.i-panel.pro:8787";
const BATCH_DELAY_MS = 650;
const REQUEST_TIMEOUT_MS = 12000;

const states = new Map();

const FALLBACK_ENDPOINTS = {
  news: "/api/parse/news",
  weather: "/api/parse/get_weather",
  metals: "/api/parse/metals",
  traffic: "/api/parse/traffic",
};

function normalizeBaseUrl(baseUrl = DEFAULT_BASE_URL) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function getState(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!states.has(normalizedBaseUrl)) {
    states.set(normalizedBaseUrl, {
      baseUrl: normalizedBaseUrl,
      timer: null,
      requests: [],
      kinds: new Set(),
      panelIds: new Set(),
    });
  }
  return states.get(normalizedBaseUrl);
}

async function fetchJsonWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchFallback(kind, baseUrl, panelId) {
  if (kind === "media") {
    if (!panelId) return [];
    return fetchJsonWithTimeout(`${baseUrl}/api/new_file/${panelId}`, {
      headers: { accept: "application/json" },
    });
  }

  if (kind === "rates") {
    return fetchJsonWithTimeout("https://www.cbr-xml-daily.ru/daily_json.js");
  }

  const endpoint = FALLBACK_ENDPOINTS[kind];
  if (!endpoint) return null;
  return fetchJsonWithTimeout(`${baseUrl}${endpoint}`, {
    headers: { accept: "application/json" },
  });
}

function resolveBatchValue(kind, result, panelId) {
  if (kind === "media") {
    const mediaByPanel = result?.media_by_panel_id || {};
    return mediaByPanel[String(panelId)] || result?.media || result?.files || [];
  }
  return result?.[kind];
}

async function flushState(state) {
  state.timer = null;

  const requests = state.requests.splice(0);
  const kinds = Array.from(state.kinds);
  const panelIds = Array.from(state.panelIds);
  state.kinds.clear();
  state.panelIds.clear();

  let result = null;
  try {
    result = await fetchJsonWithTimeout(`${state.baseUrl}/api/parse/batch`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        widgets: kinds.filter((kind) => kind !== "media"),
        include_media: kinds.includes("media"),
        panel_ids: panelIds,
      }),
    });
  } catch (error) {
    result = null;
  }

  await Promise.all(
    requests.map(async (request) => {
      try {
        let value = result
          ? resolveBatchValue(request.kind, result, request.panelId)
          : undefined;

        if (value === undefined || value === null) {
          value = await fetchFallback(
            request.kind,
            state.baseUrl,
            request.panelId,
          );
        }

        request.resolve(value);
      } catch (error) {
        request.reject(error);
      }
    }),
  );
}

export function requestWidgetData(kind, options = {}) {
  const state = getState(options.baseUrl);

  return new Promise((resolve, reject) => {
    state.requests.push({
      kind,
      panelId: options.panelId,
      resolve,
      reject,
    });
    state.kinds.add(kind);
    if (options.panelId) state.panelIds.add(Number(options.panelId));

    if (!state.timer) {
      state.timer = setTimeout(() => flushState(state), BATCH_DELAY_MS);
    }
  });
}
