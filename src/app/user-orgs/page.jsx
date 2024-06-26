// components/SignIn.js
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, LinearProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {GetAccounts} from '../api/actions/accounts/accounts'
import '../../app/globals.css';

const UserOrgs = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const router = useRouter();

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

  useEffect(() => {
      getAccounts();
  }, []);

  const handleAccountClick = (account) => {
    
    router.push("/apps/dashboard");
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedAccountId');
      localStorage.setItem('selectedAccountId', account.id);
      localStorage.setItem('selectedAccountName', account.name)

      }
  };

  return (
    <div
      className="relative h-screen w-full flex items-center"
      style={{
        backgroundImage: "url('/images/onblogin.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-2/5 h-full"></div>
      <div className="w-3/5 h-full flex items-center justify-center mr-28">
        <Card
          sx={{
            borderRadius: 'lg',
            boxShadow: 'md',
            width: '60%',
            padding: 2,
          }}
        >
          <CardContent>
            <div>
              <p className="text-xl font-lg mb-4 mt-2 text-center">Select An Account</p>
              <div>
                {isLoaded ? (
                  accounts.map((account) => (
                    <button
                      key={account.id}
                      className="w-full bg-[#F1F2F3] p-2.5 mb-5 rounded-md border-white"
                      onClick={() => handleAccountClick(account)}
                    >
                      {account.name}
                    </button>
                  ))
                ) : (
                  <p>Loading accounts...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserOrgs;