"use client";

import { useRouter } from "next/navigation";
import Win95Button from "@/components/win95/Win95Button";

export default function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return <Win95Button onClick={handleLogout}>Logout</Win95Button>;
}
