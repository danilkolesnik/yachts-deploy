import React from 'react';

const Input = ({ label, name, value, onChange, required, type = 'text', ...rest }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-black">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                {...rest}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring text-black"
            />
        </div>
    );
};

export default Input;