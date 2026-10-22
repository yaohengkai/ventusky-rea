# 部署到 Netlify

把 `ventusky-local` 搬到 Netlify 上跑：静态页面走 CDN，动态部分（Ventusky 反代、`/__api` 数据接口）走 Netlify Functions。配置文件都在仓库根目录，不需要改代码。

## 部署后的路由

| 路径 | 处理者 | 说明 |
| --- | --- | --- |
| `/` `/*` | Function `proxy` | 实时反代 <https://www.ventusky.com>，并改写 HTML/CSS/JS 里的绝对地址 |
| `/proxy/<host>/*` | Function `proxy` | 反代白名单内的 `*.ventusky.com` 子域（static/data/archive/map/webcams/…） |
| `/__api/*` | Function `api` | 目录、时间、瓦片、点预报、海洋图表等全部数据接口 |
| `/__health` | Function `health` | 运行时信息 |
| `/__lab/` | 静态 `dist/lab.html` | API 实验台 |
| `/__docs/` | 静态 `dist/docs/*` | API / DATA / REVERSE 文档 |

相关文件：

- [`netlify.toml`](netlify.toml) — 构建命令、Functions 目录、重写规则、响应头
- [`netlify/functions/api.mjs`](netlify/functions/api.mjs) — 复用 `ventusky-local/lib/api.mjs`，只做 Node `(req, res)` → Web `Request/Response` 适配
- [`netlify/functions/proxy.mjs`](netlify/functions/proxy.mjs) — `server.mjs` 里反代逻辑的 Functions 版本
- [`netlify/functions/health.mjs`](netlify/functions/health.mjs)
- [`scripts/build-netlify.mjs`](scripts/build-netlify.mjs) — 只发布静态资源到 `dist/`

## 方式一：Netlify 后台导入（推荐，私有仓库最稳）

1. 打开 <https://app.netlify.com/start>，选择 **Import an existing project → GitHub**。
2. 授权 Netlify 访问 **仅这个仓库**（私有仓库必须授权）。
3. 选中 `yaohengkai/ventusky-rea`，分支 `main`。
4. 构建信息会自动从 `netlify.toml` 读取，直接 **Deploy**：

   ```text
   Build command:  node scripts/build-netlify.mjs
   Publish dir:    dist
   Functions dir:  netlify/functions
   ```

5. 首次部署约 30–60 秒，完成后得到 `https://<随机名>.netlify.app`。

## 方式二：Deploy to Netlify 按钮

仓库是私有的，按钮会先要求 Netlify 获得该仓库的 GitHub 权限，授权后才会 clone：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yaohengkai/ventusky-rea)

> 如果按钮提示找不到仓库，说明 Netlify 的 GitHub App 还没被授权访问私有仓库，改用方式一即可。

## 方式三：Netlify CLI（本地一键推送）

```bash
npm i -g netlify-cli
netlify login
netlify init            # 关联/新建站点，会读取 netlify.toml
netlify deploy --build  # 预览部署
netlify deploy --build --prod
```

想本地先跑一遍（Functions 会在本地执行）：

```bash
netlify dev             # http://localhost:8888
```

## 方式四：GitHub Actions 一键部署

`.github/workflows/netlify-deploy.yml` 提供了手动触发的部署工作流：

1. 仓库 **Settings → Secrets and variables → Actions** 新增：
   - `NETLIFY_AUTH_TOKEN`：Netlify → User settings → Applications → Personal access tokens
   - `NETLIFY_SITE_ID`：Netlify → Site configuration → Site information → Site ID
2. 打开 **Actions → Deploy to Netlify → Run workflow**。
3. 想改成推送即部署，把 workflow 里的 `workflow_dispatch:` 换成 `push: { branches: [main] }`。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `WAQI_TOKEN` | 否 | `/__api/aqi` 用的 WAQI 令牌；不设置时使用代码内的公开示例令牌 |
| `VENTUSKY_DATA_DIR` | 否 | `catalog.json` 所在目录；默认会自动在 `ventusky-local/data` 等位置查找 |
| `NODE_VERSION` | 否 | 已在 `netlify.toml` 固定为 20 |

在 **Site configuration → Environment variables** 里添加，改完需要重新部署一次。

## 部署后自检

```bash
SITE=https://<your-site>.netlify.app
curl -s "$SITE/__health" | jq
curl -s "$SITE/__api/catalog" | jq '.modelOrder | length'          # 41
curl -s "$SITE/__api/times?model=icon&layer=temperature-2m&limit=2" | jq '.times'
curl -sI "$SITE/__lab/" | head -1
curl -s "$SITE/" | head -20                                         # 已改写为 /proxy/... 的首页
```

## 和本地 `server.mjs` 的差异

- **无状态**：`/__health` 不再返回请求计数；每次调用都是新进程。
- **超时**：Netlify Functions 默认 10 秒（免费额度下不可调）。极慢的上游请求会返回 502，本地版没有这个限制。
- **响应体上限**：单次函数响应约 6 MB。瓦片、JSON、页面都没问题；超大文件会被上游或平台截断。
- **缓存**：文本响应沿用本地逻辑设为 `no-cache`，二进制沿用上游 `cache-control`。Netlify CDN 不会自动缓存函数响应，重复请求会真实回源。
- **访问控制**：站点默认公开。如果只想自己用，可在 Netlify 开启 **Password protection**（付费功能），或在 `netlify.toml` 里给整个站点加 Basic Auth（Edge Function）——当前配置没有做。
- **构建**：不执行 `npm install`，项目没有第三方运行时依赖；`scripts/build-netlify.mjs` 只拷贝 `lab.html`、`docs/` 并生成 `robots.txt`。

## 故障排查：页面文字错位、自动无限刷新

现象：本地 `localhost:8787` 正常，部署到 Netlify 后页面只剩错位的文字，并且不停自我刷新，地图界面出不来。

原因在 Ventusky 的 `script-en*.js` 里的一段 hostname 白名单：

```js
/ve(\/)?nt(\\)?us(\/)?ky\.com$|^localhost$/.test(location.hostname)
  ? remove(document.getElementById("no-js"))   // 启动地图
  : window.open("https://www.ventusky.com/", "_top")
```

- 本地访问的主机名是 `localhost` / `127.0.0.1`，命中白名单，正常启动。
- Netlify 的主机名是 `*.netlify.app`，不命中，于是跳转 `https://www.ventusky.com/`。
- 反代又把该 URL 改写成 `/`，跳转就变成了“重新加载当前页”，形成死循环。
- 同时 `#no-js` 兜底节点不会被移除（它没有对应样式），所以看到的是错位的文字列表而不是地图。

修复：`ventusky-local/lib/rewrite.mjs` 的 `rewriteVentuskyUrls(text, hostname)` 会把**当前请求的 hostname** 也加进白名单，`server.mjs` 和 `netlify/functions/proxy.mjs` 都会传入。因此 `*.netlify.app`、deploy preview、自定义域名、`netlify dev`、局域网 IP 都能正常启动。回归测试：

```bash
cd ventusky-local
npm test
```

## 合规提醒

部署实例会以你的名义对外反代 Ventusky 的公开资源。请保持低频访问、不要公开宣传或用于商业用途，并遵守 Ventusky 的服务条款和当地法律。`dist/robots.txt` 已经禁止搜索引擎抓取，避免镜像被索引。
