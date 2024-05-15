// Table.js
import React from 'react';
import MUIDataTable from 'mui-datatables';

const Datatable = ({ columns, options, data }) => {
  return (
    <div>
      <MUIDataTable columns={columns} data={data} options={options} />
    </div>
  );
};

export default Datatable;
