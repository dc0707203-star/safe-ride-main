import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/pages/Index';
import isuLogo from '@/assets/isu-logo.png';
import riseCenter from '@/assets/rise-center.png';
import campusBg from '@/assets/campus-bg.jpeg';

const Gallery = () => {
  const images = [isuLogo, riseCenter, campusBg];
  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black mb-4">Gallery</h1>
        <p className="text-gray-600 mb-6">A few sample images and screenshots.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((src, i) => (
            <div key={i} className="rounded-lg overflow-hidden border">
              <img src={src} alt={`gallery-${i}`} className="w-full h-48 object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
