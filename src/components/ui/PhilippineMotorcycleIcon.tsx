import React from "react";

const PhilippineMotorcycleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Main body/sidecar */}
        <path d="M3 14 L4 10 Q4 8 6 8 L12 8 Q13 8 13 9 L13 14" strokeWidth="2" />
        {/* Motorcycle body */}
        <path d="M13 14 L14 9 Q14 8 15 8 L18 8 Q19 8 19 9 L19 14" strokeWidth="2" />

        {/* Front wheel (sidecar) */}
        <circle cx="5" cy="17" r="2.5" strokeWidth="2" />
        {/* Middle wheel */}
        <circle cx="12" cy="17" r="2.5" strokeWidth="2" />
        {/* Back wheel */}
        <circle cx="18" cy="17" r="2.5" strokeWidth="2" />

        {/* Connection between sidecar and motorcycle */}
        <line x1="9" y1="14" x2="15" y2="14" strokeWidth="1.5" />

        {/* Handlebar */}
        <path d="M16 8 L15 6 M16 8 L17 6" strokeWidth="1.5" />

        {/* Roof/canopy */}
        <path d="M6 8 Q6 6 8 6 L14 6" strokeWidth="1.5" />

        {/* Window opening */}
        <line x1="10" y1="8" x2="10" y2="10" strokeWidth="1" opacity="0.7" />
    </svg>
);

export default PhilippineMotorcycleIcon;
