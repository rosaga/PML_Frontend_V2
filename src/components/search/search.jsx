"use client";  // Mark this component as a Client Component

import React, { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel, OutlinedInput, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useDispatch } from 'react-redux';
// import { setValue, setSearchParam } from '../path/to/your/actions';

const PeakSearch = ({ filterOptions, selectedFilter }) => {
    const [inputValue, setInputValue] = useState('');
    const [filter, setFilter] = useState(selectedFilter);
    // const dispatch = useDispatch();

    const handleSelectChange = (event) => {
        const selectedOption = event.target.value;
        setFilter(selectedOption);
        // dispatch(setValue(selectedOption));
    };

    const handleClearClick = () => {
        setInputValue("");
        dispatch(setSearchParam(""));
        // dispatch(setValue(""));
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleClick(event);
        }
    };

    const handleChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleClick = (event) => {
        event.preventDefault();
        // Add your search logic here
        console.log('Search clicked');
    };

    return (
        <Box display="flex" alignItems="center">
            <FormControl variant="outlined" size="small" sx={{ width: '100px', borderRadius: 0 }}>
                <InputLabel id="filter-label">Email</InputLabel>
                <Select
                    labelId="filter-label"
                    value={filter}
                    onChange={handleSelectChange}
                    label="Email"
                    placeholder='Email'
                >
                    {filterOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
                
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ flexGrow: 1 ,marginRight: '8px', backgroundColor: '#090A29', color: 'white'}}>
                <OutlinedInput
                    value={inputValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search and Filter"
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="search"
                                onClick={handleClick}
                                edge="end"
                            >
                                <SearchIcon style={{ color: 'white' }}/>
                            </IconButton>
                            {inputValue && (
                                <IconButton
                                    aria-label="clear"
                                    onClick={handleClearClick}
                                    edge="end"
                                >
                                    <ClearIcon />
                                </IconButton>
                            )}
                        </InputAdornment>
                    }
                    sx={{ borderRadius: 0 }}
                />
            </FormControl>
        </Box>
    );
};

export default PeakSearch;
