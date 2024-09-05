// components/SignIn.js
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, LinearProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {GetAccounts} from '../api/actions/accounts/accounts'
import '../../app/globals.css';
import { GetSenderId } from "../api/actions/sms/sms";
import { set } from 'date-fns';
import Modal from '@mui/material/Modal';


const UserOrgs = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);


  const getAccounts = async () => {
    try {
      const res = await GetAccounts();
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        setAccounts(res.data);
        setIsLoaded(true);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const getSenderIds = async (org_id) => {
    try {
      const res = await GetSenderId(org_id);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        if (res.data.length === 0) {
          setSignInSuccess(true);
        } else {
          router.push("/apps/dashboard");
        }
        setIsLoaded(true);
      }
    } catch (err) {
      console.log(err);
    }
  };


  useEffect(() => {
      getAccounts();
  }, []);

  const handleAccountClick = (account) => {
    setIsLoading(true);
    getSenderIds(account.id);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedAccountId');
      localStorage.removeItem('selectedAccountName');
      localStorage.removeItem('signupEmail');
      localStorage.setItem('selectedAccountId', account.id);
      localStorage.setItem('selectedAccountName', account.name);
      }
  };
  const handleCloseModal = () => {
    router.push("/apps/dashboard"); 
    setSignInSuccess(false);
  };

  const goToSettings = () => {
    router.push("/apps/settings");
  };

  return (
    <>
    <div
      className="relative h-screen w-full flex flex-col sm:flex-row items-center"
      style={{
        backgroundImage: "url('/images/onblogin.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="hidden sm:block sm:w-2/5 h-full"></div>

      <div className="w-full sm:w-3/5 h-full flex items-center justify-center p-4">
        <Card
          sx={{
            borderRadius: 'lg',
            boxShadow: 'md',
            width: '90%',
            maxWidth: '500px', // Set a max width for larger screens
            padding: 2,
          }}
        >
          <CardContent>
            <div className="flex flex-col">
              <p className="text-xl font-lg mb-4 mt-2 text-center">
                Select An Account
              </p>
              <div className="space-y-4">
                {isLoaded ? (
                  accounts.map((account) => (
                    <button
                      key={account.id}
                      className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white shadow-sm"
                      onClick={() => handleAccountClick(account)}
                    >
                      {isLoading ? "loading..." : account.name}
                    </button>
                  ))
                ) : (
                  <p className="text-center">Loading accounts...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <Modal
        open={signInSuccess}
        onClose={handleCloseModal}
        className="flex items-center justify-center"
      >
        <div className="bg-white p-10 rounded-2xl  shadow-2xl  relative max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4 text-lefte">
            Congratulations!
          </h2>
          <h3 className="text-[#E88A17] text-xl font-semibold mb-2 text-left">
            Set up your Sender ID
          </h3>
          <p className="text-left text-base mb-6">
            By continuing to our settings page and completing the sender ID
            form!
          </p>
          <button
            className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
            onClick={goToSettings}
          >
            Go to settings
          </button>
        </div>
      </Modal>
    </>
  );
};

export default UserOrgs;