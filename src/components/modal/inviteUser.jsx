"use client";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import apiUrl from "../../app/api/utils/apiUtils/apiUrl";
import "react-toastify/dist/ReactToastify.css";
import { getToken } from "@/utils/auth";

const InviteUserModal = ({ closeModal }) => {

  let org_id = null;
  let token = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
    token = getToken();
  }

  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstname) newErrors.firstname = "First name is required";
    if (!lastname) newErrors.lastname = "Last name is required";
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email address";
    }
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
     if (!validateForm()) {
      return;
    }
    setIsLoading(true)

    const invitePayload = {
      firstname: firstname,
      lastName: lastname,
      email: email,
      credentials: [
          {
              type: "password",
              value: password,
              temporary: false
          }
      ]
  }

    try {
      const res = await axios.post(`${apiUrl.USERS}/${org_id}/users`, invitePayload, {headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
        }
      });
      if (res.status === 202) {
        setIsLoading(false)
        toast.success("INVITE USER SUCCESS")
      } else {
        setIsLoading(false)
        toast.error("INVITE USER FAILED")
      }
    } catch (error) {
      setIsLoading(false)
      toast.error("INVITE USER FAILED")
    }
  };

      
  return (
    <>
    <ToastContainer />
    <div
      id="authentication-modal"
      tabIndex="-1"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-screen bg-black bg-opacity-50"
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invite New User
            </h3>
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={closeModal}
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
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
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-4 md:p-5">
            <form className="space-y-2" action="#">
            <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Your First Name *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 mt-2 rounded-md border-white"
                  value={firstname}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstname && <p className="text-red-500 text-xs mb-4">{errors.firstname}</p>}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Your Last Name *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                  value={lastname}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastname && <p className="text-red-500 text-xs mb-4">{errors.lastname}</p>}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Your Email *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <p className="text-red-500 text-xs mb-4">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Your Password *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <p className="text-red-500 text-xs mb-4">{errors.password}</p>}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Your Password *"
                  className="w-full bg-[#F1F2F3] p-2.5 mb-1 rounded-md border-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mb-4">{errors.confirmPassword}</p>}
              </div>
              
              <div className="flex space-x-2">
                  <button
                    type="button"
                    className="w-full text-white bg-gray-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    onClick={handleInvite}
                  >
                    {isLoading ? "Inviting..." : "Invite"}
                  </button>
                </div>

            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default InviteUserModal;
