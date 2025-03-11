import React from 'react';

const Input = ({ label, name, value, onChange, required }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-black">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring text-black"
            />
        </div>
    );
};

export default Input;