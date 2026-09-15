import { redirect } from "next/navigation";
export default function RedirectPage({ params }: { params: { id: string } }) {
  redirect(`/apps/whatsapp/campaigns/${params.id}`);
}
