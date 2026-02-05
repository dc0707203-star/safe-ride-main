import React from 'react';
import { Home, Shield, BookOpen, Phone, Code2, Bell } from 'lucide-react';

// Map icons to your actual app pages/routes
const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'features', icon: Shield, label: 'Features' },
  { id: 'guide', icon: BookOpen, label: 'Guide' },
  { id: 'contact', icon: Phone, label: 'Contact' },
  { id: 'developer', icon: Code2, label: 'Dev' },
];

export default function MobileBottomNav({ active, onTabChange }: {
  active: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-md">
      <div className="flex items-center justify-between bg-gradient-to-b from-white/20 to-white/10 border border-white/40 rounded-3xl px-2 py-2 shadow-[0_8px_32px_rgba(0,77,37,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)] min-h-[64px] backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center relative focus:outline-none focus-visible:ring-0 ${
                isActive ? "scale-110" : "scale-100"
              }`}
              style={{ zIndex: isActive ? 10 : 1 }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#004d25]/20 to-[#90EE90]/10 rounded-2xl blur-md -z-10" />
              )}
              <item.icon className={isActive ? "w-7 h-7 text-[#90EE90] drop-shadow-md" : "w-6 h-6 text-[#90EE90] opacity-50"} />
              <span className={isActive ? "mt-1 text-xs font-bold text-[#90EE90] drop-shadow-sm" : "sr-only"}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
