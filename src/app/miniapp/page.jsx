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
            <div className="relative h-screen w-full flex flex-col sm:flex-row items-center"
              style={{
                backgroundImage: "url('/images/onb1.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8"> 
                        <button
                          className="flex flex-col items-center justify-center space-y-4"  
                          onClick={() => handleOptionSelect('data')}
                        >
                          <span className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full text-white"> {/* Increased icon size */}
                            <img src="images/4g.jpg" alt="Data Icon" />
                          </span>
                          <span className="text-center text-base font-semibold">Bulk Data</span> 
                        </button>
                        <button
                          className="flex flex-col items-center justify-center space-y-4"
                          onClick={() => handleOptionSelect('sms')}
                        >
                          <span className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full text-white">
                            <img src="/images/chat.jpg" alt="SMS Icon" />
                          </span>
                          <span className="text-center text-base font-semibold">SMS Connect</span>
                        </button>
                        <button
                          className="flex flex-col items-center justify-center space-y-4"
                          onClick={() => handleOptionSelect('flow-builder')}
                        >
                          <span className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full text-white">
                            <img src="/images/whatapp.jpg" alt="Flowbot Icon" />
                          </span>
                          <span className="text-center text-base font-semibold">WhatsApp Flowbot (Coming Soon)</span>
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
