#!/usr/bin/env bash
set -euo pipefail

echo "__PROM_QUERIES__"
curl -Gs 'http://127.0.0.1:9091/api/v1/query' --data-urlencode 'query=max_over_time(process_resident_memory_bytes{job="ipanel_fastapi_metrics"}[10m])'
echo
curl -Gs 'http://127.0.0.1:9091/api/v1/query' --data-urlencode 'query=max_over_time(rate(process_cpu_seconds_total{job="ipanel_fastapi_metrics"}[1m])[10m:])'
echo
curl -Gs 'http://127.0.0.1:9091/api/v1/query' --data-urlencode 'query=avg_over_time(up{job="ipanel_fastapi_metrics"}[10m])'
echo
echo "__PM2_LOGS__"
pm2 logs backend_main --lines 20 --nostream
