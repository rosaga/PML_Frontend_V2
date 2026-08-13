"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";

const SERVICE_CONFIG = {
  DATA: {
    balanceLabel: "data",
  },
  SMS: {
    balanceLabel: "SMS",
  },
  AIRTIME: {
    balanceLabel: "airtime",
  },
};

const InsufficientBalanceModal = ({
  service = "DATA",
  description,
  onClose,
  onRequestUnits,
}) => {
  const serviceConfig =
    SERVICE_CONFIG[String(service).toUpperCase()] || SERVICE_CONFIG.DATA;
  const { balanceLabel } = serviceConfig;

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby="insufficient-balance-title"
      aria-describedby="insufficient-balance-description"
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "0.5rem",
          overflow: "hidden",
          backgroundImage: "none",
        },
      }}
    >
      <div className="bg-white dark:bg-gray-700">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-600">
          <h2
            id="insufficient-balance-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            Insufficient {balanceLabel} balance
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close insufficient balance dialog"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            <svg
              className="h-3.5 w-3.5"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <svg
              className="h-7 w-7 text-orange-600 dark:text-orange-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M10.3 3.8 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.8a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <p
            id="insufficient-balance-description"
            className="mx-auto max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-300"
          >
            {description || (
              <>
                Your current {balanceLabel} balance is too low to complete this
                action. Request more units to continue.
              </>
            )}
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 w-full rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 dark:focus:ring-gray-700"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={onRequestUnits}
              autoFocus
              className="min-h-11 w-full rounded-lg bg-[#F58426] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d96f12] focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-800"
            >
              Request more units
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default InsufficientBalanceModal;
