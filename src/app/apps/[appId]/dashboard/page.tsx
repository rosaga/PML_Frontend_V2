import Sidebar from "@/components/sidebar/sidebar";
import React from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import Image from "next/image";
import Button from '@mui/material/Button';
import IosShareIcon from '@mui/icons-material/IosShare';

const Dashboard = () => {
  const rows: GridRowsProp = [
    {
      id: 1,
      first_name: "Allan",
      last_name: "Oluoch",
      email: "allan@gmail.com",
    },
    {
      id: 2,
      first_name: "Richard",
      last_name: "Osaga",
      email: "osaga@gmail.com",
    },
    {
      id: 3,
      first_name: "Victor",
      last_name: "Siderra",
      email: "siderra@gmail.com",
    },
    {
      id: 3,
      first_name: "Ryan",
      last_name: "Ashiruma",
      email: "ashiruma@gmail.com",
    },
  ];

  const columns: GridColDef[] = [
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
  ];

  const rows1: GridRowsProp = [
    {
      id: 1,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
    {
      id: 2,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
    {
      id: 3,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
    {
      id: 3,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
  ];

  const columns1: GridColDef[] = [
    { field: "date", headerName: "Date of Onboarding", flex: 1 },
    { field: "phone", headerName: "Phone No", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
  ];

  const rows2: GridRowsProp = [
    {
      id: 1,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
    {
      id: 2,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
    {
      id: 3,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
    {
      id: 3,
      date: "2024-05-16",
      phone: "0711223344",
      status: "ACTIVE",
    },
  ];

  const columns2: GridColDef[] = [
    { field: "date", headerName: "ID", flex: 1 },
    { field: "phone", headerName: "Group Name", flex: 1 },
    { field: "status", headerName: "No of Contacts", flex: 1 },
    { field: "phone", headerName: "Description", flex: 1 },
    { field: "status", headerName: "Date Created", flex: 1 },
  ];

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="border-2 rounded-3xl">
            <div className="p-8">
              <p className="m-1 font-semibold text-lg">Summary Tiles</p>
              <div className="flex items-center justify-between"><p className="m-1 text-md">Data Rewards Summary</p>
              <Button variant="outlined" startIcon={<IosShareIcon />}>
        Export
      </Button></div>
              
            </div>

            <div className="grid grid-cols-4 gap-4 p-8">
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Recipients Reached</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12  rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Icon.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">20</div>
              </div>
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Consumed Data</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12  rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Icon-1.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">10,000 MBS</div>
              </div>
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Active Campaigns</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12  rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Icon-1.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">5</div>
              </div>
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Failed Campaigns</div>
                  <div>
                    <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12  rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Icon-2.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">8</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 my-4 p-1">
            
            <div className="col-span-2 border-2 rounded-3xl shadow-md font-semibold text-md p-6">
              <p className="mt-2 font-medium text-lg">Data Balance</p>

              <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  sx={{
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#E5E4E2",
                    },
                    "&.MuiDataGrid-root": {
                      border: "none",
                    },
                  }}
                />
              </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="border-2 rounded-3xl shadow-md p-6">
              <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12 ml-4 rounded-lg "
                        width={60}
                        height={60}
                        src="/images/help.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
              <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-orange-400">Help</p>      
              </div>
              <div className="border-2 rounded-3xl shadow-md p-6">
              <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-12 h-12 ml-4 rounded-lg "
                        width={60}
                        height={60}
                        src="/images/noti.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
                    <p className="mt-2 mb-20 ml-4 text-3xl font-bold text-red-600">Notification</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="p-4 shadow-md rounded-lg">
              <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Recent Recipients</p>
              <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-8 h-8 ml-4 rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Expand.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
              </div>
              <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  sx={{
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#E5E4E2",
                    },
                    "&.MuiDataGrid-root": {
                      border: "none",
                    },
                  }}
                />
              </div>
              </div>
            </div>
            <div className="p-4 shadow-md rounded-lg mt-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Recent Groups</p>
              <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-8 h-8 ml-4 rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Expand.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
              </div>

              <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  sx={{
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#E5E4E2",
                    },
                    "&.MuiDataGrid-root": {
                      border: "none",
                    },
                  }}
                />
              </div>
              </div>
            </div>
            <div className="p-4 shadow-md rounded-lg mt-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="mt-4 font-medium text-lg">Recent Campaigns</p>
              <span>
                      <Image
                        style={{ color: "#F58426" }}
                        className="w-8 h-8 ml-4 rounded-lg "
                        width={60}
                        height={60}
                        src="/images/Expand.svg"
                        blurDataURL="/bluriconloader.png"
                        placeholder="blur"
                        alt="Recipients reached"
                        priority
                      />
                    </span>
              </div>

              <div className="mt-4">
              <div style={{ height: 350, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  sx={{
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#E5E4E2",
                    },
                    "&.MuiDataGrid-root": {
                      border: "none",
                    },
                  }}
                />
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
