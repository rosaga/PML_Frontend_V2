import { redirect } from "next/navigation";
export default function RedirectPage({ params }: { params: { groupId: string } }) {
  redirect(`/apps/whatsapp/groups/${params.groupId}`);
}
