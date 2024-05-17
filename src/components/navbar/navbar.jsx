import React from "react";

const Navbar = () => {
  return (
    <div class="flex justify-between items-center mt-1 mb-0 mr-8 sm:ml-64">
      <div class="w-12 h-12 bg-blue-500 ml-8"></div>
      <div class="flex space-x-4">
        <div class="w-12 h-12 bg-red-500"></div>
        <div class="w-12 h-12 bg-green-500"></div>
        <div class="w-12 h-12 bg-yellow-500"></div>
      </div>
    </div>
  );
};

export default Navbar;
