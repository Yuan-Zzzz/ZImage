# ZImages

- 直链 `/i/<hash>.<ext>` 公开,可在博客文章中嵌入
- Gallery / 上传 / 删除需要登录(单管理员)
- 默认端口 `2222`,数据库 `mongodb://localhost:27018/zimages`,文件落盘 `./data/uploads/<YYYY>/<MM>/`

## 快速开始

```bash
npm install
cp .env.example .env.local                  # 修改 ADMIN_PASSWORD / JWT_SECRET
mongosh mongodb://localhost:27018/zimages --eval 'db.runCommand({ping:1})'  # 确认 mongo 可达
npm run dev                                 # http://localhost:2222
```

打开浏览器:

- `http://localhost:2222/` → 公开落地页
- `http://localhost:2222/admin/login` → 登录后进入 Gallery
- 拖拽 / 点击 / `Ctrl+V` 粘贴上传(jpg/png/webp/gif/avif,单文件 ≤ 20 MB)
- 每张图卡片提供 **Copy MD / Copy URL / Copy HTML / Delete**

## 上传后的对外 URL

```
http://your-host:2222/i/<sha256-hex>.<ext>
http://your-host:2222/i/<sha256-hex>_thumb.webp     # 400px 缩略图
```

## 生产部署

```bash
npm run build
npm start    # listens on :2222
```

