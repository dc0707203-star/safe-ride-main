import React from 'react';
import { motion } from 'framer-motion';

type ImageItem = { src: string; alt?: string; link?: string };

const NavGallery = ({
  images = [],
  onSelect,
  className = ''
}: {
  images?: ImageItem[];
  onSelect?: (item: ImageItem, index: number) => void;
  className?: string;
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex gap-2 items-center overflow-x-auto py-1">
        {images.map((img, i) => (
          <motion.button
            key={i}
            onClick={() => onSelect?.(img, i)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.98 }}
            className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 bg-white/5"
            aria-label={`Gallery item ${img.alt ?? i + 1}`}
          >
            <img src={img.src} alt={img.alt ?? `img-${i}`} className="w-full h-full object-cover" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default NavGallery;
