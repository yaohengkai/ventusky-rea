# Ventusky Local Data API 参考

本地 API 基址：

```text
http://localhost:8787/__api
```

所有接口返回 `application/json; charset=utf-8`（`/__api/tile` 除外，它返回图片）。  
所有时间参数都使用 **UTC ISO 8601**，例如 `2026-10-21T15:00:00Z`。

> 文档中的 `2026-10-21` 是抓取日的示例。实际使用时请用 `/__api/times` 或当前时间；超出模型有效范围会 404。

---

## 0. 快速索引

| 接口 | 作用 |
|---|---|
| `GET /__api/catalog` | 完整模型/图层目录 |
| `GET /__api/models` | 模型列表 |
| `GET /__api/models/{id}` | 单个模型 |
| `GET /__api/layers` | 图层列表 |
| `GET /__api/layers/{id}` | 单个图层 |
| `GET /__api/times` | 生成有效时间序列 |
| `GET /__api/tile-url` | 生成栅格图片 URL（不下载） |
| `GET /__api/tile` | 下载/代理栅格图片 |
| `GET /__api/point` | 坐标点预报（24 小时 + 8 天 + 海洋图表） |
| `GET /__api/water` | 海洋波浪/潮汐图表数据 |
| `GET /__api/pressure` | 高低压中心 |
| `GET /__api/fronts` | 锋面 |
| `GET /__api/isolines` | 等值线 |
| `GET /__api/cyclones` | 气旋/飓风 |
| `GET /__api/fires` | 火点 |
| `GET /__api/webcams` | 附近摄像头 |
| `GET /__api/aqi` | 当前空气质量 |
| `GET /__api/search` | 地点搜索 |
| `GET /__api/location` | 坐标附近的城市/地点 |
| `GET /__api/docs` | 机器可读的接口清单 |

---

## 1. 目录接口

### `GET /__api/catalog`

返回完整目录，结构：

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-21T15:xx:xx.xxxZ",
  "source": "https://www.ventusky.com/ ...",
  "hosts": { "site": "...", "static": "...", "data": "...", "archive": "..." },
  "modelOrder": ["gfs", "gem", "..."],
  "publicModels": ["icon", "gfs", "..."],
  "groups": ["temperature", "feel", "..."],
  "models": {
    "icon": {
      "id": "icon",
      "name": "ICON",
      "uiName": "ICON",
      "public": true,
      "kind": "weather",
      "source": ["DWD"],
      "resolution": "13 km",
      "intervalMinutes": 180,
      "horizonHours": 360,
      "timelineStart": "2018-01-01T00:00:00.000Z",
      "timelineEnd": "2026-10-28T12:00:00.000Z",
      "updated": "2026-10-21T06:00:00.000Z",
      "raster": {
        "width": 2880, "height": 1441,
        "tileWidth": 512, "tileHeight": 512,
        "cols": 6, "rows": 3,
        "extent": { "lon": [-180, 180], "lat": [-90, 90] },
        "minZoomForTiles": 5,
        "layout": "equirectangular"
      },
      "layers": ["clouds-fog", "..."]
    }
  },
  "layers": {
    "temperature-2m": {
      "id": "temperature-2m",
      "group": "temperature",
      "groupLabel": "Temperature",
      "name": "Temperature at 2 m",
      "unit": "°C",
      "domain": "Atmosphere",
      "kind": "scalar",
      "fields": ["teplota_2_m"],
      "models": [
        {
          "model": "icon",
          "modelDir": "icon",
          "cacheFrom": "icon",
          "intervalMinutes": 180,
          "horizonHours": 360,
          "validFrom": "2018-01-01T00:00:00.000Z",
          "validTo": "2026-10-28T12:00:00.000Z",
          "updated": "2026-10-21T06:00:00.000Z",
          "minuteResolution": false,
          "minuteFolder": false
        }
      ]
    }
  }
}
```

### `GET /__api/models` / `/__api/models/{id}`

返回模型数组或单个模型对象。适合生成模型下拉框。

### `GET /__api/layers` / `/__api/layers/{id}`

返回图层数组或单个图层对象。`models` 数组是该图层在所有模型中的可用性。

---

## 2. 时间接口

### `GET /__api/times?model=icon&layer=temperature-2m&from=&to=&limit=500`

按图层的时间步长生成 UTC 时间序列。

| 参数 | 必填 | 说明 |
|---|---|---|
| `model` | 是 | 模型 ID |
| `layer` | 是 | 图层 ID |
| `from` | 否 | 起始时间，默认图层 `validFrom` |
| `to` | 否 | 结束时间，默认图层 `validTo` |
| `limit` | 否 | 最多返回多少个，默认 500 |

示例：

```bash
curl 'http://localhost:8787/__api/times?model=hrrr&layer=temperature-2m&from=2026-10-21T00:00:00Z&limit=6'
```

```json
{
  "model": "hrrr",
  "layer": "temperature-2m",
  "intervalMinutes": 60,
  "from": "2026-10-21T00:00:00.000Z",
  "to": "2026-10-23T12:00:00.000Z",
  "times": [
    "2026-10-21T00:00:00.000Z",
    "2026-10-21T01:00:00.000Z"
  ],
  "truncated": false
}
```

> 时间序列是按“整点/整 5 分钟/整 10 分钟”对齐的。雷达、卫星可能要求分钟值，例如 `15:15`、`15:20`。

---

## 3. 栅格图片接口

### `GET /__api/tile-url`

只生成 URL，不下载图片。适合批量抓取、写入数据库或二次处理。

| 参数 | 必填 | 说明 |
|---|---|---|
| `model` | 是 | 模型 ID |
| `layer` | 是 | 图层 ID |
| `time` | 否 | UTC 时间，默认当前时间附近 |
| `tileX` / `tileY` | 否 | 分块索引；指定后使用 `tilled_world` |
| `zoom` | 否 | 当 `zoom >= models[].raster.minZoomForTiles` 时使用分块 |
| `host` | 否 | `data` 或 `archive`；默认按 72 小时规则自动选择 |
| `aux` | 否 | `1` 时额外返回降水类型等辅助字段 |

示例：

```bash
curl 'http://localhost:8787/__api/tile-url?model=icon&layer=wind-10m&time=2026-10-21T15:00:00Z'
```

```json
{
  "urls": [
    "https://data.ventusky.com/2026/10/21/icon/whole_world/hour_15/icon_vitr_u_10_m_20261021_15.jpg?17925624",
    "https://data.ventusky.com/2026/10/21/icon/whole_world/hour_15/icon_vitr_v_10_m_20261021_15.jpg?17925624"
  ],
  "primary": "...",
  "model": "icon",
  "layer": "wind-10m",
  "modelDir": "icon",
  "fields": ["vitr_u_10_m", "vitr_v_10_m"],
  "tiled": false,
  "tile": null,
  "archive": false,
  "cache": "17925624",
  "host": "data.ventusky.com",
  "raster": { "width": 2880, "height": 1441, "...": "..." },
  "validFrom": "2018-01-01T00:00:00.000Z",
  "validTo": "2026-10-28T12:00:00.000Z",
  "intervalMinutes": 180
}
```

分块示例：

```bash
curl 'http://localhost:8787/__api/tile-url?model=icon&layer=temperature-2m&time=2026-10-21T15:00:00Z&zoom=6&tileX=2&tileY=1'
```

### `GET /__api/tile`

下载图片并原样返回。参数与 `tile-url` 相同，额外支持：

| 参数 | 说明 |
|---|---|
| `index` | 取 `urls[index]`，默认 0；风/洋流为 0=u、1=v；海浪为 0=高度、1=方向 |

```bash
curl -o wind_u.jpg 'http://localhost:8787/__api/tile?model=icon&layer=wind-10m&time=2026-10-21T15:00:00Z&index=0'
curl -o wind_v.jpg 'http://localhost:8787/__api/tile?model=icon&layer=wind-10m&time=2026-10-21T15:00:00Z&index=1'
```

响应头包含 `x-ventusky-source`，指向真正的上游图片。  
这个接口会加 `Access-Control-Allow-Origin: *`，方便在 canvas/前端里读取。

### 3.1 上游 URL 模板（进阶）

```text
https://{data|archive}.ventusky.com/{yyyy}/{MM}/{dd}/{modelDir}/{whole_world|tilled_world}/hour_{HH}{minuteFolder}/{modelDir}_{field}{tilePart}_{yyyyMMdd_HH[mm]}.jpg?{cache}
```

- `modelDir`：通常是模型 ID；海浪为 `icon_eu_water`、`mfwam_water` 等；ECMWF 高空可能是 `ecmwf_mres`。
- `whole_world`：整张等经纬度图；`tilled_world`：同一张图按固定块切开。
- `minuteFolder`：卫星为 `/{mm}`；雷达没有目录。
- `tilePart`：`_{tileX}_{tileY}`，仅分块时有。
- `cache`：模型更新时间（秒，去掉末尾 0）。
- 早于 72 小时的数据用 `archive.ventusky.com`。

### 3.2 分块规则

`tilled_world` 不是 Web Mercator 的 XYZ 瓦片，而是模型栅格的固定分块：

```text
tileX = floor(px / tileWidth)
tileY = floor(py / tileHeight)
cols   = ceil(width  / tileWidth)
rows   = ceil(height / tileHeight)
```

`tileX` 范围 `0..cols-1`，`tileY` 范围 `0..rows-1`。例如 ICON 是 2880×1441、512 一块，所以是 6×3 块。

---

## 4. 点预报接口

### `GET /__api/point?lat=&lon=&lang=en&water=1`

这是最实用的“某点天气”接口。它抓取 Ventusky 坐标页的 AJAX 片段并结构化。

| 参数 | 必填 | 说明 |
|---|---|---|
| `lat` | 是 | 纬度 -90..90 |
| `lon` | 是 | 经度 -180..180 |
| `lang` | 否 | 语言，默认 `en` |
| `water` | 否 | `1`（默认）同时抓海洋图表；`0` 不抓 |

示例：

```bash
curl 'http://localhost:8787/__api/point?lat=35&lon=-140&water=1' | jq
```

返回结构：

```json
{
  "location": "35°0'N, 140°0'W",
  "coordinates": { "lat": 35, "lon": -140 },
  "altitude": 0,
  "timezone": { "name": null, "utcOffset": -9 },
  "units": { "t": "°C", "ws": "mm", "sd": "cm", "s": "km/h" },
  "days": [
    {
      "key": "d_1",
      "date": "2026/10/22",
      "slots": [
        {
          "localTime": "01:00",
          "weatherCode": -3,
          "weather": "partly cloudy",
          "night": true,
          "temperature": 21,
          "precipitation": 0,
          "precipitationProbability": 50,
          "windSpeed": 21,
          "windGust": 29,
          "windDirectionDeg": 0,
          "windDirection": "N",
          "temperatureClass": "temp20"
        }
      ]
    }
  ],
  "hourly24": [
    {
      "time": "07:00",
      "date": "2026-10-21",
      "weather": "clear sky",
      "temperature": 19,
      "precipitation": 0,
      "precipitationProbability": 0,
      "windDirection": "N",
      "windDirectionDeg": 0,
      "windSpeed": 20
    }
  ],
  "waterUrl": "https://www.ventusky.com/aside/forecast/ajax/chart_water.ajax.php?...",
  "aqiUrl": "https://www.ventusky.com/aside/forecast/ajax/chart_aqi.ajax.php?...",
  "water": { "series": { "wh": {}, "sh": {}, "ti": {} } }
}
```

### 4.1 `days[]` 字段

`days` 来自页面里的 `<custom-forecast data-forecast='...'>`，固定 8 天 × 8 个时次（当地时间的 01、04、07、10、13、16、19、22 点）。

| 字段 | 含义 |
|---|---|
| `date` | 当地日期，来自 `#date_selector` |
| `slots[].localTime` | 当地时次 |
| `weatherCode` | 天气代码；负数表示夜间版本，取绝对值查 `weatherCodes` |
| `weather` | 天气描述 |
| `temperature` | 2 米温度（单位见 `units.t`） |
| `precipitation` | 降水量（`units.ws`） |
| `precipitationProbability` | 降水概率 % |
| `windSpeed` / `windGust` | 风速/阵风（`units.s`） |
| `windDirectionDeg` / `windDirection` | 风向角度/英文方位 |
| `temperatureClass` | 前端温度色阶 class，可忽略 |

### 4.2 `hourly24[]` 字段

`hourly24` 来自 `#forecast_24` 表格，是未来 25 个小时的逐小时数据（含当前小时）：

| 字段 | 含义 |
|---|---|
| `time` / `date` | 当地时间/日期 |
| `weather` | 天气描述（来自图标 `alt`） |
| `temperature` | 温度 |
| `precipitation` / `precipitationProbability` | 降水量/概率 |
| `windDirection` / `windDirectionDeg` | 风向 |
| `windSpeed` | 风速 |

> 表格的时间是地点本地时间；`date` 通过“明天”标记和 `d_1` 日期推算。

### 4.3 上游页面

```text
https://www.ventusky.com/{lat};{lon}?ajax
```

例如：

```text
https://www.ventusky.com/35;-140?ajax
```

页面同时包含 `data-water`、`data-aqi`、`data-astro` 等地址，本地 API 只解析了前两个。

---

## 5. 海洋图表接口

### `GET /__api/water?lat=&lon=` 或 `?url=`

直接抓取 `chart_water.ajax.php` 并解析 `data-link`。

```bash
curl 'http://localhost:8787/__api/water?lat=35&lon=-140'
```

返回：

```json
{
  "url": "https://www.ventusky.com/aside/forecast/ajax/chart_water.ajax.php?...",
  "series": {
    "wh": {
      "type": "wh",
      "label": "Significant wave height",
      "unit": "m",
      "startTime": "2026-10-21T09:00:00.000Z",
      "segments": [[3.3, 3.1, 3.1, "..."]],
      "segmentCount": 3,
      "valuesPerSegment": [232, 232, 232]
    },
    "sh": { "label": "Swell", "unit": "m", "...": "..." },
    "ti": { "label": "Tide (MLLW)", "unit": "m", "...": "..." }
  },
  "segmentCount": 3,
  "startTime": "2026-10-21T09:00:00.000Z"
}
```

- `wh`：有效波高
- `sh`：涌浪高度
- `ti`：潮位（MLLW）
- `data` 用 `:` 分成 3 段，每段用 `;` 分隔数值；`segments` 保留原始分段，避免错误地假设“每段就是一天”。
- 时间步长约为 1 小时（3 小时值重复），共约 10 天。

---

## 6. 气象 JSON 接口

### `GET /__api/pressure?model=&layer=pressure&time=`

```bash
curl 'http://localhost:8787/__api/pressure?model=icon&layer=pressure&time=2026-10-21T15:00:00Z'
```

```json
{
  "source": "https://data.ventusky.com/.../icon_pressure_low_high_20261021_15.json?17925624",
  "archive": false,
  "data": {
    "l": [[33.12, -64.62, 952], [-145.37, -54.62, 954]],
    "h": [[-20.25, -76.5, 981]]
  }
}
```

数组元素是 `[lat, lon, hPa]`。

### `GET /__api/fronts?model=&layer=pressure&time=`

```json
{
  "data": {
    "fronts": [
      {
        "type": "warm",
        "direction": "right",
        "points": [[-7809, 6979], [-7884, 7039]]
      }
    ]
  }
}
```

`points` 是 `[lon * 100, lat * 100]`。

### `GET /__api/isolines?model=&layer=pressure&time=`

```json
{
  "data": [
    { "t": 954, "y": [-6389, 1, -39], "x": [3175, 186, 125] }
  ]
}
```

`t` 是等值线数值；`x/y` 是 `lon/lat * 100`。

---

## 7. 其他数据接口

### 7.1 气旋/飓风

```bash
curl 'http://localhost:8787/__api/cyclones'
```

原始结构：

```json
{
  "cyclones": {
    "icon": [
      {
        "name": "Agueda",
        "id": "sh0227",
        "lat": [-4.625, -4.875],
        "lon": [53.375, 53.375],
        "times": [1792400400, 133200],
        "cstart": 4,
        "clats": [-584, -2]
      }
    ]
  }
}
```

不同模型的字段可能略有差异；建议按原始 JSON 使用。

### 7.2 火点

```bash
curl 'http://localhost:8787/__api/fires?z=5&x=5&y=12'
```

- `z` 最大按 6 处理；`z>6` 时会把 `x/y` 除以 `2^(z-6)`。
- 返回 `{lat:[], lon:[], ...}`（不同缩放级别字段不同）。

### 7.3 附近摄像头

```bash
curl 'http://localhost:8787/__api/webcams?lat=34.05&lon=-118.25&count=4'
```

```json
{
  "data": [
    {
      "title": "Mount Washington East",
      "id": 145024060,
      "lat": 34.1058,
      "lon": -118.208,
      "source": "roccofantastic.com",
      "q": 1,
      "distance": 7.307
    }
  ]
}
```

### 7.4 空气质量

```bash
curl 'http://localhost:8787/__api/aqi?lat=34.05&lon=-118.25'
```

返回 WAQI 原始 JSON（`status`, `data.aqi`, `data.iaqi`, `data.time` 等）。  
WAQI token 可在环境变量 `WAQI_TOKEN` 中替换；默认值是网页公开 token，仅用于学习。

### 7.5 坐标附近地点

```bash
curl 'http://localhost:8787/__api/location?lat=34.05&lon=-118.25&zoom=5'
```

返回数组，元素包含 `name`、`url`、`distance`、`lat`、`lon`、`id`。坐标在海上时可能返回 `[]`。

### 7.6 地点搜索

```bash
curl 'http://localhost:8787/__api/search?q=London&lang=en'
```

返回数组，元素包含 `lat`、`lon`、`altitude`、`type`、`address`。

---

## 8. 直接用上游接口

如果你不想经过本地 API，也可以直接请求：

| 数据 | 上游 |
|---|---|
| 坐标点预报 | `https://www.ventusky.com/{lat};{lon}?ajax` |
| 地点搜索 | `https://www.ventusky.com/ventusky_mesta.php?q={q}&lang={lang}` |
| 附近城市 | `https://www.ventusky.com/ventusky_location.json.php?lat={lat}&lon={lon}&zoom={zoom}` |
| 图片 | `https://data.ventusky.com/...` / `https://archive.ventusky.com/...` |
| 高低压 | `.../{model}_pressure_low_high_{stamp}.json` |
| 锋面 | `.../{model}_fronts_{stamp}.json` |
| 等值线 | `.../{model}_iso_{field}_{stamp}.json` |
| 气旋 | `https://data.ventusky.com/cyclones/actual.json` |
| 火点 | `https://data.ventusky.com/fires/{z}/{x}_{y}.json` |
| 摄像头 | `https://webcams.ventusky.com/api/api.get_nearest_camera.php?lat=&lon=&count=` |
| AQI | `https://api.waqi.info/feed/geo:{lat};{lon}/?token=...` |

请求时建议带：

```text
User-Agent: Mozilla/5.0 ...
Referer: https://www.ventusky.com/
Accept-Language: en-US,en;q=0.9
```

---

## 9. 错误与限制

| HTTP | 含义 |
|---|---|
| 400 | 参数缺失/模型不支持该图层/坐标越界 |
| 404 | 未知模型、图层或端点 |
| 502 | 上游请求失败（Cloudflare、超时、404 占位图等） |

- 上游可能限流；批量抓取时请降低并发（建议 ≤ 4）并加本地缓存。
- 图片瓦片是预上色 JPG，不包含原始数值。
- 早于 72 小时的数据走 `archive`，不是所有模型都有归档。
- 付费图层/更长时间范围仍受官方账号权限限制；本项目不绕过。
- 请勿把本项目或抓取到的数据用于商业用途或再分发。

---

## 10. 代码片段

### curl

```bash
BASE=http://localhost:8787/__api
curl "$BASE/models" | jq '.[].id'
curl "$BASE/point?lat=50.08&lon=14.42&water=1" | jq '.days[0].slots[0]'
curl -o tile.jpg "$BASE/tile?model=icon&layer=temperature-2m&time=2026-10-21T15:00:00Z"
```

### Node.js

```js
const base = 'http://localhost:8787/__api';
const r = await fetch(`${base}/tile-url?model=icon&layer=wind-10m&time=2026-10-21T15:00:00Z`);
const { urls } = await r.json();
for (const url of urls) {
  const img = await fetch(url);
  console.log(url, img.headers.get('content-type'));
}
```

### Python

```python
# pip install requests
import requests
base = "http://localhost:8787/__api"
r = requests.get(f"{base}/point", params={"lat": 35, "lon": -140, "water": 1}, timeout=30)
data = r.json()
print(data["days"][0]["slots"][0])
print(data["water"]["series"]["wh"]["segments"][0][:5])
```
