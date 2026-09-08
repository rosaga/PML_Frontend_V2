"use client";

import { useConfig } from "@/lib/whatsapp/config-context";

export function TokenExpiryGuard({ children }: { children: React.ReactNode }) {
  const { pmlTokenExpired, pmlLoginUrl } = useConfig();

  return (
    <>
      {children}
      {pmlTokenExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl text-center">
            <div className="mb-5 flex items-center justify-center">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-4">
                <svg className="h-9 w-9 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Session Expired
            </h2>
            <p className="mb-7 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Your PeakMobile session has expired. Please log back in to continue using the app.
            </p>
            <button
              onClick={() => { window.location.href = pmlLoginUrl(); }}
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 active:scale-95 transition-all"
            >
              Log in via PeakMobile
            </button>
          </div>
        </div>
      )}
    </>
  );
}
