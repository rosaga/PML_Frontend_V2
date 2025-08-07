"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { contactCreate } from "@/app/api/actions/contact/contact";

const NewContactModal = ({ closeModal, onSuccess, hideGoToButton = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [, , service] = pathname.split("/");

  const [firstname, setFirstName]     = useState("");
  const [lastname, setLastName]       = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage]     = useState("");

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  const handleCreate = async (e) => {
    e.preventDefault();

    const newContact = {
      mobile_no: phoneNumber,
      metadata: {
        FIRSTNAME: firstname,
        LASTNAME: lastname,
      },
    };

    try {
      const res = await contactCreate({ org_id, newContact });
      if (res.status === 201) {
        setSuccessMessage(`Contact ${phoneNumber} has been created`);
        setErrorMessage("");
        
        if (onSuccess && res.data) {
          onSuccess(res.data);
        }
      } else if (res.status === 400) {
        setErrorMessage("Contact already exists.");
        setSuccessMessage("");
      } else {
        setErrorMessage("Failed to create contact. Please try again.");
        setSuccessMessage("");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setErrorMessage("Contact already exists.");
      } else {
        setErrorMessage(`Unexpected error: ${error.message}`);
      }
      setSuccessMessage("");
    }
  };

  const goToDispatch = () => {
    closeModal();

    let target = "";
    switch (service) {
      case "data":
        target = `/apps/data/data-rewards?tab=Rewards`;
        break;
      case "airtime":
        target = `/apps/airtime/airtime-rewards?tab=Campaign`;
        break;
      case "sms":
        target = `/apps/sms/messages`;
        break;
      case "flowbot":
        target = `/apps/flowbot/flowbuilder`;
        break;
      default:
        target = `/apps/${service}`;
    }

    router.push(target);
  };

  const handleSuccessClose = () => {
    setSuccessMessage("");
    closeModal();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal") {
        closeModal();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [closeModal]);

  return (
    <div
      id="authentication-modal"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          {successMessage ? (
            <div className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-semibold text-green-500">
                Success!
              </h2>
              <p className="mb-6 text-gray-900 dark:text-white">
                {successMessage}
              </p>
              <div className={`flex space-x-2 ${hideGoToButton ? 'justify-center' : ''}`}>
                <button
                  onClick={handleSuccessClose}
                  className={`${hideGoToButton ? 'w-auto px-8' : 'w-full'} text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5`}
                >
                  {hideGoToButton ? 'Close' : 'Cancel'}
                </button>
                {!hideGoToButton && (
                  <button
                    onClick={goToDispatch}
                    className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Go to{" "}
                    {service.charAt(0).toUpperCase() + service.slice(1)} Dispatch
                  </button>
                )}
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <h2 className="mb-4 text-2xl font-semibold text-red-500">
                Oops!
              </h2>
              <p className="mb-6 text-gray-900 dark:text-white">
                {errorMessage}
              </p>
              <button
                onClick={() => setErrorMessage("")}
                className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5"
              >
                OK
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  New Contact
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0711438911"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="firstname"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="First Name"
                      value={firstname}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastname"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Last Name"
                      value={lastname}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  {errorMessage && (
                    <p className="text-red-500 text-sm">{errorMessage}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewContactModal;