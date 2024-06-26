"use client";
import React, { useState, useEffect } from "react";

const Reports = () => {
  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="flex flex-col h-full">
        <div className="flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Reports</p>
            </div>

            <div className="flex flex-col items-center justify-center h-screen text-center p-6">
              <h1 className="text-4xl font-bold mb-4">🛠️ Oops! 🚧</h1>
              <p className="text-xl mb-4">
                We're busy brewing up something awesome here!
              </p>
              <img
                src="https://via.placeholder.com/400x300?text=Under+Construction"
                alt="Under Construction!"
                className="mb-4"
              />
              <p className="text-lg text-gray-700 mb-2">
                Our developers are working like elves on double espresso. Please
                check back soon!
              </p>
              <p className="text-lg text-gray-700">
                In the meantime, feel free to enjoy this placeholder text and
                imagine the possibilities!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;