import Sidebar from "@/components/sidebar/sidebar";
import React from "react";

const Dashboard = () => {
  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="p-4 border-2 border-gray-200 h-full border-dashed rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <p className="m-1 font-semibold text-lg">Summary Tiles</p>
          <p className="m-1 text-md">Data Rewards Summary</p>
          <div className="grid grid-cols-4 gap-4 my-4">
            <div className="border-2 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>Window ONE</div>
                <div>
                  <span>ICON</span>
                </div>
              </div>
              <div>Additional text goes here</div>
            </div>
            <div className="border-2 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>Window ONE</div>
                <div>
                  <span>ICON</span>
                </div>
              </div>
              <div>Additional text goes here</div>
            </div>
            <div className="border-2 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>Window ONE</div>
                <div>
                  <span>ICON</span>
                </div>
              </div>
              <div>Additional text goes here</div>
            </div>
            <div className="border-2 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>Window ONE</div>
                <div>
                  <span>ICON</span>
                </div>
              </div>
              <div>Additional text goes here</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="border-2 shadow-md font-semibold text-md p-6">Data Balance</div>
            <div className="flex flex-col gap-4">
              <div className="border-2 p-6">Row One</div>
              <div className="border-2 p-6">Row Two</div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border-2 p-8">First Row A</div>
            <div className="border-2 p-8">First Row B</div>
            <div className="border-2 p-8">First Row C</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
