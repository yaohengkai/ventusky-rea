# 逆向笔记：Ventusky 网页与数据接口

本文记录“怎么从网页走到 41 个模型 / 88 个图层 / 完整接口”的过程，方便官网改版后复现。

> 工具：[morluto/rea](https://github.com/morluto/rea)（REA）  
> 目标：<https://www.ventusky.com/>  
> 抓取日期：2026-10-21  
> 目的：个人学习、互操作性验证；不涉及商业使用。

---

## 1. 准备

```bash
git clone --depth 1 https://github.com/morluto/rea.git
cd rea
npx -y rea-agents@latest --version    # 6.7.0
```

阅读 REA 的：

- `docs/browser-observation.md`：CDP 页面观察
- `.agents/skills/reverse-engineer-anything/SKILL.md`：目标路由/证据要求
- `docs/javascript-application-workflows.md`：JS 静态分析

启动一个独立的 Brave/Chrome 调试实例：

```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  --headless=new --remote-debugging-port=9222 \
  --user-data-dir=/tmp/rea-vk-profile \
  https://www.ventusky.com/
```

```bash
npx -y rea-agents@latest list-browser-targets http://127.0.0.1:9222 \
  --allowed-origins https://www.ventusky.com --json
```

拿到 `TARGET_ID` 后：

```bash
npx -y rea-agents@latest inspect-web-page http://127.0.0.1:9222 <TARGET_ID> \
  --observation-ms 2000 --json > evidence/rea-inspect.json

npx -y rea-agents@latest analyze-web-bundle http://127.0.0.1:9222 <TARGET_ID> \
  --json > evidence/rea-bundle.json
```

证据文件：

- `evidence/rea-targets.json`：浏览器/页面目标
- `evidence/rea-inspect.json`：DOM、网络、资源、脚本等
- `evidence/rea-bundle.json`：静态 bundle 分析（只覆盖内联脚本）
- `evidence/network-sweep.json`：逐图层切换时抓到的真实图片请求

REA 的 `inspect-web-page` 有 policy filter；`analyze-web-bundle` 只抓到了内联 `MapOptions`（约 8 KB），没有把外部主脚本纳入分析。因此还需要下面两条证据链。

---

## 2. 第一层：内联配置 `MapOptions`

首页 HTML 的 `<script>` 里直接有：

```js
var MapOptions = {
  "root": "https://www.ventusky.com/",
  "lang": "en",
  "lat": 34.0726,
  "lon": -118.261,
  "zoom": 5,
  "model": "auto",
  "now": Date.UTC(2026, 9, 21, 14, 59),
  "camTilesUpdated": 1791911487,

  "gfsTimelineStart": Date.UTC(2018, 0, 1, 0),
  "gfsTimelineEnd": Date.UTC(2026, 10, 4, 6),
  "gfsUpdated": Date.UTC(2026, 9, 21, 6, 0),
  ...
  "rtofsTimelineStart": Date.UTC(2021, 5, 28, 0),
  "rtofsTimelineEnd": Date.UTC(2026, 9, 28, 0),
  "rtofsUpdated": Date.UTC(2026, 9, 20, 0, 0),
  ...
  "hurricanesUpdated": Date.UTC(2026, 9, 21, 14, 40),
  "firesUpdated": Date.UTC(2026, 9, 21, 15, 14)
};
```

用途：

- 每个模型的 `TimelineStart/TimelineEnd/Updated/AccumulationStart`
- 默认坐标、缩放、当前时间
- 气旋/火点/摄像头瓦片的缓存时间

这些字段直接进了 `data/catalog.json` 的 `models[].timelineStart/timelineEnd/updated`。

---

## 3. 第二层：主脚本 `script-en.js`

首页引用：

```text
https://static.ventusky.com/media/script-en.js?1791624780
```

大小约 377 KB。下载后格式化，搜索关键字：

```bash
curl -sS --compressed -o script-en.js \
  'https://static.ventusky.com/media/script-en.js?1791624780'

npx prettier script-en.js > script-en.pretty.js
```

### 3.1 模型表 `T`

搜索 `T = {`，可以看到 41 个模型：

```js
T = {
  gfs: { name:"GFS", start:p.gfsTimelineStart, end:p.gfsTimelineEnd, J:p.gfsUpdated,
         N:360, source:["NOAA"], size:ma, c:180,
         K:{ "temperature-2m":{}, "wind-10m":{}, ... } },
  icon: { ... },
  rtofs: { name:"RTOFS", start:p.rtofsTimelineStart, ..., N:1440, c:360,
           size:{ width:2250, height:1649, fc:"14 km", Ba:5, wg:89.9, Cg:-78.6 },
           K:{ "temperature-water":{}, currents:{} } },
  smoc: { ..., K:{ "tide-currents":{}, currents:{} } },
  stofs: { ..., K:{ "tide-surge":{}, tide:{} } },
  mfwam: { ..., K:{ wave:{yg:"mfwam_water"}, ... } },
  ...
};
```

关键字段：

| 字段 | 含义 |
|---|---|
| `name` | 显示名 |
| `start/end` | 有效时间范围（ms） |
| `J` | 更新时间（ms） |
| `N` | 预报时效（小时） |
| `c` | 时间步长（分钟） |
| `size` | 栅格尺寸、分辨率、分块、区域范围 |
| `K` | 该模型支持的图层 |
| `K[layer].yg` | 实际文件名前缀（如 `icon_eu_water`） |
| `K[layer].size` | 该图层的特殊栅格尺寸 |
| `K[layer].c` | 该图层的特殊时间步长 |
| `K[layer].rj` | 亚小时级（雷达/卫星） |
| `K[layer].Pl` | 分钟作为目录（卫星） |

`size` 的字段：

| 字段 | 含义 |
|---|---|
| `width/height` | 整张栅格像素 |
| `la/ha` | 全球版尺寸（部分模型） |
| `uh/sh` | 分块尺寸，默认 512 |
| `Ba` | 开始使用分块的 zoom |
| `Ig/Hg` | 经度范围 |
| `Cg/wg` | 纬度范围 |
| `fc` | 分辨率文字 |
| `ph` | 海岸线/遮罩压缩字符串（本地未使用） |

### 3.2 图层表 `wa`

搜索 `wa = [`，14 个组、88 个选项：

```js
wa = [
  { id:"temperature", kind:"altitude", o:[
      { id:"temperature-water", file:"teplota_voda", H:"currents", label:"sea-surface" },
      { id:"temperature-2m", file:"teplota_2_m", label:"2m" },
      ...
  ]},
  { id:"rain", kind:"accumulation", o:[
      { id:"rain-1h", file:"srazky_1h", $j:{typed:["srazky_1h","srazky_type_1h"]} },
      ...
  ]},
  { id:"wind", kind:"altitude", o:[
      { id:"wind-10m", file:["vitr_u_10_m","vitr_v_10_m"], H:"10m" },
      ...
  ]},
  { id:"sea", kind:"sea", o:[
      { id:"wave", file:"swh", H:"wave-total" },
      { id:"wind-wave", file:"shww", H:"wave-wind" },
      { id:"swell", file:"shts", H:"wave-swell" },
      { id:"currents", file:["proud_u","proud_v"], H:"currents" },
      ...
  ]},
  ...
];
```

`file` 就是 URL 里的字段名；数组表示 u/v 两张图。

### 3.3 渲染表 `Va`

`Va` 把图层高度/类型映射到实际字段：

```js
Va = {
  "10m": { kind:"wind", yh:2, Ch:"vitr_u_10_m", bh:"vitr_v_10_m" },
  currents: { kind:"currents", yh:1, Ch:"proud_u", bh:"proud_v" },
  "tide-currents": { kind:"currents", yh:1, Ch:"tide_proud_u", bh:"tide_proud_v" },
  "wave-total": { kind:"wave", height:"shww", direction:"mdww", threshold:1,
                  D:{ height:"shts", direction:"mdts", threshold:2 } },
  "wave-wind": { kind:"wave", height:"shww", direction:"mdww", threshold:1 },
  "wave-swell": { kind:"wave", height:"shts", direction:"mdts", threshold:2 },
};
```

注意：`Va["wave-total"]` 的 `shww` 是前端做“总浪高+涌浪叠加”动画时用的；实际“有效波高”图层 URL 用 `wa` 的 `file: "swh"`。本地 `catalog.json` 以 `wa.file` 为主，并补充 `mdww` 方向字段。

### 3.4 URL 模板

主脚本里搜索 `data.ventusky.com`，找到：

```js
"https://data.ventusky.com/{time:yyyy/MM/dd}/{model}/whole_world/hour_{time:HH}{minutesFolder}/{model}_{layer}_{time:yyyyMMdd_HH}{minutes}.jpg?{cache}"
```

以及：

```js
"https://data.ventusky.com/{time:yyyy/MM/dd}/{model}/tilled_world/hour_{time:HH}{minutesFolder}/{model}_{layer}_{tileX}_{tileY}_{time:yyyyMMdd_HH}{minutes}.jpg?{cache}"
```

归档：

```js
a > Pa
  ? "https://data.ventusky.com/..."
  : "https://data.ventusky.com/...".replace("//data.ventusky.com/", "//archive.ventusky.com/")
```

`Pa = p.now - 2592e5`，即 72 小时。

### 3.5 气压/锋面/等值线

```text
.../{model}_pressure_low_high_{stamp}.json
.../{model}_fronts_{stamp}.json
.../{model}_iso_{field}_{stamp}.json
```

### 3.6 气旋/火点/摄像头

```text
https://data.ventusky.com/cyclones/actual.json?hurricanesUpdated=...
https://data.ventusky.com/fires/{z}/{x}_{y}.json?{firesUpdated}
https://webcams.ventusky.com/api/api.get_nearest_camera.php?lat=&lon=&count=
```

---

## 4. 第三层：真实浏览器抓包

静态分析只能得到模板；实际字段/分块/分钟需要真实请求验证。

用 Playwright 驱动 Brave，遍历 `#i > a` 的每个图层，再设置其 `<select>` 的每个 option：

```js
await page.goto('https://www.ventusky.com/');
await page.waitForTimeout(9000);

const layers = await page.evaluate(() =>
  [...document.querySelectorAll('#i > a')].map((a, i) => ({ i, txt: a.textContent.trim() }))
);

for (const L of layers) {
  await page.evaluate(i => document.querySelectorAll('#i > a')[i].click(), L.i);
  await page.waitForTimeout(1200);
  const opts = await page.evaluate(i => {
    const a = document.querySelectorAll('#i > a')[i];
    const s = a.nextElementSibling?.querySelector('select');
    return s ? [...s.options].map(o => ({ v: o.value, t: o.textContent.trim() })) : [];
  }, L.i);
  for (const o of opts) {
    await page.evaluate(({ i, v }) => {
      const a = document.querySelectorAll('#i > a')[i];
      const s = a.nextElementSibling.querySelector('select');
      s.value = v;
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }, { i: L.i, v: o.v });
    await page.waitForTimeout(2200);
    // 记录 data.ventusky.com 请求
  }
}
```

实际抓到的例子：

```text
https://data.ventusky.com/2026/10/21/rtofs/tilled_world/hour_18/rtofs_teplota_voda_0_1_20261021_18.jpg?17924544
https://data.ventusky.com/2026/10/21/hrrr/whole_world/hour_18/hrrr_teplota_2_m_20261021_18.jpg?17925876
https://data.ventusky.com/2026/10/21/smoc/tilled_world/hour_15/smoc_proud_u_1_2_20261021_15.jpg?17925408
https://data.ventusky.com/2026/10/21/icon_eu_water/whole_world/hour_15/icon_eu_water_swh_20261021_15.jpg?17925732
https://data.ventusky.com/2026/10/21/mfwam_water/whole_world/hour_15/mfwam_water_shww_20261021_15.jpg?17925516
https://data.ventusky.com/2026/10/21/worad_hres/tilled_world/hour_15/worad_hres_srazky_dbz_2_3_20261021_1515.jpg?17926008
https://data.ventusky.com/2026/10/21/goes/tilled_world/hour_15/00/goes_rgba_6_7_20261021_1500.jpg?17925948
```

这些请求验证了：

- 海浪模型目录 `_water` 后缀
- 雷达 5 分钟文件名
- 卫星分钟目录 + 文件名分钟
- 分块索引 `tileX_tileY`
- `cache` 参数

---

## 5. 点预报与海洋图表

点击地图时，前端请求：

```text
https://www.ventusky.com/los-angeles?ajax
```

坐标页：

```text
https://www.ventusky.com/35;-140?ajax
```

返回 HTML 片段，关键元素：

```html
<custom-forecast data-forecast='{"d_1":{...},"units":{...},"sDesc":{...},"dc":8}'>
<select id="date_selector">...</select>
<div id="forecast_24"><table>...</table></div>
<div id="water" data-water="https://www.ventusky.com/aside/forecast/ajax/chart_water.ajax.php?...">
```

`data-water` 返回：

```html
<a data-link="wh&amp;data=3.3;3.1;...:2.8;...&amp;time=...&amp;day=0&amp;lat=35&amp;lon=-140...">
  Significant wave height <br>(m)
</a>
```

`data` 用 `:` 分成 3 段，每段用 `;` 分隔数值。本地 API 保留为 `segments`，不假设分段含义。

---

## 6. 本地代理的关键补丁

原前端有一处主机名白名单：

```js
/ve(\/)?nt(\\)?us(\/)?ky\.com$|^localhost$/.test(location.hostname)
  ? removeNoJs()
  : open("https://www.ventusky.com/", "_top");
```

如果本地用 `127.0.0.1` 访问，会不断打开官网，表现为页面反复刷新。  
`lib/rewrite.mjs` 把它改成：

```js
/ve(\/)?nt(\\)?us(\/)?ky\.com$|^(localhost|127\.0\.0\.1)$/.test(location.hostname)
```

同时把所有 `*.ventusky.com` 绝对 URL 改写为：

- `www.ventusky.com` → 本地根路径（保持 `/los-angeles` 这类路由）
- 其他子域 → `/proxy/<host>/...`

这样前端的 `history.pushState`、`location.pathname`、`p.root` 都保持原语义。

---

## 7. 验证清单

- [x] 首页加载、地图、图层菜单
- [x] 88 个图层的目录（DOM + `wa` 交叉验证）
- [x] 41 个模型的目录（`T` + `MapOptions` 交叉验证）
- [x] 海洋：海温、洋流、潮流、潮位、风暴增水、5 种海浪图层
- [x] 雷达/卫星亚小时级 URL
- [x] 点预报（陆地城市 + 海上坐标）
- [x] 海洋图表
- [x] 高低压/锋面/等值线
- [x] 气旋/火点/摄像头/AQI/搜索
- [x] 历史归档（`archive.ventusky.com`）
- [x] 中文/英文路径
- [x] 登录页可打开（未测试真实账号）
- [ ] Premium 付费内容（不做绕过）
- [ ] 移动 App 私有 API（不在范围）
- [ ] 原始 GRIB/NetCDF（不在范围）

---

## 8. 复现脚本建议

如果你想重新生成 `data/catalog.json`：

1. 下载首页，提取 `MapOptions`。
2. 下载 `script-en.js` 并格式化。
3. 用括号匹配提取 `T`、`wa`、`Va` 的对象字面量。
4. 用 `MapOptions` 替换 `p.*`，用 `{min,max}` 替换 `m`，求值。
5. 遍历 `T[model].K` 建立模型-图层矩阵。
6. 用浏览器抓包验证特殊字段（`yg`、`rj`、`Pl`、`variant`）。
7. 写入 `catalog.json`。

具体代码可参考本项目的 `lib/tiles.mjs` 和 `data/catalog.json` 结构；原始提取脚本不随项目发布，避免把官网脚本一起打包。
