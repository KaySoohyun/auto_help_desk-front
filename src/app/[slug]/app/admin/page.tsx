import { redirect } from "next/navigation";

export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/app/admin/users`);
}
