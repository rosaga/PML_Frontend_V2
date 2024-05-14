import Sidebar from "@/components/sidebar/sidebar";
import React from "react";

const Dashboard = () => {
  return (
    <div className="p-4 sm:ml-64 h-screen ">
        <div className="p-4 border-2 border-gray-200 h-full border-dashed rounded-lg dark:border-gray-700">
          
        
         
          <div className="flex flex-col h-full" >
          <p>Dashboard Page</p>
            <div className="grid grid-cols-4 gap-4 my-4">
              <div className="border-2 p-6">Window ONE</div>
              <div className="border-2 p-6">Window 2</div>
              <div className="border-2 p-6">Window 3</div>
              <div className="border-2 p-6">Window 4</div>
            </div>
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="border-2 shadow-md">First One</div>
              <div className="flex flex-col gap-4">
                <div className="border-2">Row One</div>
                <div className="border-2">Row Two</div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="border-2 p-8">
                First Row A
              </div>
              <div className="border-2 p-8">
                First Row B
              </div>
              <div className="border-2 p-8">
                First Row C
              </div>
            </div>
          </div>
       
          
        </div>
      </div>
     

  );
};

export default Dashboard;
