import Sidebar from "@/components/sidebar/sidebar";
import React from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";

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

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="p-4 h-full rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div className="border-2 rounded-3xl">
            <div className="p-8">
              <p className="m-1 font-semibold text-lg">Summary Tiles</p>
              <p className="m-1 text-md">Data Rewards Summary</p>
            </div>

            <div className="grid grid-cols-4 gap-4 p-8">
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Recipients Reached</div>
                  <div>
                    <span>ICON</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">20</div>
              </div>
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Consumed Data</div>
                  <div>
                    <span>ICON</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">10,000 MBS</div>
              </div>
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Active Campaigns</div>
                  <div>
                    <span>ICON</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">5</div>
              </div>
              <div className="border-1 shadow-lg rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500">Failed Campaigns</div>
                  <div>
                    <span>ICON</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">8</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 my-4 p-8">
            <div className="border-2 shadow-md font-semibold text-md p-6">
              <p className="mt-4 font-medium text-lg">Data Balance</p>

              <div className="mt-4">
                <div style={{ height: 350, width: "100%" }}>
                  <DataGrid rows={rows} columns={columns} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="border-2 p-6">Row One</div>
              <div className="border-2 p-6">Row Two</div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="p-8">
              <p className="mt-4 font-medium text-lg">Recent Recipients</p>

              <div className="mt-4">
                <div style={{ height: 350, width: "100%" }}>
                  <DataGrid rows={rows} columns={columns} />
                </div>
              </div>
            </div>
            <div className="p-8">
              <p className="mt-4 font-medium text-lg">Recent Groups</p>

              <div className="mt-4">
                <div style={{ height: 350, width: "100%" }}>
                  <DataGrid rows={rows} columns={columns} />
                </div>
              </div>
            </div>
            <div className="p-8">
              <p className="mt-4 font-medium text-lg">Recent Campaigns</p>

              <div className="mt-4">
                <div style={{ height: 350, width: "100%" }}>
                  <DataGrid rows={rows} columns={columns} />
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
