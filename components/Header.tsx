
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        The Chroma Weaver
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
        Fuse high-fashion models into fantastical scenes. Our AI blends style, lighting, and color for a seamless, artistic result.
      </p>
    </header>
  );
};

export default Header;
