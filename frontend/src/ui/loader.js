import React from 'react';
import { ClipLoader } from 'react-spinners';

const Loader = ({ loading }) => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <ClipLoader size={50} color={"#123abc"} loading={loading} />
        </div>
    );
};

export default Loader;