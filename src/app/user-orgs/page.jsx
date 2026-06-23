'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetAccounts } from '../api/actions/accounts/accounts';
import '../../app/globals.css';
import { GetSenderId } from '../api/actions/senderId/senderId';

const UserOrgs = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const getAccounts = async () => {
    try {
      const res = await GetAccounts();

      if (res.errors) {
        console.log('AN ERROR HAS OCCURRED');
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
        console.log('AN ERROR HAS OCCURRED');
      } else {
        setSignInSuccess(true);
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
    setSelectedAccount(account);
    setShowOptionModal(true);
    setIsLoading(true);
    getSenderIds(account.id);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedAccountId');
      localStorage.removeItem('selectedAccountName');
      localStorage.removeItem('signupEmail');
      localStorage.setItem('selectedAccountId', account.id);
      localStorage.setItem('selectedAccountName', account.name);
    }

    router.push('/miniapp');
  };

  const handleCloseOptionModal = () => {
    setShowOptionModal(false);
  };

  const getInitial = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F2EE] overflow-hidden">
      {/* Header */}
      <div className="relative bg-[#0D1B3E] h-[245px] pl-[40px] sm:pl-[80px] pr-6 sm:pr-10 pt-10">
        <img
          src="/images/Peakwhite.png"
          alt="Peak Mobile"
          className="w-[130px] h-auto object-contain mb-8"
        />

        <h1 className="text-white text-[22px] sm:text-[32px] leading-[1.05] font-extrabold tracking-[-1.5px] max-w-[420px]">
          Select an{' '}
          <span className="text-[#F4822A]">
            account
          </span>
          <br />
          to continue
        </h1>

        <svg
          className="absolute bottom-[-1px] left-0 w-full h-[42px]"
          viewBox="0 0 1440 42"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 42 C360 8 1080 8 1440 42 L1440 42 L0 42Z"
            fill="#F5F2EE"
          />
        </svg>
      </div>

      {/* Body */}
      <div className="w-full flex justify-center px-5 pt-10 sm:pt-12">
        <div className="w-full max-w-[470px]">
          <p className="text-[#9E9E9E] text-[13px] font-bold tracking-[3px] mb-5">
            YOUR ACCOUNTS
          </p>

          <div className="space-y-4">
            {isLoaded ? (
              accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleAccountClick(account)}
                  className="w-full bg-white rounded-[14px] px-6 py-5 flex items-center justify-between shadow-[0_8px_22px_rgba(13,27,62,0.08)] border border-[#F1EEE8] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_12px_28px_rgba(13,27,62,0.12)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-[46px] h-[46px] rounded-[12px] bg-[#FFF0E6] flex items-center justify-center text-[#F4822A] text-[21px] font-extrabold">
                      {getInitial(account.name)}
                    </div>

                    <span className="text-[#0D1B3E] text-[16px] sm:text-[17px] font-bold">
                      {isLoading ? 'loading...' : account.name}
                    </span>
                  </div>

                  <span className="text-[#D7D7D7] text-[30px] leading-none font-light">
                    ›
                  </span>
                </button>
              ))
            ) : (
              <div className="bg-white rounded-[14px] px-6 py-6 shadow-[0_8px_22px_rgba(13,27,62,0.08)] border border-[#F1EEE8]">
                <p className="text-center text-[#0D1B3E] font-semibold">
                  Loading accounts...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrgs;