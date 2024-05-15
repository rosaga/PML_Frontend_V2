// Users.js
import React from 'react';
import Table from '../../../../components/table/table';

const Users = () => {
  const columns = ['First Name', 'Last Name', 'Email'];

  const data = [
    ['Allan', 'Oluoch', 'allan@gmail.com'],
    ['Richard', 'Osaga', 'osaga@gmail.com'],
    ['Victor', 'Siderra', 'siderra@gmail.com'],
    ['Ryan', 'Ashiruma', 'ashiruma@gmail.com'],
  ];

  const options = {
    filterType: 'checkbox',
  };

  return (
    <div className="p-4 sm:ml-64 h-screen ">
      <div className="p-4 border-2 border-gray-200 h-full border-dashed rounded-lg dark:border-gray-700">
        <div className="flex flex-col h-full">
          <div>
            <p className="mt-2 font-bold text-lg">Zawadi Test Account</p>
          </div>

          <div className="flex flex-col">
            <div className="border-2 p-8">
              <p className="mt-2 font-medium text-md">Users</p>

              {/* <Table columns={columns} options={options} data={data} /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
