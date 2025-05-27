import React, { useEffect, useState } from "react";
import { provisionSmsUnits } from "@/app/api/actions/reward/reward";
import { GetBalance } from "@/app/api/actions/reward/reward";
import { ToastContainer, toast } from 'react-toastify';
import { messageBalanceAction } from "@/app/api/actions/messages/messagesAction";
import { GetAllOrgUnits } from "@/app/api/actions/senderId/senderId";

const ProvisionSmsUnitsModal = ({ closeModal }) => {
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const [successMessage, setSuccessMessage] = useState("");
  const [bundles, setBundles] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [loading, setLoading] = useState(true);


  const getSmsBalance = () => {
      if (org_id) {
        messageBalanceAction({ org_id })
          .then((res) => {
            if (res.errors) {
              console.log("AN ERROR HAS OCCURED");
            } else {
              console.log("Balance is", res)
              setTotalBalance(res.data.balance);
              
              setLoading(false);
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        console.log("org_id is null or undefined. Skipping API call.");
      }
    };

    const getOrgUnits = async () => {
        try {
          const res = await GetAllOrgUnits(org_id);
          if (res.errors) {
            setLoading
            console.log("AN ERROR HAS OCCURRED");
          } else {
            setLoading(false);
            setOrganizations(res.data);
          }
        } catch (err) {
          console.log(err);
        }
      };
    
      useEffect(() => {
        getOrgUnits();
      }, []);


  const initialState = {
    package: "@1 Persms",
    units: "",
    application_id:""
  };

  const [state, setState] = React.useState(initialState);

  const handleChange = (e) => {
    const value = e.target.value;
    setState({
      ...state,
      [e.target.name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRequest = {
      package: state.package,
      units: parseInt(state.units),
      application_id: selectedOrgId || org_id,
    };

    const res = provisionSmsUnits({ newRequest }).then((res) => {
      if (res.status === 201) {
        closeModal()
        toast.success("UNITS PROVISIONING SUCCESS");
      } else {
        // closeModal()
        toast.error("REQUEST FAILED")
      }
    });
    setState(initialState);
    return res;
  };

   useEffect(() => {
      getSmsBalance();
    }, []);

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
              PROVISION UNITS
            </h3>
          </div>
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              Current Balance: {totalBalance}
            </h4>
          </div>
          <div className="p-4 md:p-5 space-y-4">
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
                  className="w-full text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  OK
                </button>
              </div>
            ) : (
              <>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label
                      htmlFor="organization"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Select Organization
                    </label>
                    <select
                      id="organization"
                      name="organization"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    >
                      <option value="">-- Select Organization --</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="numberOfUnits"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Enter No of Units
                    </label>
                    <input
                    type="number"
                    name="units"
                    id="units"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder="100"
                    onChange={handleChange}
                    value={state.units}
                    required
                  />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="w-full text-white bg-orange-400 hover:bg-orange-500 focus:ring-4 focus:outline-none focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-800"
                    >
                      Provision
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProvisionSmsUnitsModal;
