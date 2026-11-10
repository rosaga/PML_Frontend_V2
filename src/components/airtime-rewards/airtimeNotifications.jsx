"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { GetAirtimeNotifications } from "@/app/api/actions/airtimeReward/airtimeSettings";
import { useOrganizationQuery } from "@/lib/airtime/useOrganizationQuery";
import NotificationEmailSetting from "@/components/notifications/notification-email-setting";

function timestamp(value) {
  try { return format(parseISO(value), "yyyy-MM-dd HH:mm"); }
  catch { return ""; }
}

export default function AirtimeNotifications() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(async (orgId) => (await GetAirtimeNotifications(orgId, page, pageSize)).data, [page]);
  const { data, error, loading, orgId } = useOrganizationQuery(load, { pollInterval: 30000, events: "airtime-notifications-updated airtime-updated" });
  const notifications = data?.data || [];

  return (
    <div className="p-4 lg:ml-64 min-h-screen">
      <div className="p-4">
        <p className="mt-4 mb-4 font-medium text-lg sm:text-xl">Notifications</p>
        <NotificationEmailSetting />
        {!orgId && <p>Select an organization first.</p>}
        {error && <p role="alert" className="text-red-500">{error}</p>}
        {loading && !data && <p className="text-center">Loading...</p>}
        {data && <div className="space-y-4">
          {!notifications.length && <p className="text-center">No notifications</p>}
          {notifications.map((notification, index) => {
            const isThreshold = notification.notification_type === "ACCOUNT_THRESHOLD";
            const isAlert = isThreshold || notification.status === "ALERT";
            return (
              <div key={`${notification.created_at || "notification"}-${index}`}
                className={`p-4 rounded-lg shadow dark:bg-gray-700 ${isAlert ? "bg-orange-50 border border-orange-300" : "bg-white"}`}>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                  {isThreshold ? "Balance threshold alert" : `Notification Channel: ${notification.channel || "INAPP"}`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{notification.content}</p>
                <time dateTime={notification.created_at} className="text-xs text-gray-500">{timestamp(notification.created_at)}</time>
                {isThreshold && !/^DATA\b/i.test(notification.content || "") && <Link href="/apps/airtime/airtime-topup" className="block mt-2 text-sm font-medium text-orange-600 underline">Top up airtime</Link>}
              </div>
            );
          })}
        </div>}
        {!!data?.count && <div className="flex items-center gap-4 mt-4">
          <button type="button" className="p-2 border rounded disabled:opacity-50" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {Math.max(1, Math.ceil(data.count / pageSize))}</span>
          <button type="button" className="p-2 border rounded disabled:opacity-50" disabled={page * pageSize >= data.count || loading} onClick={() => setPage(page + 1)}>Next</button>
        </div>}
      </div>
    </div>
  );
}
