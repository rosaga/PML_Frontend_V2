"use client"
import React, {useEffect,useState}from "react";
import Image from "next/image";
import Profile from "../profile/profile";

const Navbar = () => {
  let org_id = null;
  let name = null
 

  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
       name = localStorage.getItem('selectedAccountName');
      org_id = localStorage.getItem('selectedAccountId');
      setAccountName(name);
    }
  }, []);
  return (
    <div class="flex justify-between items-center mt-2 mb-0 mr-8 sm:ml-64">
      <div className="ml-8">
        <p className="text-xl font-bold">{accountName}</p>
      </div>
      <div class="flex space-x-8">
        <div>
            <span>
            <Image
                        style={{ color: "#F58426" }}
                        className="w-10 h-10  rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Settings.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
            </span>
        </div>
        <div>
        <span>
            <Image
                        style={{ color: "#F58426" }}
                        className="w-10 h-10  rounded-lg "
                        width={60}
                        height={60}
                        src="/images/or_noti.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
            </span>
        </div>
        <div>
            <Profile/>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
