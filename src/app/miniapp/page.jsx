'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { GetSenderId } from "../api/actions/senderId/senderId";
import '../../app/globals.css';

const MiniApp = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const router = useRouter();

  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const getSenderIds = async (org_id) => {
    if (!org_id) return;
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
    if (selectedOption) return;
    setSelectedOption(option);

    setTimeout(() => {
      switch (option) {
        case 'data':
          router.push('/apps/data/dashboard');
          break;
        case 'airtime':
          // router.push('/apps/airtime/dashboard');
          break;
        case 'sms':
          router.push('/apps/sms/dashboard');
          break;
        case 'whatsapp':
          // router.push('/apps/whatsapp/dashboard');
          break;
        default:
          break;
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Page Title */}
      <img src="images/peaklogo.svg" alt="Company Logo" className="w-60 h-60 mb-4" />

      <Typography variant="h5" className="font-semi-bold mb-6">
        Please Select a Product
      </Typography>

      {/* Grid of 4 product options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl w-full">
        
        {/* Data Rewards */}
        <Card
          onClick={() => handleOptionSelect('data')}
          className={`cursor-pointer transition-shadow duration-200 ${
            selectedOption && selectedOption !== 'data' ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'
          }`}
          sx={{ borderRadius: 1, textAlign: 'center', padding: 2, background: '#4B465C0A' }}
        >
          <CardContent>
            {selectedOption === 'data' ? (
              <Box className="flex justify-center items-center h-32">
                <CircularProgress size={40} sx={{ color: '#FF9800' }} />
              </Box>
            ) : (
              <Box className="flex flex-col items-center justify-center">
                <img src="images/data.svg" alt="Data Icon" className="w-10 h-10 mb-2" />
                <Typography variant="h6" className="font-semi-bold mt-2">
                  Data Rewards
                </Typography>
                <Typography variant="body2" style={{ color: '#4B465C' }}>
                  Use Mobile Data to Attract, Engage and Retain Customers
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Airtime Rewards */}
        <Card
          // onClick={() => handleOptionSelect('airtime')}
          // className={`cursor-pointer transition-shadow duration-200 ${
          //   selectedOption && selectedOption !== 'airtime' ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'
          // }`}
          sx={{ borderRadius: 1, textAlign: 'center', padding: 2, background: '#4B465C0A' }}
        >
          <CardContent>
            {selectedOption === 'airtime' ? (
              <Box className="flex justify-center items-center h-32">
                {/* <CircularProgress size={40} sx={{ color: '#FF9800' }} /> */}
              </Box>
            ) : (
              <Box className="flex flex-col items-center justify-center">
                <img src="images/airtime.svg" alt="Airtime Icon" className="w-10 h-10 mb-2" />
                <Typography variant="h6" className="font-semi-bold mt-2">
                  Airtime Rewards
                </Typography>
                <Typography variant="body2" style={{ color: '#4B465C' }}>
                  Reward your customers with Free Airtime
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Bulk SMS */}
        <Card
          onClick={() => handleOptionSelect('sms')}
          className={`cursor-pointer transition-shadow duration-200 ${
            selectedOption && selectedOption !== 'sms' ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'
          }`}
          sx={{ borderRadius: 1, textAlign: 'center', padding: 2, background: '#4B465C0A' }}
        >
          <CardContent>
            {selectedOption === 'sms' ? (
              <Box className="flex justify-center items-center h-32">
                <CircularProgress size={40} sx={{ color: '#FF9800' }} />
              </Box>
            ) : (
              <Box className="flex flex-col items-center justify-center">
                <img src="images/message.svg" alt="SMS Icon" className="w-10 h-10 mb-2" />
                <Typography variant="h6" className="font-semi-bold mt-2">
                  Bulk SMS
                </Typography>
                <Typography variant="body2" style={{ color: '#4B465C' }}>
                  Run SMS marketing campaigns with ease
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Bots */}
        <Card
          // onClick={() => handleOptionSelect('whatsapp')}
          // className={`cursor-pointer transition-shadow duration-200 ${
          //   selectedOption && selectedOption !== 'whatsapp' ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'
          // }`}
          sx={{ borderRadius: 1, textAlign: 'center', padding: 2, background: '#4B465C0A' }}
        >
          <CardContent>
            {selectedOption === 'whatsapp' ? (
              <Box className="flex justify-center items-center h-32">
                <CircularProgress size={40} sx={{ color: '#FF9800' }} />
              </Box>
            ) : (
              <Box className="flex flex-col items-center justify-center">
                <img src="images/sms.svg" alt="WhatsApp Icon" className="w-10 h-10 mb-2" />
                <Typography variant="h6" className="font-semi-bold mt-2">
                  WhatsApp Bots
                </Typography>
                <Typography variant="body2" style={{ color: '#4B465C' }}>
                  Create WhatsApp conversations to support & engage your customers
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MiniApp;
