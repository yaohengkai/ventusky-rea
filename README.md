# Ventusky 逆向工作区

本目录是个人学习用途的 Ventusky 逆向工程工作区。

## 交付物

- **`ventusky-local/`** — 可本地部署的镜像 + 数据 API + 完整文档（推荐从这里开始）
- **`ventusky-local.zip`** — 上述目录的压缩包
- **`ventusky-local/README.md`** — 总说明（安装、界面、API、海洋/大气数据、REA 逆向过程）
- **`ventusky-local/docs/API.md`** — 完整接口参考
- **`ventusky-local/docs/DATA.md`** — 41 个模型 / 88 个图层 / 字段总表
- **`ventusky-local/docs/REVERSE.md`** — 逆向笔记与证据链

## 快速开始

```bash
cd ventusky-local
npm start
```

打开：

- 本地镜像：<http://localhost:8787/>
- API 实验台：<http://localhost:8787/__lab/>
- 数据目录：<http://localhost:8787/__api/catalog>

## 重要声明

- 仅供个人学习、研究、非商业使用。
- 不是 Ventusky 官方项目；数据、瓦片、网页代码版权归 Ventusky 及其数据提供方。
- 本项目不复制、不再分发这些数据；本地镜像只是按浏览器方式实时请求公开资源。
- 不绕过任何付费墙/账号权限；Premium 功能请使用官方账号。
- 请遵守 Ventusky 的服务条款、robots.txt 和当地法律，控制请求频率。
