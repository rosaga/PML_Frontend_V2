import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { TERMS_DOCUMENT_HREF } from "@/lib/policies";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-3 sm:px-10">
        <Link href="/miniapp" aria-label="Peak Mobile products">
          <Image src="/images/peaklogo.png" alt="Peak Mobile" width={112} height={63} />
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <Link href="/miniapp" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#945003] focus-visible:outline-[#945003]">
          <ArrowLeft size={16} aria-hidden="true" /> Back to products
        </Link>
        <div className="my-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#001F3D]">Terms and Conditions</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">Please review the terms for using Peak Mobile&apos;s services.</p>
          </div>
          <a href={TERMS_DOCUMENT_HREF} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 w-fit shrink-0 items-center gap-2 rounded-xl bg-[#090A29] px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-[#E88A17]">
            Open PDF <ExternalLink size={16} aria-hidden="true" />
            <span className="sr-only"> in a new tab</span>
          </a>
        </div>
        <iframe
          src={TERMS_DOCUMENT_HREF}
          title="Peak Mobile Terms and Conditions"
          className="h-[75vh] min-h-[480px] w-full rounded-lg border border-gray-200 bg-white"
        />
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Can&apos;t see the document?{" "}
          <a href={TERMS_DOCUMENT_HREF} target="_blank" rel="noopener noreferrer" className="font-medium text-[#945003] underline underline-offset-4 focus-visible:outline-[#945003]">
            Open the terms and conditions PDF in a new tab.
          </a>
        </p>
      </main>
    </div>
  );
}
