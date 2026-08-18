import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8">
        <Logo size={28} />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
