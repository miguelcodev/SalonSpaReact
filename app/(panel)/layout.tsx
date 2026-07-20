import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-color-bg">
      <Topbar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
