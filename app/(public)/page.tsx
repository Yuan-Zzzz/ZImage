import Link from "next/link";
import Win95Window from "@/components/win95/Win95Window";
import RainbowText from "@/components/win95/RainbowText";

export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <Win95Window title="ZImages — Personal Image Host">
        <div className="space-y-4 font-sans text-sm">
          <h1 className="text-2xl">
            <RainbowText>ZImages</RainbowText>
          </h1>
          <p>
            Personal image hosting for blog posts. Direct image URLs are public
            and embeddable; uploads and management require login.
          </p>
          <hr className="hr-groove" />
          <p>
            Image URL pattern:{" "}
            <code className="font-mono win95-inset bg-win95-panel px-1 py-0.5 text-xs">
              /i/&lt;hash&gt;.&lt;ext&gt;
            </code>
          </p>
          <p>
            <Link href="/admin/login">Go to Admin →</Link>
          </p>
        </div>
      </Win95Window>
    </main>
  );
}
