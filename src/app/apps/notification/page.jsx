"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import PeakButton from "../../../components/button/button";
import apiUrl from "../../api/utils/apiUtils/apiUrl";
import {GetNotifications} from "@/app/api/actions/notifications/notifications";



const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });
  let org_id = null;
  if (typeof window !== 'undefined') {
    org_id = localStorage.getItem('selectedAccountId');
  }

  const fetchNotifications = async () => {
    try {
      const res = await GetNotifications(org_id, paginationModel.page+1, paginationModel.pageSize,)
      setNotifications(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = () => {
    // Implement the mark all as read functionality
  };

  return (
    <div className="p-4 sm:ml-64 h-screen">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="mt-4 font-medium text-lg sm:text-xl">Notifications</p>
            <button
              onClick={markAllAsRead}
              className="mt-2 sm:mt-0 bg-gray-300 text-blue text-sm sm:text-base rounded p-2 shadow-sm outline-none border-blue-1000"
            >
              Mark all as read
            </button>
          </div>

          <div className="mt-4">
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : (
              <div className="space-y-4">
                {notifications.data.length === 0 ? (
                  <p className="text-center">No notifications</p>
                ) : (
                  notifications.data.map((notification, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow dark:bg-gray-700">
                      <div className="flex items-center space-x-4">
                        {/* Replace the SVG placeholder with your actual SVG image */}
                        <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6l4 2m0 0l-4 2m4-2H8"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                            Notification Channel: {notification.channel}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                      <button
                        className="mt-2 sm:mt-0 text-sm sm:text-base bg-[#090A29] text-white rounded px-4 py-2 hover:bg-[#0a0b2f] dark:bg-[#090A29] dark:text-white dark:hover:bg-[#0a0b2f]"
                      >
                        Go to Page
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
