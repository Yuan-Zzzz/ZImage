<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ZImages — Agent Context

## Project Overview

Personal image-hosting tool for Yuan's blog. Direct image URLs (`/i/<hash>.<ext>`) are public; everything else (gallery / upload / delete) requires JWT login. Sister project to `Yuan-Zzzz.com`; mirrors its tech stack and Win95 design system exactly.

- **Tech Stack**: Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind CSS v4, MongoDB (Mongoose), `sharp` for thumbnails
- **Design System**: Windows 95 / 90s nostalgia retro aesthetic (identical to Yuan-Zzzz.com)
- **Port**: 2222 (`npm run dev`)
- **Database**: MongoDB (default `mongodb://localhost:27018/zimages`, same instance as Yuan-Zzzz.com)
- **Storage**: Local filesystem at `data/uploads/{YYYY}/{MM}/<hash>.<ext>` and `..._thumb.webp`. Set `UPLOAD_DIR` env to relocate.

## Architecture

```
app/
  (public)/page.tsx        # Public landing page
  admin/login/page.tsx     # Login form
  admin/page.tsx           # Single-page gallery + upload (server component, force-dynamic)
  api/
    auth/login/route.ts    # POST username/password -> set admin-token cookie
    auth/logout/route.ts   # POST clears cookie
    images/route.ts        # GET list (paginated) | POST multipart upload
    images/[id]/route.ts   # DELETE
  i/[filename]/route.ts    # Public byte stream (originals + *_thumb.webp), Cache-Control immutable, ETag/304
components/
  win95/                   # Reusable Win95 primitives (DO NOT modify; copies of Yuan-Zzzz.com)
  zimages/
    LoginForm.tsx
    UploadDropzone.tsx     # drag-drop + clipboard paste + multi-file + per-file XHR progress
    ImageGrid.tsx          # SSR initial + client pagination + listens for "zimages:uploaded"
    ImageCard.tsx          # thumb + meta + Copy MD/URL/HTML + Delete
    LogoutButton.tsx
lib/
  db.ts                    # connectDB() with global mongoose cache
  auth.ts                  # JWT (jose) helpers
  storage.ts               # saveUpload / deleteImage / readStored; sha256, sharp metadata, dedup
models/
  Image.ts                 # Mongoose schema (hash unique, createdAt index)
middleware.ts              # Gates /admin/* on admin-token cookie (login excepted)
data/                      # Runtime uploads, gitignored
```

## Win95 Design System (STRICT)

Inherits from `Yuan-Zzzz.com`. **Every UI element must follow these rules:**

### Colors (NO gradients except title bar)
| Token | Value | Usage |
|-------|-------|-------|
| `win95-bg` | `#C0C0C0` | Button/surface backgrounds |
| `win95-text` | `#000000` | Primary text |
| `win95-gray` | `#808080` | Borders, secondary text |
| `win95-title` | `#000080` | Active title bar start |
| `win95-title-end` | `#1084D0` | Active title bar end |
| `win95-panel` | `#FFFFCC` | Light yellow panels |
| `win95-teal` | `#008080` | Desktop background |
| `win95-blue` | `#0000FF` | Links (unvisited) |
| `win95-red` | `#FF0000` | Link hover, emphasis |
| `win95-visited` | `#800080` | Visited links |

### Critical Rules
- **ZERO border-radius** anywhere
- **3D bevel effects** on every interactive element and container:
  - **Outset** (raised): `border-color: #fff #808080 #808080 #fff` + `box-shadow: inset -1px -1px 0 #404040, inset 1px 1px 0 #dfdfdf`
  - **Inset** (sunken): reverse the border colors
- **Active button state**: inset + `transform: translate(1px, 1px)`
- **Links**: always underlined, blue → red (hover) → purple (visited)
- **Headings**: Arial Black / Impact, bold or black weight only
- **No smooth transitions** on buttons (instant or 50ms max)

### Pre-built Components (USE THESE)
All UI must use components from `components/win95/`:
- `Win95Window` — Window card with title bar
- `Win95Button` — 3D button; variants: `default`, `primary`, `danger`, `success`
- `Win95Input` / `Win95Textarea` — Inset form inputs. **API note**: `onChange: (value: string) => void`, NOT a React event
- `Win95Marquee` — Scrolling text
- `RainbowText` — Animated rainbow heading text

**DO NOT** create custom styled divs when these components exist.

## Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4**, which differs significantly from v3:

- **NO `tailwind.config.js`** — Configuration is in CSS via `@theme inline` in `app/globals.css`
- **Import**: `@import "tailwindcss";` in `globals.css`
- **Custom colors / fonts / animations** all live in the `@theme inline { ... }` block

If you need to add new theme tokens, edit `app/globals.css`.

## Data Model

### Image
```typescript
{
  hash:         string  // sha256 hex, unique + indexed (the public URL primary key)
  ext:          string  // "jpg" | "png" | "webp" | "gif" | "avif"
  mime:         string
  size:         number  // bytes
  width:        number
  height:       number
  originalName: string  // for download fallback / gallery display
  storedPath:   string  // relative to UPLOAD_DIR, e.g. "uploads/2026/05/<hash>.jpg"
  thumbPath:    string  // "uploads/2026/05/<hash>_thumb.webp"
  createdAt:    Date
  updatedAt:    Date
}
```

Unique index on `hash` (dedup); secondary index on `createdAt: -1` (gallery sort). **Do not add** tags/album/visibility/userId — single-user personal tool.

## Storage Layer (`lib/storage.ts`)

- `mime`/`ext` are determined from `sharp(buffer).metadata().format`, **not** the request `Content-Type` header (kills extension spoofing for free)
- sha256 is computed in one shot over the Buffer (max 20 MB; streaming hash is overkill)
- Dedup: `Image.findOne({ hash })` before writing; if hit, return existing doc untouched
- Thumbnail: `sharp(buf).rotate().resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 })` (rotate honors EXIF orientation; GIFs collapse to static first frame)
- All disk IO via `fs/promises`. ENOENT on delete is swallowed; other errors propagate

## API Conventions

- All API routes return `{ success: boolean, data?: T, error?: string }`
- **Public** GET `/i/<filename>` (no auth)
- **Auth-gated** (cookie `admin-token`): `GET/POST /api/images`, `DELETE /api/images/[id]`, `POST /api/auth/logout`
- `/api/images` upload accepts `FormData` with field `files` (multiple). Per-file failures returned in `data.errors` without aborting the batch
- All Mongo docs returned to clients are first run through `JSON.parse(JSON.stringify(...))`

## Auth Flow

- `lib/auth.ts`: jose HS256, 7-day expiry. JWT payload includes `role: "admin"`
- `middleware.ts`: matcher `/admin/:path*`, redirects unauthenticated to `/admin/login` (login page itself is excepted). **Note**: middleware does NOT cover `/api/*` — API routes enforce auth themselves via `verifyToken` (see `app/api/images/route.ts`)
- `POST /api/auth/login`: compares `process.env.ADMIN_PASSWORD` directly; if it starts with `$2`, `bcrypt.compare` is used. Sets httpOnly + sameSite=lax cookie `admin-token`
- `POST /api/auth/logout`: clears the cookie

## Code Patterns

### Server Component with DB
```typescript
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import Image from "@/models/Image";

async function load() {
  await connectDB();
  const items = await Image.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(items));
}
```

### Route handler params (Next 15+)
```typescript
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Routes that touch sharp/fs
```typescript
export const runtime = "nodejs";       // sharp is incompatible with edge
export const dynamic = "force-dynamic"; // never cache
```

### Client upload via XHR (for upload-progress)
```typescript
const xhr = new XMLHttpRequest();
xhr.open("POST", "/api/images");
xhr.upload.onprogress = (e) => { /* update UI */ };
const fd = new FormData();
fd.append("files", file);
xhr.send(fd);
```
`fetch()` has no upload-progress API; XHR is required.

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27018/zimages
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123             # plaintext OR a bcrypt $2 hash
JWT_SECRET=change-me-in-production
UPLOAD_DIR=./data                   # files land in $UPLOAD_DIR/uploads/<YYYY>/<MM>/...
```

## Common Commands

```bash
npm run dev        # Start dev server on :2222
npm run build      # Production build
npm start          # Start production server on :2222
npm run lint       # ESLint
```

## What NOT to Do

- Do NOT use `border-radius` anywhere
- Do NOT add smooth CSS transitions on buttons
- Do NOT remove link underlines
- Do NOT use thin font weights
- Do NOT create a separate `tailwind.config.js` (Tailwind v4 uses CSS config)
- Do NOT call `mongoose.connect()` directly — always use `connectDB()` from `lib/db.ts`
- Do NOT forget to serialize MongoDB objects with `JSON.parse(JSON.stringify(data))` before passing to client components
- Do NOT trust the request `Content-Type` for image type — let `sharp` decide
- Do NOT add features outside the simple personal-use scope: tags, albums, search, multi-user, S3 — all explicitly out of scope
- Do NOT serve files from `public/` — uploads live in `data/`, served via `/i/[filename]/route.ts`
- Do NOT serialize Buffer reads through ReadableStream wrapping — `new Response(buffer, { headers })` is correct for ≤20 MB files
