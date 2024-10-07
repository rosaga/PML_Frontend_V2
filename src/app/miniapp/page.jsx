'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, LinearProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import '../../app/globals.css';
import { GetSenderId } from "../api/actions/senderId/senderId";
import Modal from '@mui/material/Modal';

const MiniApp = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }
  const getSenderIds = async (org_id) => {
    try {
      const res = await GetSenderId(org_id);
      if (res.errors) {
        console.log("AN ERROR HAS OCCURRED");
      } else {
        if (res.data.length === 0) {
          setSignInSuccess(true);
        }
        setIsLoaded(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // Since no API call is needed, setting isLoaded to true directly.
    getSenderIds(org_id);
    setIsLoaded(true);
  }, []);

  const handleOptionSelect = (option) => {
    if (option === 'data') {
      router.push('/apps/data/dashboard');
    } else if (option === 'airtime') {
      // router.push('/apps/airtime/dashboard');
    } else if (option === 'sms') {
      router.push('/apps/sms/dashboard');
    } else if (option === 'flow-builder') {
      // router.push('/apps/flow-builder/dashboard');
    }
  };

  return (
    <>
      <div
        className="relative h-screen w-full flex flex-col sm:flex-row items-center"
        style={{
          backgroundImage: "url('/images/onb1.png')",
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
              maxWidth: '500px',
              padding: 2,
            }}
          >
            <CardContent>
              <div className="flex flex-col">
                <p className="text-xl font-lg mb-4 mt-2 text-center">
                  Please Select A Product
                </p>
                <div className="space-y-4">
                  {isLoaded ? (
                    <>
                      <button
                        className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white shadow-sm text-left"
                        onClick={() => handleOptionSelect('data')}
                      >
                        <span className="text-green-500">✔</span> PEAK DATA
                      </button>
                      <button
                        className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white shadow-sm text-left"
                        onClick={() => handleOptionSelect('airtime')}
                      >
                        <span className="text-green-500">✔</span> PEAK AIRTIME
                      </button>
                      <button
                        className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white shadow-sm text-left"
                        onClick={() => handleOptionSelect('sms')}
                      >
                        <span className="text-green-500">✔</span> PEAK SMS
                      </button>
                      <button
                        className="w-full bg-[#F1F2F3] p-2.5 rounded-md border-white shadow-sm text-left"
                        onClick={() => handleOptionSelect('flow-builder')}
                      >
                        <span className="text-green-500">✔</span> PEAK FLOW BUILDER
                      </button>
                    </>
                  ) : (
                    <p className="text-center">Loading...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Existing Modal */}
      <Modal
        open={signInSuccess}
        onClose={() => setSignInSuccess(false)}
        className="flex items-center justify-center"
      >
        <div className="bg-white p-10 rounded-2xl shadow-2xl relative max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4 text-left">
            Congratulations!
          </h2>
          <h3 className="text-[#E88A17] text-xl font-semibold mb-2 text-left">
            Set up your Sender ID
          </h3>
          <p className="text-left text-base mb-6">
            By continuing to our settings page and completing the sender ID
            form!
          </p>
          <div className="flex justify-between space-x-4">
          <button
            className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
            onClick={() => router.push('/apps/data/senderId')}
          >
            Go to settings
          </button>
          <button
            className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
            onClick={() => setSignInSuccess(false)}
          >
            Cancel
          </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MiniApp;
