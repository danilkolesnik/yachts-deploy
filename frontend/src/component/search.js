import React from 'react';

const SearchInput = ({ search, setSearch, filteredData, onSearchSelect }) => {
    return (
        <div className='relative'>
            <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200 text-black w-full"
            />
            {search && (
                <div className="absolute w-full top-full bg-white border border-gray-300 rounded shadow-lg z-10">
                    {filteredData.map((item, index) => (
                        <div
                            key={index}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-black"
                            onClick={() => onSearchSelect(item)}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchInput;