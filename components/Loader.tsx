
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-50">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
      <p className="mt-4 text-white text-lg font-semibold">{message}</p>
    </div>
  );
};

export default Loader;
