# Resultados de Performance Testing — Clase 9

**API:** `http://localhost:3001`  
**Herramienta:** k6  
**Script:** `performance/scenarios/api-load.k6.js`

---

## Parte 2 — Load Test

### Configuración ejecutada
```
k6 run --env BASE_URL=http://localhost:3001 --env SCENARIO=load performance/scenarios/api-load.k6.js
```
Stages: 30s ramp-up a 50 VUs → 1 min sostenido → 30s ramp-down.

### Métricas obtenidas

| Métrica                   | Valor                               |
|---------------------------|-------------------------------------|
| http_req_duration p95     | 12.57 ms |
| http_req_duration p99     | 19.08 ms |
| error_rate                | 0.00 %   |
| list_duration p95         | 12.03 ms |
| tasks_list_duration p95   | 13.08 ms |
| http_reqs/s (throughput)  | 57.08 req/s |
| VUs máx                   | 50          |

### ¿Thresholds superados?
- [x] http_req_duration p95 < 500 ms: **PASS** (12.57 ms)
- [x] http_req_duration p99 < 1000 ms: **PASS** (19.08 ms)
- [x] error_rate < 1%: **PASS** (0.00%)
- [x] list_duration p95 < 400 ms: **PASS** (12.03 ms)
- [x] tasks_list_duration p95 < 400 ms: **PASS** (13.08 ms)

---

## Parte 3 — Spike Test

### Configuración ejecutada
```
k6 run --env BASE_URL=http://localhost:3001 --env SCENARIO=spike performance/scenarios/api-load.k6.js
```
Stages: 10s ramp-up a 200 VUs → 30s sostenido → 10s ramp-down.

### Métricas obtenidas

| Métrica                   | Valor                               |
|---------------------------|-------------------------------------|
| http_req_duration p95     | 25.87 ms    |
| http_req_duration p99     | 42.42 ms    |
| error_rate                | 0.00 %      |
| list_duration p95         | 21.72 ms    |
| tasks_list_duration p95   | 29.90 ms    |
| http_reqs/s (throughput)  | 239.71 req/s |
| VUs máx                   | 200          |

---

## Comparación Load vs Spike

| Métrica                  | Load Test                | Spike Test               | Diferencia             |
|--------------------------|--------------------------|--------------------------|------------------------|
| http_req_duration p95    | 12.57 ms    | 25.87 ms    | +13.30 ms (+105.8%) |
| http_req_duration p99    | 19.08 ms    | 42.42 ms    | +23.34 ms (+122.3%) |
| error_rate               | 0.00 %      | 0.00 %      | 0 pp                |
| list_duration p95        | 12.03 ms    | 21.72 ms    | +9.69 ms (+80.6%)   |
| tasks_list_duration p95  | 13.08 ms    | 29.90 ms    | +16.82 ms (+128.6%) |
| throughput (http_reqs/s) | 57.08 req/s | 239.71 req/s | +182.63 req/s       |

---