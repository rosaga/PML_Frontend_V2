'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { GetSenderId } from "../api/actions/senderId/senderId";
import '../../app/globals.css';

const MiniApp = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
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
        setIsLoaded(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getSenderIds(org_id);
    setIsLoaded(true);
  }, []);

  const handleOptionSelect = (option) => {
    if (option === 'data') {
      router.push('/apps/data/dashboard');
    } else if (option === 'sms') {
      router.push('/apps/sms/dashboard');
    } else if (option === 'airtime') {
      router.push('/apps/airtime/dashboard');
    }
  };

  return (
    <div
      className="flex h-screen w-full sm:flex-row"
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
            padding: 2,
          }}
        >
          <CardContent>
            <div className="flex flex-col">
              <p className="text-2xl font-bold mb-6 mt-4 text-center">
                Please Select A Product
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bulk Data Card */}
                <Card
                  onClick={() => handleOptionSelect('data')}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  sx={{
                    borderRadius: 4,
                    padding: 1,
                    boxShadow: 1,
                    minWidth: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <img src="images/DATA EDITED.png" alt="Data Icon" className="w-40 h-40 mb-2" />
                  <Typography variant="h6" component="p" className="font-bold">
                    Bulk Data
                  </Typography>
                </Card>

                {/* SMS Connect Card */}
                <Card
                  onClick={() => handleOptionSelect('sms')}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  sx={{
                    borderRadius: 4,
                    padding: 1,
                    boxShadow: 1,
                    minWidth: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <img src="/images/BULK DATA SQUARE ICON.png" alt="SMS Icon" className="w-40 h-40 mb-2" />
                  <Typography variant="h6" component="p" className="font-bold">
                    SMS Connect
                  </Typography>
                </Card>

                {/* WhatsApp Flowbot Card */}
                <Card
                onClick={() =>'#'}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  sx={{
                    borderRadius: 4,
                    padding: 1,
                    boxShadow: 1,
                    minWidth: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <img src="/images/WHATASAPP ICON.png" alt="Flowbot Icon" className="w-15 h-15 mb-2" />
                  <Typography variant="h6" component="p" className="font-bold">
                    WhatsApp Flowbot (Coming Soon)
                  </Typography>
                </Card>

                {/* Airtime Rewards Card */}
                <Card
                  onClick={() => handleOptionSelect('airtime')}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  sx={{
                    borderRadius: 4,
                    padding: 1,
                    boxShadow: 1,
                    minWidth: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <img src="images/DATA EDITED.png" alt="Data Icon" className="w-40 h-40 mb-2" />
                  <Typography variant="h6" component="p" className="font-bold">
                    Airtime Rewards
                  </Typography>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MiniApp;
