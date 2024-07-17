"use client";
import React, { useEffect, useState } from "react";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { CreateVouchers } from "@/app/api/actions/vouchers/vouchers";
import * as XLSX from 'xlsx';


const GenerateVoucherModal = ({ closeModal }) => {
  const [bundles, setBundles] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [voucherNumber, setVoucherNumber] = useState("");
  const { v4: uuidv4 } = require('uuid');
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  async function getBundles() {
    const balanceData = await GetBalance(org_id);
    if (balanceData) {
      setBundles(balanceData.data.data);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.id === "authentication-modal") {
        closeModal();
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [closeModal]);

  useEffect(() => {
    getBundles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newReward = {
      org_id: org_id,
      total: parseInt(voucherNumber),
      request_id: uuidv4(),
      bundle_size: selectedBundle,
    };

    try {
      const res = await CreateVouchers(newReward);
      if (res.status === 201) {
        setSuccessMessage(`The Voucher has been created and downloaded successfully.`);
        exportToExcel(res.data);
        setErrorMessage("");
      } else {
        setErrorMessage("Failed to create Vouchers. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Failed to create Vouchers. Please try again.");
    }
  };

  const exportToExcel = (voucherData) => {
    const worksheet = XLSX.utils.json_to_sheet(voucherData.map(v => ({
      Voucher_Code: v.voucher_code,
      Message: "To Redeem send this voucher code " + v.voucher_code + " to 24995"
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers");
    XLSX.writeFile(workbook, "vouchers_" + new Date().toISOString() + ".xlsx");
  };

  return (
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
              Generate Voucher
            </h3>
          </div>
          <div className="p-4 md:p-5">
            {successMessage ? (
              <div className="p-4 text-center">
                <div className="mb-4 text-2xl font-semibold text-green-500">
                  Success!
                </div>
                <div className="mb-4 text-gray-900 dark:text-white">
                  {successMessage}
                </div>
                <button
                  onClick={() => {
                    setSuccessMessage("");
                    closeModal();
                  }}
                  className="w-full text-white bg-orange-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  OK
                </button>
              </div>
            ) : (
              <form className="space-y-2" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="voucherNumber"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Number of vouchers to generate
                  </label>
                  <input
                    type="number"
                    id="voucherNumber"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="200"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="bundle"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Bundle Amount
                  </label>
                  <select
                    id="bundle"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    value={selectedBundle}
                    onChange={(e) => setSelectedBundle(e.target.value)}
                    required
                  >
                    <option value="">Select Bundle</option>
                    {bundles.map((bundle) => (
                      <option key={bundle.package} value={bundle.package}>
                        {bundle.module}
                      </option>
                    ))}
                  </select>
              </div>
              </div>
              
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
                    type="submit"
                    className="w-full text-white bg-orange-400 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  >
                    Submit
                  </button>
                </div>
            </form>
            </form>
            </>
              </form>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateVoucherModal;
