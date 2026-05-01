import Win95Window from "@/components/win95/Win95Window";
import { connectDB } from "@/lib/db";
import Image from "@/models/Image";
import UploadDropzone from "@/components/zimages/UploadDropzone";
import ImageGrid, { type ImageItem } from "@/components/zimages/ImageGrid";
import LogoutButton from "@/components/zimages/LogoutButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

async function getInitial(): Promise<{ items: ImageItem[]; total: number }> {
  await connectDB();
  const total = await Image.countDocuments();
  const items = await Image.find()
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE)
    .lean();
  return {
    items: JSON.parse(JSON.stringify(items)),
    total,
  };
}

export default async function AdminPage() {
  const { items, total } = await getInitial();
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display">ZImages</h1>
        <LogoutButton />
      </div>

      <Win95Window title="Upload">
        <UploadDropzone />
      </Win95Window>

      <Win95Window title="Gallery">
        <ImageGrid initial={items} initialTotal={total} pageSize={PAGE_SIZE} />
      </Win95Window>
    </main>
  );
}
