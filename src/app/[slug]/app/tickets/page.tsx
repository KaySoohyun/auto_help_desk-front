import { TicketsPageView } from "@/components/features/tickets/TicketsPageView";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const plain: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") plain[key] = value;
  }

  return <TicketsPageView searchParams={plain} />;
}
