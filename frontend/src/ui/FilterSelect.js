'use client';

import React from 'react';

const selectClassName =
    'w-full h-10 px-3 border border-gray-300 rounded-md text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

const FilterSelect = ({ label, value, onChange, options = [], disabled = false }) => (
    <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <select
            className={selectClassName}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((option) => (
                <option key={`${label}-${option.value}`} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </label>
);

export default FilterSelect;
