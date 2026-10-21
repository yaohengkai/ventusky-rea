# Ventusky 数据目录（模型 / 图层 / 字段）

本文件由 `data/catalog.json` 生成，记录 2026-10-21 抓取到的公开前端配置。  
完整到每一条“模型 × 图层”组合的机器可读表见 **`data/model-layer-matrix.csv`**（570 行，含 `modelDir`、时间步长、字段、有效时间）。  
模型 ID、图层 ID、字段名都可以直接用于本地 API：

```bash
curl 'http://localhost:8787/__api/tile-url?model=icon&layer=temperature-2m&time=2026-10-21T15:00:00Z'
```

> 说明
>
> - **时间范围**是“有效时间”（forecast valid time）的范围，不是模式起报时间。
> - **时间步长**是相邻有效时间的最小间隔；雷达 5 分钟、卫星 10 分钟，其余多为 1/3/6 小时。
> - **公开界面 = 否** 的模型不会出现在网页的模型下拉框中，但海洋图层会自动选用它们，API 也可以直接调用。
> - **字段**是文件名中的变量名，例如 `icon_teplota_2_m_...jpg` 的字段是 `teplota_2_m`。
> - 矢量图层（风、洋流）有两个字段（u/v）；海浪有高度和方向两个字段，部分还有涌浪分量。
> - 某些 ECMWF 高空图层实际使用 `ecmwf_mres` 前缀；以 `catalog.json` 里的 `models[].modelDir` / `layers[].models[].modelDir` 为准。

## 1. 模型总表（41 个）


| 模型 ID | 名称 | 类型 | 分辨率 | 时间步长 | 预报时效 | 数据起止 | 公开界面 | 图层数 |
|---|---|---|---:|---:|---:|---|---|---:|
| `gfs` | GFS | 天气 | 22 km | 3 小时 | 15 天 | 2018-01-01 → 2026-11-04 | 是 | 64 |
| `gem` | GEM | 天气 | 15 km | 3 小时 | 30 天 | 2026-01-01 → 2026-10-31 | 是 | 32 |
| `ecmwf_mres` | ECMWF | 天气 | 22 km | 3 小时 | 15 天 | 2024-04-21 → 2026-11-04 | 自动/隐藏 | 23 |
| `ecmwf_hres` | ECMWF | 天气 | 9 km | 3 小时 | 15 天 | 2025-12-05 → 2026-11-04 | 是 | 38 |
| `kma_um` | KMA-UM | 天气 | 19 km | 3 小时 | 30 天 | 2026-01-01 → 2026-04-12 | 自动/隐藏 | 12 |
| `icon` | ICON | 天气 | 13 km | 3 小时 | 15 天 | 2018-01-01 → 2026-10-28 | 是 | 52 |
| `hrrr` | HRRR (USA) | 天气 | 3 km | 1 小时 | 60 小时 | 2022-01-01 → 2026-10-23 | 是 | 26 |
| `rrfs` | RRFS (USA) | 天气 | 3 km | 1 小时 | 60 小时 | 2026-09-28 → 2026-10-24 | 是 | 26 |
| `rrfs_hawai` | RRFS (Hawaii) | 天气 | 2 km | 1 小时 | 60 小时 | 2026-10-01 → 2026-10-24 | 是 | 26 |
| `nbm` | NBM (USA) | 天气 | 3 km | 1 小时 | 60 小时 | 2026-01-01 → 2026-10-23 | 是 | 10 |
| `harmonie_car` | HARMONIE (CAR) | 天气 | 5.5 km | 1 小时 | 180 小时 | 2026-01-01 → 2026-10-23 | 是 | 18 |
| `harmonie_eu` | HARMONIE (EU) | 天气 | 7 km | 1 小时 | 60 小时 | 2026-01-01 → 2026-10-23 | 是 | 20 |
| `icon_eu` | ICON (EU) | 天气 | 7 km | 3 小时 | 180 小时 | 2018-10-31 → 2026-10-26 | 是 | 30 |
| `icon_de` | ICON (DE) | 天气 | 2.2 km | 1 小时 | 180 小时 | 2025-01-01 → 2026-10-23 | 是 | 25 |
| `icon_ch` | ICON (CH) | 天气 | 2.0 km | 1 小时 | 15 天 | 2025-06-25 → 2026-10-26 | 是 | 21 |
| `icon_it` | ICON (IT) | 天气 | 2.2 km | 1 小时 | 15 天 | 2026-10-01 → 2026-10-24 | 是 | 21 |
| `aladin` | Aladin (CE) | 天气 | 2.3 km | 1 小时 | 180 小时 | 2025-01-01 → 2026-10-24 | 是 | 16 |
| `arome` | AROME (FR) | 天气 | 2.5 km | 1 小时 | 15 天 | 2025-01-01 → 2026-10-23 | 是 | 17 |
| `meps` | MEPS (NO) | 天气 | 2.5 km | 1 小时 | 180 小时 | 2025-01-01 → 2026-10-24 | 是 | 17 |
| `ukmo` | UKMO | 雷达 | 13 km | 1 小时 | 15 天 | 2026-01-01 → 2026-10-22 | 自动/隐藏 | 1 |
| `ukmo_uk` | UKMO (UK) | 雷达 | 2 km | 1 小时 | 60 小时 | 2025-01-01 → 2026-10-26 | 是 | 14 |
| `worad` | WORAD | 雷达 | 13 km | 5 分钟 | 60 小时 | 2019-01-01 → 2025-08-23 | 自动/隐藏 | 1 |
| `worad_hres` | WORAD | 雷达 | 6 km | 5 分钟 | 60 小时 | 2025-08-23 → 2026-10-21 | 自动/隐藏 | 1 |
| `eurad` | EURAD | 雷达 | 3 km | 1 小时 | 5 小时 | 2019-01-01 → 2026-10-21 | 自动/隐藏 | 3 |
| `earad` | EARAD | 雷达 | 3 km | 1 小时 | 5 小时 | 2024-05-05 → 2026-10-21 | 自动/隐藏 | 3 |
| `usrad` | USRAD | 雷达 | 3 km | 1 小时 | 5 小时 | 2019-01-01 → 2026-10-21 | 自动/隐藏 | 3 |
| `silam` | SILAM | 空气质量 | 16 km | 3 小时 | 60 天 | 2020-02-15 → 2026-10-26 | 自动/隐藏 | 8 |
| `silam_eu` | SILAM | 空气质量 | 8 km | 3 小时 | 60 天 | 2020-02-15 → 2026-10-26 | 自动/隐藏 | 8 |
| `cams` | CAMS | 空气质量 | 30 km | 3 小时 | 30 天 | 2025-05-15 → 2026-10-25 | 自动/隐藏 | 8 |
| `goes` | GOES | 卫星 | 2 km | 10 分钟 | 10 小时 | 2023-01-01 → 2026-10-21 | 自动/隐藏 | 1 |
| `goes16` | GOES HD | 卫星 | 1 km | 10 分钟 | 10 小时 | 2023-01-01 → 2026-10-21 | 自动/隐藏 | 1 |
| `himawari` | HIMAWARI | 卫星 | 2 km | 10 分钟 | 10 小时 | 2023-01-01 → 2026-10-21 | 自动/隐藏 | 1 |
| `meteosat` | METEOSAT | 卫星 | 4 km | 10 分钟 | 10 小时 | 2023-01-01 → 2026-10-21 | 自动/隐藏 | 1 |
| `meteosat_hd` | METEOSAT HD | 卫星 | 1 km | 10 分钟 | 10 小时 | 2024-12-06 → 2026-10-21 | 自动/隐藏 | 1 |
| `ecmwf` | ECMWF | 天气 | 22 km | 3 小时 | 60 天 | 1979-06-01 → 2020-10-31 | 自动/隐藏 | 4 |
| `rtofs` | RTOFS | 海洋 | 14 km | 6 小时 | 60 天 | 2021-06-28 → 2026-10-28 | 自动/隐藏 | 2 |
| `smoc` | Copernicus | 海洋 | 13 km | 1 小时 | 60 天 | 2016-05-01 → 2026-10-28 | 自动/隐藏 | 2 |
| `stofs` | STOFS | 海洋 | 13 km | 1 小时 | 30 天 | 2016-05-01 → 2026-10-28 | 自动/隐藏 | 2 |
| `stofs_us` | STOFS | 海洋 | 3 km | 1 小时 | 30 天 | 2016-05-01 → 2026-10-28 | 自动/隐藏 | 2 |
| `mfwam` | MFWAM | 海洋 | 13 km | 3 小时 | 30 天 | 2024-04-14 → 2026-10-31 | 自动/隐藏 | 5 |
| `wavewatch_no` | WAVEWATCH | 海洋 | 4 km | 3 小时 | 180 小时 | 2023-05-15 → 2026-10-24 | 自动/隐藏 | 5 |

### 模型分组说明

| 类别 | 模型 ID | 说明 |
|---|---|---|
| 全球天气 | `icon`, `gfs`, `ecmwf_hres`, `gem` | 网页下拉框中的 Global Models |
| 区域天气 | `icon_eu`, `harmonie_eu`, `hrrr`, `rrfs`, `nbm`, `ukmo_uk`, `icon_de`, `icon_ch`, `icon_it`, `aladin`, `arome`, `meps`, `rrfs_hawai`, `harmonie_car` | 网页下拉框中的 Regional Models |
| 海洋 | `rtofs`, `smoc`, `stofs`, `stofs_us`, `mfwam`, `wavewatch_no` | 海温、洋流、潮汐、海浪；网页中按图层自动选择 |
| 雷达 | `eurad`, `earad`, `usrad`, `worad`, `worad_hres`, `ukmo`, `ukmo_uk` | 部分与区域天气模型共用 ID |
| 卫星 | `goes`, `goes16`, `meteosat`, `meteosat_hd`, `himawari` | 可见光/红外云图 |
| 空气质量 | `silam`, `silam_eu`, `cams` | PM2.5、PM10、NO₂、SO₂、O₃、CO、沙尘、AQI、UV |
| 历史/隐藏 | `ecmwf_mres`, `ecmwf`, `kma_um` | 旧版或已下线模型，仍可能取到历史数据 |

## 2. 图层总表（88 个）


| 分组 | 图层 ID | 名称 | 单位 | 字段 | 模型数 | 可用模型 |
|---|---|---|---|---|---:|---|
| Temperature | `temperature-water` | Sea-surface temperature | °C | `teplota_voda` | 1 | rtofs |
| Temperature | `temperature-5cm` | Temperature at 5 cm | °C | `teplota_surface` | 10 | gfs, ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, icon_eu, icon_de … +2 |
| Temperature | `temperature-2m` | Temperature at 2 m | °C | `teplota_2_m` | 21 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +13 |
| Temperature | `temperature-anomaly-2m` | Temperature anomaly at 2 m | °C | `teplota_odchylka_2_m` | 1 | gfs |
| Temperature | `temperature-950hpa` | Temperature at 950 hPa | °C | `teplota_95000_pa` | 3 | gfs, gem, icon |
| Temperature | `temperature-925hpa` | Temperature at 925 hPa | °C | `teplota_92500_pa` | 4 | gfs, gem, ecmwf_mres, ecmwf_hres |
| Temperature | `temperature-900hpa` | Temperature at 900 hPa | °C | `teplota_90000_pa` | 3 | gfs, gem, icon |
| Temperature | `temperature-850hpa` | Temperature at 850 hPa | °C | `teplota_85000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Temperature | `temperature-800hpa` | Temperature at 800 hPa | °C | `teplota_80000_pa` | 3 | gfs, gem, icon |
| Temperature | `temperature-750hpa` | Temperature at 750 hPa | °C | `teplota_75000_pa` | 2 | gfs, gem |
| Temperature | `temperature-700hpa` | Temperature at 700 hPa | °C | `teplota_70000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Temperature | `temperature-650hpa` | Temperature at 650 hPa | °C | `teplota_65000_pa` | 1 | gfs |
| Temperature | `temperature-600hpa` | Temperature at 600 hPa | °C | `teplota_60000_pa` | 3 | gfs, gem, icon |
| Temperature | `temperature-500hpa` | Temperature at 500 hPa | °C | `teplota_50000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Temperature | `temperature-400hpa` | Temperature at 400 hPa | °C | `teplota_40000_pa` | 2 | gfs, icon |
| Temperature | `temperature-300hpa` | Temperature at 300 hPa | °C | `teplota_30000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Temperature | `temperature-200hpa` | Temperature at 200 hPa | °C | `teplota_20000_pa` | 3 | gfs, gem, icon |
| Temperature | `temperature-10hpa` | Temperature at 10 hPa | °C | `teplota_1000_pa` | 1 | gfs |
| Temperature | `freezing` | Freezing level | m | `nulova_izoterma` | 9 | gfs, icon, hrrr, rrfs, rrfs_hawai, icon_eu, icon_de, icon_ch … +1 |
| Feels like | `feel` | Feels-like temperature | °C | `teplota_pocit` | 16 | gfs, ecmwf_hres, kma_um, icon, hrrr, rrfs, rrfs_hawai, nbm … +8 |
| Precipitation | `rain-1h` | Precipitation, 1 hour | mm | `srazky_1h` | 19 | ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, nbm, harmonie_car, harmonie_eu … +11 |
| Precipitation | `rain-3h` | Precipitation, 3 hours | mm | `srazky_3h` | 24 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +16 |
| Precipitation | `rain-ac` | Accumulated precipitation | mm | `srazky_ac` | 20 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +12 |
| Precipitation | `precipitation-anomaly` | Precipitation anomaly | % | `srazky_odchylka` | 1 | gfs |
| Radar | `radar` | Weather radar reflectivity | dBZ | `srazky_dbz` | 12 | hrrr, rrfs, rrfs_hawai, icon_de, icon_ch, ukmo, ukmo_uk, worad … +4 |
| Satellite | `satellite` | Satellite cloud imagery | image | `rgba` | 5 | goes, goes16, himawari, meteosat, meteosat_hd |
| Clouds | `clouds-total` | Total cloud cover | % | `oblacnost` | 19 | gfs, gem, ecmwf_hres, kma_um, icon, hrrr, rrfs, rrfs_hawai … +11 |
| Clouds | `clouds-fog` | Fog / low cloud | % | `srazky_type_1h` | 16 | ecmwf_hres, kma_um, icon, hrrr, rrfs, rrfs_hawai, harmonie_car, harmonie_eu … +8 |
| Clouds | `clouds-low` | Low cloud cover | % | `oblacnost_low` | 16 | gfs, ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, harmonie_car, harmonie_eu … +8 |
| Clouds | `clouds-middle` | Middle cloud cover | % | `oblacnost_middle` | 16 | gfs, ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, harmonie_car, harmonie_eu … +8 |
| Clouds | `clouds-high` | High cloud cover | % | `oblacnost_high` | 16 | gfs, ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, harmonie_car, harmonie_eu … +8 |
| Clouds | `cloud-base` | Cloud base height | m | `cloud_base` | 9 | gfs, hrrr, rrfs, rrfs_hawai, harmonie_eu, icon_eu, icon_de, icon_ch … +1 |
| Clouds | `visibility` | Visibility | km | `visibility` | 8 | gfs, ecmwf_hres, hrrr, rrfs, rrfs_hawai, harmonie_eu, icon_eu, icon_de |
| Wind | `wind-10m` | Wind at 10 m | km/h | `vitr_u_10_m`, `vitr_v_10_m` | 21 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +13 |
| Wind | `wind-100m` | Wind at 100 m | km/h | `vitr_u_100_m`, `vitr_v_100_m` | 3 | gfs, ecmwf_hres, icon |
| Wind | `wind-250m` | Wind at 250 m | km/h | `vitr_u_250_m`, `vitr_v_250_m` | 1 | icon |
| Wind | `wind-950hpa` | Wind at 950 hPa | km/h | `vitr_u_95000_pa`, `vitr_v_95000_pa` | 3 | gfs, gem, icon |
| Wind | `wind-925hpa` | Wind at 925 hPa | km/h | `vitr_u_92500_pa`, `vitr_v_92500_pa` | 4 | gfs, gem, ecmwf_mres, ecmwf_hres |
| Wind | `wind-900hpa` | Wind at 900 hPa | km/h | `vitr_u_90000_pa`, `vitr_v_90000_pa` | 3 | gfs, gem, icon |
| Wind | `wind-850hpa` | Wind at 850 hPa | km/h | `vitr_u_85000_pa`, `vitr_v_85000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Wind | `wind-800hpa` | Wind at 800 hPa | km/h | `vitr_u_80000_pa`, `vitr_v_80000_pa` | 3 | gfs, gem, icon |
| Wind | `wind-750hpa` | Wind at 750 hPa | km/h | `vitr_u_75000_pa`, `vitr_v_75000_pa` | 2 | gfs, gem |
| Wind | `wind-700hpa` | Wind at 700 hPa | km/h | `vitr_u_70000_pa`, `vitr_v_70000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Wind | `wind-650hpa` | Wind at 650 hPa | km/h | `vitr_u_65000_pa`, `vitr_v_65000_pa` | 1 | gfs |
| Wind | `wind-600hpa` | Wind at 600 hPa | km/h | `vitr_u_60000_pa`, `vitr_v_60000_pa` | 3 | gfs, gem, icon |
| Wind | `wind-500hpa` | Wind at 500 hPa | km/h | `vitr_u_50000_pa`, `vitr_v_50000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Wind | `wind-400hpa` | Wind at 400 hPa | km/h | `vitr_u_40000_pa`, `vitr_v_40000_pa` | 2 | gfs, icon |
| Wind | `wind-300hpa` | Wind at 300 hPa | km/h | `vitr_u_30000_pa`, `vitr_v_30000_pa` | 5 | gfs, gem, ecmwf_mres, ecmwf_hres, icon |
| Wind | `wind-200hpa` | Wind at 200 hPa | km/h | `vitr_u_20000_pa`, `vitr_v_20000_pa` | 3 | gfs, gem, icon |
| Wind | `wind-10hpa` | Wind at 10 hPa | km/h | `vitr_u_1000_pa`, `vitr_v_1000_pa` | 1 | gfs |
| Wind gusts | `gust` | Wind gust, 1 hour | km/h | `vitr_naraz` | 21 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +13 |
| Wind gusts | `gust-ac` | Wind gust, accumulated maximum | km/h | `vitr_naraz_ac` | 20 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +12 |
| Air pressure | `pressure` | Mean sea-level pressure | hPa | `tlak` | 13 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +5 |
| Air pressure | `geopotential-850hpa` | Geopotential height, 850 hPa | m | `gph_850` | 2 | gfs, icon |
| Air pressure | `geopotential-500hpa` | Geopotential height, 500 hPa | m | `gph_500` | 2 | gfs, icon |
| Air pressure | `geopotential-300hpa` | Geopotential height, 300 hPa | m | `gph_300` | 2 | gfs, icon |
| Thunderstorms | `cape` | CAPE (convective available potential energy) | J/kg | `cape` | 17 | gfs, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs, rrfs_hawai … +9 |
| Thunderstorms | `cape-shear` | CAPE × shear | index | `cape_shear` | 6 | gfs, ecmwf_mres, ecmwf_hres, icon, icon_eu, icon_de |
| Thunderstorms | `shear` | Wind shear, 0–6 km | m/s | `shear` | 6 | gfs, ecmwf_mres, ecmwf_hres, icon, icon_eu, icon_de |
| Thunderstorms | `hail-probability` | Hail probability | % | `hail_probability` | 1 | gfs |
| Thunderstorms | `cin` | CIN (convective inhibition) | J/kg | `cin` | 5 | gfs, ecmwf_hres, hrrr, rrfs, rrfs_hawai |
| Thunderstorms | `li` | Lifted index | °C | `li` | 1 | gfs |
| Thunderstorms | `helicity` | Storm-relative helicity, 0–3 km | m²/s² | `helicity` | 4 | gfs, hrrr, rrfs, rrfs_hawai |
| Humidity | `humidity-2m` | Relative humidity at 2 m | % | `vlhkost` | 13 | gfs, ecmwf_hres, hrrr, rrfs, rrfs_hawai, nbm, harmonie_eu, icon_eu … +5 |
| Humidity | `humidity-900hpa` | Relative humidity at 900 hPa | % | `vlhkost_90000_pa` | 1 | gfs |
| Humidity | `humidity-850hpa` | Relative humidity at 850 hPa | % | `vlhkost_85000_pa` | 3 | gfs, ecmwf_mres, ecmwf_hres |
| Humidity | `humidity-700hpa` | Relative humidity at 700 hPa | % | `vlhkost_70000_pa` | 3 | gfs, ecmwf_mres, ecmwf_hres |
| Humidity | `dew` | Dew point at 2 m | °C | `dew_point` | 18 | gfs, gem, ecmwf_mres, ecmwf_hres, kma_um, icon, hrrr, rrfs … +10 |
| Sea / ocean | `wave` | Significant wave height | m | `swh`, `mdww` | 4 | icon, icon_eu, mfwam, wavewatch_no |
| Sea / ocean | `wind-wave` | Wind-wave height | m | `shww`, `mdww` | 4 | icon, icon_eu, mfwam, wavewatch_no |
| Sea / ocean | `wind-wave-period` | Wind-wave period | s | `mpww` | 4 | icon, icon_eu, mfwam, wavewatch_no |
| Sea / ocean | `swell` | Swell wave height | m | `shts`, `mdts` | 4 | icon, icon_eu, mfwam, wavewatch_no |
| Sea / ocean | `swell-period` | Swell wave period | s | `mpts` | 4 | icon, icon_eu, mfwam, wavewatch_no |
| Sea / ocean | `currents` | Ocean surface currents | km/h | `proud_u`, `proud_v` | 2 | rtofs, smoc |
| Sea / ocean | `tide-currents` | Tidal currents | km/h | `tide_proud_u`, `tide_proud_v` | 1 | smoc |
| Sea / ocean | `tide` | Tide height (MLLW datum) | m | `tide` | 2 | stofs, stofs_us |
| Sea / ocean | `tide-surge` | Tide + storm surge (MLLW datum) | m | `tide_surge` | 2 | stofs, stofs_us |
| Snow cover | `snow` | Snow cover depth | cm | `snih` | 14 | gfs, gem, ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, harmonie_car … +6 |
| Snow cover | `snow-new-ac` | New snow, accumulated | cm | `novy_snih_ac` | 13 | gfs, ecmwf_hres, icon, hrrr, rrfs, rrfs_hawai, harmonie_car, harmonie_eu … +5 |
| Air quality | `pm25` | PM2.5 | µg/m³ | `pm25` | 3 | silam, silam_eu, cams |
| Air quality | `pm10` | PM10 | µg/m³ | `pm10` | 3 | silam, silam_eu, cams |
| Air quality | `no2` | NO₂ | µg/m³ | `no2` | 3 | silam, silam_eu, cams |
| Air quality | `so2` | SO₂ | µg/m³ | `so2` | 3 | silam, silam_eu, cams |
| Air quality | `o3` | O₃ | µg/m³ | `o3` | 3 | silam, silam_eu, cams |
| Air quality | `dust` | Dust | µg/m³ | `dust` | 2 | silam, silam_eu |
| Air quality | `co` | CO | µg/m³ | `co` | 3 | silam, silam_eu, cams |
| Air quality | `aqi` | Air Quality Index | index | `aqi` | 3 | silam, silam_eu, cams |
| Air quality | `uv` | UV index | index | `uv` | 1 | cams |

> 上表的“可用模型”只列出前 8 个；完整列表在 `data/catalog.json` 的 `layers[<id>].models`。  
> 如果某模型不在该图层的列表里，调用 `/__api/tile-url` 会返回 400，网页也会自动切换到可用模型。

## 3. 海洋数据专题


| 图层 ID | 名称 | 单位 | 模型 | 字段 | 说明 |
|---|---|---|---|---|---|
| `temperature-water` | Sea-surface temperature | °C | rtofs | `teplota_voda` |  |
| `wave` | Significant wave height | m | icon, icon_eu, mfwam, wavewatch_no | `swh`, `mdww` |  |
| `wind-wave` | Wind-wave height | m | icon, icon_eu, mfwam, wavewatch_no | `shww`, `mdww` |  |
| `wind-wave-period` | Wind-wave period | s | icon, icon_eu, mfwam, wavewatch_no | `mpww` |  |
| `swell` | Swell wave height | m | icon, icon_eu, mfwam, wavewatch_no | `shts`, `mdts` |  |
| `swell-period` | Swell wave period | s | icon, icon_eu, mfwam, wavewatch_no | `mpts` |  |
| `currents` | Ocean surface currents | km/h | rtofs, smoc | `proud_u`, `proud_v` |  |
| `tide-currents` | Tidal currents | km/h | smoc | `tide_proud_u`, `tide_proud_v` |  |
| `tide` | Tide height (MLLW datum) | m | stofs, stofs_us | `tide` | 基准面 MLLW；STOFS 区域模型 |
| `tide-surge` | Tide + storm surge (MLLW datum) | m | stofs, stofs_us | `tide_surge` |  |

### 海洋图层的实际文件名

| 图层 | 高度/主字段 | 方向字段 | 说明 |
|---|---|---|---|
| `wave` 有效波高 | `swh` | `mdww` | 综合浪高（风浪+涌浪） |
| `wind-wave` 风浪高度 | `shww` | `mdww` | 风生浪 |
| `wind-wave-period` 风浪周期 | `mpww` | — | 秒 |
| `swell` 涌浪高度 | `shts` | `mdts` | 涌浪 |
| `swell-period` 涌浪周期 | `mpts` | — | 秒 |
| `currents` 洋流 | `proud_u` | `proud_v` | u/v 分量 |
| `tide-currents` 潮流 | `tide_proud_u` | `tide_proud_v` | u/v 分量 |
| `tide` 潮位 | `tide` | — | MLLW 基准 |
| `tide-surge` 潮位+风暴增水 | `tide_surge` | — | MLLW 基准 |
| `temperature-water` 海表温度 | `teplota_voda` | — | RTOFS |

海浪模型的目录名带 `_water` 后缀，例如：

```text
https://data.ventusky.com/2026/10/21/icon_eu_water/whole_world/hour_15/icon_eu_water_swh_20261021_15.jpg
https://data.ventusky.com/2026/10/21/mfwam_water/whole_world/hour_15/mfwam_water_shww_20261021_15.jpg
```

API 会自动处理这个后缀，你只需要：

```bash
curl 'http://localhost:8787/__api/tile-url?model=icon_eu&layer=wave&time=2026-10-21T15:00:00Z'
```

### 海洋点预报

海岸/海上的坐标页会额外带一个 `data-water` 图表地址，返回 10 天、3 小时间隔（原始数据按小时重复）的：

- `wh`：有效波高（m）
- `sh`：涌浪高度（m）
- `ti`：潮位（m，MLLW）

```bash
curl 'http://localhost:8787/__api/water?lat=35&lon=-140'
curl 'http://localhost:8787/__api/point?lat=35&lon=-140&water=1'
```

原始图表接口：

```text
https://www.ventusky.com/aside/forecast/ajax/chart_water.ajax.php?lat=35&lon=-140&tz=Etc%2FGMT%2B9&tz_offset=-32400&days=10&lang=en
```

返回的 HTML 里每个 `<a data-link="...">` 包含 `type` 和 `data`；`data` 用 `:` 分成多段，每段用 `;` 分隔数值。本地 API 把它整理为 `series[type].segments`。

## 4. 大气数据专题

### 4.1 温度 / 风 / 气压 / 降水 / 云

这些是最常用的标量或矢量图层，调用方式完全一致：

```bash
# 2 米温度（标量）
curl 'http://localhost:8787/__api/tile-url?model=icon&layer=temperature-2m&time=2026-10-21T15:00:00Z'

# 10 米风（u/v 两张图）
curl 'http://localhost:8787/__api/tile-url?model=icon&layer=wind-10m&time=2026-10-21T15:00:00Z'

# 海平面气压 + 高低压中心 JSON
curl 'http://localhost:8787/__api/tile-url?model=icon&layer=pressure&time=2026-10-21T15:00:00Z'
curl 'http://localhost:8787/__api/pressure?model=icon&layer=pressure&time=2026-10-21T15:00:00Z'
```

风场返回的 `urls[0]` 是 u 分量，`urls[1]` 是 v 分量；两张图都是灰度/伪彩编码，前端用像素亮度反查色标。  
网页上的“Wind Animation”就是由这两张图在 canvas 中合成的。

### 4.2 雷达 / 卫星

雷达和卫星是亚小时级数据：

- 雷达：`minuteResolution = true`，文件名为 `..._YYYYMMDD_HHmm.jpg`，例如 `eurad_srazky_dbz_20261021_1515.jpg`。
- 卫星：`minuteResolution = true` 且 `minuteFolder = true`，分钟作为目录：`.../hour_15/00/goes_rgba_..._20261021_1500.jpg`。

```bash
curl 'http://localhost:8787/__api/tile-url?model=worad_hres&layer=radar&time=2026-10-21T15:15:00Z'
curl 'http://localhost:8787/__api/tile-url?model=goes&layer=satellite&time=2026-10-21T15:00:00Z'
```

### 4.3 空气质量


| 图层 ID | 名称 | 单位 | 模型 | 字段 |
|---|---|---|---|---|
| `pm25` | PM2.5 | µg/m³ | silam, silam_eu, cams | `pm25` |
| `pm10` | PM10 | µg/m³ | silam, silam_eu, cams | `pm10` |
| `no2` | NO₂ | µg/m³ | silam, silam_eu, cams | `no2` |
| `so2` | SO₂ | µg/m³ | silam, silam_eu, cams | `so2` |
| `o3` | O₃ | µg/m³ | silam, silam_eu, cams | `o3` |
| `dust` | Dust | µg/m³ | silam, silam_eu | `dust` |
| `co` | CO | µg/m³ | silam, silam_eu, cams | `co` |
| `aqi` | Air Quality Index | index | silam, silam_eu, cams | `aqi` |
| `uv` | UV index | index | cams | `uv` |

空气质量图层用 SILAM / CAMS 模型。当前 AQI 还可以直接查 WAQI：

```bash
curl 'http://localhost:8787/__api/aqi?lat=34.05&lon=-118.25'
```

网页里的 AQI 图表接口：

```text
https://www.ventusky.com/aside/forecast/ajax/chart_aqi.ajax.php?lat=34.05&lon=-118.25&tz=America%2FLos_Angeles&lang=en
```

### 4.4 气团、锋面、等值线

| 数据 | 接口 | 说明 |
|---|---|---|
| 高低压中心 | `/__api/pressure` | `{l:[[lat,lon,hPa],...], h:[...]}` |
| 锋面 | `/__api/fronts` | `{fronts:[{type,direction,points:[[lon*100,lat*100],...]}]}` |
| 等值线 | `/__api/isolines` | `[{t, x:[lon*100...], y:[lat*100...]}]` |
| 气旋/飓风 | `/__api/cyclones` | 原始 `cyclones.{model}[]` 结构 |

等值线默认用 `pressure` 图层的字段 `tlak`；也可以指定 `layer=geopotential-500hpa` 等。

## 5. 时间与归档规则

- 所有时间按 **UTC** 处理；网页显示的是用户/地点本地时间。
- 当前数据在 `data.ventusky.com`。
- 早于 **72 小时** 的数据自动切换到 `archive.ventusky.com`。
- `?cache=` 参数是模型更新时间（秒，去掉末尾 0），不是随机数；不要省略。
- 时间不在模型有效范围内时，可能返回 404 或一张 955 字节的占位 PNG。

## 6. 栅格地理参考

每个模型在 `catalog.json` 里有：

```json
"raster": {
  "width": 2880,
  "height": 1441,
  "tileWidth": 512,
  "tileHeight": 512,
  "cols": 6,
  "rows": 3,
  "extent": { "lon": [-180, 180], "lat": [-90, 90] },
  "minZoomForTiles": 5
}
```

像素坐标到经纬度（等经纬度投影）：

```text
lon = lon0 + (px + 0.5) / width  * (lon1 - lon0)
lat = lat1 - (py + 0.5) / height * (lat1 - lat0)
```

`tilled_world` 的 `tileX/tileY` 就是：

```text
tileX = floor(px / tileWidth)
tileY = floor(py / tileHeight)
```

**注意**：这不是 Web Mercator 的 XYZ 瓦片，不能直接塞进 Leaflet/MapLibre 的 `{z}/{x}/{y}` 模板。网页前端是把整张等经纬度图重投影到 canvas 上再绘制的。  
`extent` 不是全球的模型（HRRR、ICON-EU、HARMONIE 等）只覆盖自己的区域。

## 7. 数值 vs 图片

- 地图图层是 **已经上色的 JPG**，像素里没有原始浮点值。
- 需要“某点具体数值”时，优先用 `/__api/point` 的 24 小时/8 天预报（网页服务端已经算好）。
- 需要“整张网格的数值”时，公开前端没有直接暴露原始 GRIB/NetCDF；只能：
  1. 用图片做近似反查（按色标亮度），或
  2. 从原始数据提供方（NOAA、DWD、ECMWF、Copernicus 等）下载 GRIB，再用 Ventusky 的图层字段名对应。
- 本站不提供、也不绕过任何付费原始数据接口。

## 8. 底图与注记瓦片

本地镜像的底图/边界/城市名也是从官网同源代理的。上游模板：

| 类型 | URL |
|---|---|
| 底图（高缩放） | `https://map.ventusky.com/tiles/{z}/{x}/{y}.png?256` |
| 底图（OSM custom） | `https://static.ventusky.com/tiles/v1.0/osm_custom/{z}/{x}/{y}.png` |
| 陆地 | `https://static.ventusky.com/tiles/v1.1/land/{z}/{x}/{y}.png` |
| 边界 | `https://static.ventusky.com/tiles/v1.0/border/{z}/{x}/{y}.png` |
| 城市点 | `https://static.ventusky.com/tiles/v2.2/cities/{z}/{x}/{y}.js` |
| 国家/地区名 | `https://static.ventusky.com/tiles/v1.0/countries_regions/{lang}/{z}/{x}/{y}.js` |
| 摄像头点 | `https://static.ventusky.com/tiles/v1.0/cams/{z}/{x}/{y}.js` |

这些是标准的 Web Mercator XYZ 瓦片（和前面的 `tilled_world` 数据瓦片不同）。  
城市/国家名返回的是 JS 数组/对象，不是图片；本地镜像由原前端直接加载。

## 9. 快速检查清单

- 查模型：`curl http://localhost:8787/__api/models | jq '.[].id'`
- 查图层：`curl http://localhost:8787/__api/layers/temperature-2m`
- 查某模型是否支持某图层：看 `layers[].models[].model`
- 生成图片：`curl 'http://localhost:8787/__api/tile-url?...'`
- 下载图片：`curl -o x.jpg 'http://localhost:8787/__api/tile?...'`
- 点预报：`curl 'http://localhost:8787/__api/point?lat=&lon='`
- 海洋图表：`curl 'http://localhost:8787/__api/water?lat=&lon='`
- 历史数据：把 `time` 改到 72 小时以前，API 自动走 `archive`
