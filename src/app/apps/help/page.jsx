"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "flowbite-react";
import { FaHeadphones } from "react-icons/fa";
import Faqs from "../../../components/faqs/faq"

const Help = () => {
  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-0">
            <div className="flex h-screen w-full">
              <div className="flex-1 mt-8">
                <Image
                  style={{ color: "#F58426" }}
                  className="w-full h-2/3 rounded-lg"
                  width={80}
                  height={60}
                  src="/images/helpage.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Help"
                  priority
                />
                <div className="mt-12 ml-32">
                <p className="text-xl font-semibold">Still have questions ?</p>
                <p className="text-lg text-gray-400 mt-2 mb-2">
                  Reach out to us by contacting customer service
                </p>
                <Button>
                    <FaHeadphones className="mr-2 h-5 w-5 text-black" />
                    <p className="text-black"> +254 768 432 908</p>
                   
                </Button>
                <br/>
                <Button>
                    <FaHeadphones className="mr-2 text-black h-5 w-5" />
                    <p className="text-black"> +254 768 432 908</p>
                </Button>
                </div>
              </div>
              <div className="flex-1 mr-8 mt-4">
                <div className="p-4">
                <h3 className="text-3xl font-semibold"> Frequently Asked Questions</h3>
                <p className="text-lg text-gray-400 mt-2 mb-8">Questions you might ask about our service</p>
                <Faqs/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
