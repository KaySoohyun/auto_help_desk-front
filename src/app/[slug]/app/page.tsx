import { redirect } from "next/navigation";

export default async function AppHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/app/tickets`);
}
