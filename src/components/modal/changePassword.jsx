"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { updatePassword } from "@/app/api/actions/user/password";
import { getToken } from "@/utils/auth";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleFields, setVisibleFields] = useState({});
  const currentPasswordRef = useRef(null);

  useEffect(() => {
    currentPasswordRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSubmitting, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setRequestError("");
  };

  const toggleVisibility = (field) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.currentPassword) nextErrors.currentPassword = "Current password is required.";
    if (!form.newPassword) nextErrors.newPassword = "New password is required.";
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = "New passwords do not match.";
    }
    if (form.currentPassword && form.currentPassword === form.newPassword) {
      nextErrors.newPassword = "New password must be different from your current password.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRequestError("");

    if (!validate()) return;

    const accessToken = getToken();
    if (!accessToken) return;

    setIsSubmitting(true);
    try {
      await updatePassword(form.currentPassword, form.newPassword, accessToken);
      await onSuccess();
    } catch (error) {
      if (error.status === 401 && error.message === "Unable to update password") {
        setRequestError("Your session is no longer valid. Please sign in again.");
      } else {
        setRequestError(error.message || "Unable to update password. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  const fields = [
    {
      id: "current-password",
      name: "currentPassword",
      label: "Current password",
      autoComplete: "current-password",
      ref: currentPasswordRef,
    },
    {
      id: "new-password",
      name: "newPassword",
      label: "New password",
      autoComplete: "new-password",
    },
    {
      id: "confirm-password",
      name: "confirmPassword",
      label: "Confirm new password",
      autoComplete: "new-password",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-700"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-600">
          <h2 id="change-password-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            Change password
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close change password dialog"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter your current password, then choose a new password.
          </p>

          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                {field.label}
              </label>
              <div className="relative">
                <input
                  ref={field.ref}
                  id={field.id}
                  name={field.name}
                  type={visibleFields[field.name] ? "text" : "password"}
                  value={form[field.name]}
                  onChange={handleChange}
                  autoComplete={field.autoComplete}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-describedby={errors[field.name] ? `${field.id}-error` : undefined}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 pr-11 text-sm text-gray-900 focus:border-[#F58426] focus:outline-none focus:ring-1 focus:ring-[#F58426] disabled:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(field.name)}
                  disabled={isSubmitting}
                  aria-label={`${visibleFields[field.name] ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-300"
                >
                  {visibleFields[field.name] ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors[field.name] && (
                <p id={`${field.id}-error`} className="mt-1 text-xs text-red-600" role="alert">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {requestError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200" role="alert">
              {requestError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#001F3D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#00315f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
