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
            <div className="flex h-screen w-full   sm:flex-row "
              style={{
                backgroundImage: "url('/images/signin_background.jpeg')",
                backgroundSize: 'cover',
                backgroundPosition: 'relative',
              }}

         
            >
              <div className="hidden sm:block sm:w-2/5 h-full"></div>

              <div className="flex justify-center items-center h-full w-full">
                <Card
                  sx={{
                    borderRadius: 'lg',
                    boxShadow: 'md',
                    width: '100%',
                    maxWidth: '600px',  
                    minHeight: '300px',  
                    padding: 2,          
                  }}
                >
                  <CardContent>
                      <div className="flex flex-col">
                        <p className="text-2xl font-bold mb-6 mt-4 text-center">
                          Please Select A Product
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
                            {/* Bulk Data Icon */}
                            <button
                              className="flex flex-col items-center justify-center"
                              onClick={() => handleOptionSelect('data')}
                            >
                              <span className="flex items-center justify-center rounded-full text-white">
                                <img src="images/DATA EDITED.png" alt="Data Icon" className="w-30 h-30 object-cover" />
                              </span>
                              <span className="text-center text-base font-semibold mt-1">Bulk Data</span>
                            </button>

                            {/* SMS Connect Icon */}
                            <button
                              className="flex flex-col items-center justify-center"
                              onClick={() => handleOptionSelect('sms')}
                            >
                              <span className="flex items-center justify-center rounded-full text-white">
                                <img src="/images/BULK DATA SQUARE ICON.png" alt="SMS Icon" className="w-30 h-30 object-cover" />
                              </span>
                              <span className="text-center text-base font-semibold mt-1">SMS Connect</span>
                            </button>

                            {/* WhatsApp Flowbot Icon */}
                            <button
                              className="flex flex-col items-center justify-center"
                              onClick={() => handleOptionSelect('flow-builder')}
                            >
                              <span className="flex items-center justify-center rounded-full text-white">
                                <img src="/images/WHATASAPP ICON.png" alt="Flowbot Icon" className="w-40 h-40 object-cover" />
                              </span>
                              <span className="text-center text-base font-bold mt-1">
                                WhatsApp Flowbot (Coming Soon)
                              </span>
                            </button>
                          </div>

                      </div>
                    </CardContent>

                </Card>
              </div>
            </div>

    </>
  );
};

export default MiniApp;
