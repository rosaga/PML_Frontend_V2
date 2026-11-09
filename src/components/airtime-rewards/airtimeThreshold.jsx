"use client";

import React, { useEffect, useRef, useState } from "react";
import { airtimeThresholdPayload, SaveAirtimeThreshold } from "@/app/api/actions/airtimeReward/airtimeSettings";
import { getActiveOrganizationId } from "@/lib/airtime/organization";
import { useActiveOrganization } from "@/lib/airtime/useOrganizationQuery";
import NotificationEmailSetting from "@/components/notifications/notification-email-setting";

export default function AirtimeThreshold(props) {
  const orgId = useActiveOrganization();
  return orgId ? <ThresholdForm key={orgId} {...props} orgId={orgId} /> : <p>Select an organization first.</p>;
}

function ThresholdForm({ orgId, threshold, closeModal, onSaved }) {
  const [value, setValue] = useState(threshold?.threshold ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (inFlight.current || getActiveOrganizationId() !== orgId) return;
    let payload;
    try { payload = airtimeThresholdPayload({ threshold_value: value }); }
    catch (error) { setError(error.message); return; }
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    const current = () => mounted.current && getActiveOrganizationId() === orgId;
    try {
      const response = await SaveAirtimeThreshold({ org_id: orgId, ...payload });
      if (!current()) return;
      if (response.status !== 200) throw new Error("Unable to save the airtime threshold.");
      setSuccess(response.data?.message || "Threshold set successfully");
      // The balance page refetches the account from the airtime threshold event.
      onSaved?.();
    } catch (error) {
      if (current()) setError(error.message || "Unable to save the airtime threshold.");
    } finally {
      inFlight.current = false;
      if (current()) setSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="airtime-threshold-title" className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black/50">
      <div className="relative p-4 w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="bg-white rounded-lg shadow dark:bg-gray-700 p-5">
          <h3 id="airtime-threshold-title" className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Airtime notification threshold</h3>
          {!success && <NotificationEmailSetting />}
          {success ? <div className="space-y-4">
            <p role="status" className="text-green-600">{success}</p>
            <button type="button" onClick={closeModal} className="w-full bg-orange-400 text-white rounded-lg p-2.5">OK</button>
          </div> : <form onSubmit={save} className="space-y-4">
            <label htmlFor="thresholdValue" className="block text-sm font-medium text-gray-900 dark:text-white">Airtime balance threshold (KES)</label>
            <input id="thresholdValue" type="number" min="0" step="1" required value={value} onChange={(event) => setValue(event.target.value)} disabled={submitting}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5" />
            <p className="text-sm text-gray-500">Zero disables alerts. Alerts are sent when spending crosses a positive threshold.</p>
            {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={submitting} onClick={closeModal} className="w-full bg-gray-700 text-white rounded-lg p-2.5">Cancel</button>
              <button type="submit" disabled={submitting} className="w-full bg-orange-400 text-white rounded-lg p-2.5">{submitting ? "Saving…" : "Save"}</button>
            </div>
          </form>}
        </div>
      </div>
    </div>
  );
}
