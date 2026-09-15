import { redirect } from "next/navigation";
export default function RedirectPage({ params }: { params: { mobileNo: string } }) {
  redirect(`/apps/whatsapp/inbox/${params.mobileNo}`);
}
