import React from 'react';
import { ClipLoader } from 'react-spinners';
import { BRAND } from '@/constants/brand';

const Loader = ({ loading, fullScreen = true, size = 50 }) => {
  return (
    <div
      className={`flex justify-center items-center ${
        fullScreen ? 'min-h-screen' : 'py-2 px-2'
      }`}
    >
      <ClipLoader
        size={size}
        color={BRAND.colors.navy}
        loading={loading !== false}
      />
    </div>
  );
};

export default Loader;
