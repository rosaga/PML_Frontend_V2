"use client"; // Mark this component as a Client Component

import React, { useState, useRef, useEffect } from 'react';

const PeakSearch = ({ filterOptions, selectedFilter, onSearch, onClearSearch }) => {
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState(selectedFilter);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleClick(event);
    }
  };

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleClick = (event) => {
    event.preventDefault();
    if (filter && inputValue) {
      onSearch(filter, inputValue);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleOptionClick = (option) => {
    setFilter(option.value);
    setDropdownOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    setFilter("");
    onClearSearch();
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <form className="max-w-3xl mx-auto">
        <div className="flex relative w-full">
          <label
            htmlFor="search-dropdown"
            className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
          >
            Your Email
          </label>
          <button
            id="dropdown-button"
            onClick={toggleDropdown}
            className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600"
            type="button"
          >
            {filterOptions.find(option => option.value === filter)?.label || "All categories"}
            <svg
              className="w-2.5 h-2.5 ms-2.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 4 4 4-4"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              id="dropdown"
              className="absolute z-10 mt-1 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700"
              style={{ top: '100%', left: '0' }}
            >
              <ul
                className="py-2 text-sm text-gray-700 dark:text-gray-200"
                aria-labelledby="dropdown-button"
              >
                {filterOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="relative w-full">
            <input
              type="search"
              id="search-dropdown"
              className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-none border border-gray-300 focus:ring-gray-300 focus:border-gray-300 dark:bg-gray-300 dark:border-gray-300 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-gray-300"
              placeholder="Filter"
              required
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute top-0 right-0 flex items-center h-full">
              <button
                type="submit"
                className="p-2.5 text-sm font-medium text-white bg-[#090A29] border-l border-gray-300 rounded-none hover:bg-orange-400 dark:bg-gray-300 dark:hover:bg-gray-300 dark:focus:ring-gray-300"
                onClick={handleClick}
                title="Search"
              >
                <svg
                  className="w-4 h-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
                <span className="sr-only">Search</span>
              </button>
              <button
                type="button"
                className="p-2.5 text-xl font-light text-white bg-[#090A29] border-l border-gray-300 rounded-none hover:bg-orange-400 dark:bg-gray-300 dark:hover:bg-gray-300 dark:focus:ring-gray-300"
                onClick={handleClearSearch}
                title="Clear Filter"
              >
                <svg
                  className="w-4 h-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PeakSearch;
