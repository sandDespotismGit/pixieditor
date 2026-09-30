#!/usr/bin/env bash
set -euo pipefail

pm2 ls
echo "__PROM_TARGETS__"
curl -s 'http://127.0.0.1:9091/api/v1/query?query=up' > /tmp/prom_up.json
python3 - <<'PY'
import json
d = json.load(open('/tmp/prom_up.json'))
for row in d['data']['result']:
    print(row['metric'].get('job'), row['metric'].get('instance'), row['value'][1])
PY

echo "__SERVER__"
uptime
free -h
df -h /

echo "__SUMMARY__"
python3 - <<'PY'
import json
p = '/root/ipanel_observability/results/panel200-summary.json'
d = json.load(open(p))
for key in [
    'http_reqs',
    'http_req_failed',
    'http_req_duration',
    'checks',
    'iterations',
    'ipanel_panel_polls',
    'ipanel_panel_failures',
    'ipanel_panel_theme_latency',
    'ipanel_panel_batch_latency',
]:
    metric = d['metrics'].get(key, {})
    print(key, metric.get('values', {}))
PY
