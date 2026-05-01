import Win95Window from "@/components/win95/Win95Window";
import LoginForm from "@/components/zimages/LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="max-w-md mx-auto p-4 md:p-8">
      <Win95Window title="ZImages — Login">
        <LoginForm />
      </Win95Window>
    </main>
  );
}
