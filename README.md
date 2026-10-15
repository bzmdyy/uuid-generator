# UUID Generator

英文为主、支持简体中文的随机 UUID v4 生成器。支持每次 1～100 个、复制单个或复制全部。UUID 在浏览器内生成，无数据库、无额外依赖。

## 开始使用

需要 Node.js 22 或更高版本。在项目目录运行：

```powershell
node --test
node scripts/serve.mjs
```

打开 http://localhost:3000，中文页面为 http://localhost:3000/zh/。按 Ctrl+C 停止。修改代码后重启命令即可重新构建。无需 npm install。

## 文档

- [项目需求文档](docs/项目需求文档.md)
- [Windows 部署执行文档](docs/部署执行文档.md)

## 文件

- `src/uuid.mjs`：数量检查和 UUID 生成。
- `src/app.mjs`：页面交互和复制。
- `src/styles.css`：响应式样式。
- `scripts/build.mjs`：双语网页、站点地图和 robots 构建。
- `scripts/serve.mjs`：本地预览。
- `tests/`：自动检查。
- `vercel.json`：Vercel 构建和公开文件目录配置。
- `dist/`：自动生成的发布文件，不需要提交。

## Vercel

导入 GitHub 仓库，Framework 选 Other，其余按 vercel.json。构建命令为 `node scripts/build.mjs`，输出目录为 `dist`。在 Production 设置 `SITE_URL=https://你的正式域名`，更改后重新部署。没有 SITE_URL 时，构建会使用 Vercel 的生产域名信息，本地默认为 http://localhost:3000。

本次仅在本地完成实现和测试，线上部署、购买域名、绑定及 Search Console 提交请按文档执行。
