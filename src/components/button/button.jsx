import React from 'react';
import IosShareIcon from "@mui/icons-material/IosShare";

function PeakButton({ buttonText, icon: Icon, className, onClick }) {
    return (
        <button
            type="button"
            className={`flex items-center space-x-1 ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon style={{ width: '20px', height: '20px' }} />}
            <p>{buttonText}</p>
        </button>
    );
}

export default PeakButton;

