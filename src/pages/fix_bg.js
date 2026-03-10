const fs = require('fs');

// AdminPortal.tsx
let adminPortal = fs.readFileSync('AdminPortal.tsx', 'utf8');
adminPortal = adminPortal.replace(
  'style={{\n        backgroundAttachment: "fixed",\n      }}',
  'style={{\n        backgroundImage: `linear-gradient(135deg, rgba(5, 65, 35, 0.85) 0%, rgba(20, 70, 40, 0.9) 50%, rgba(5, 65, 35, 0.85) 100%), url(\'${campusBg}\')`\n      }}'
);
fs.writeFileSync('AdminPortal.tsx', adminPortal);
console.log('AdminPortal.tsx updated');

// About.tsx - add style attribute
let about = fs.readFileSync('About.tsx', 'utf8');
about = about.replace(
  '<div className="min-h-screen bg-cover bg-center bg-fixed text-white relative overflow-hidden font-sans selection:bg-[#CCFF00] selection:text-[#004225]">',
  '<div className="min-h-screen bg-cover bg-center bg-fixed text-white relative overflow-hidden font-sans selection:bg-[#CCFF00] selection:text-[#004225]" style={{ backgroundImage: `linear-gradient(135deg, rgba(5, 65, 35, 0.85) 0%, rgba(20, 70, 40, 0.9) 50%, rgba(5, 65, 35, 0.85) 100%), url(\'${campusBg}\')` }}>'
);
fs.writeFileSync('About.tsx', about);
console.log('About.tsx updated');

// RoleSelection.tsx
let role = fs.readFileSync('RoleSelection.tsx', 'utf8');
role = role.replace(
  'style={{\n        backgroundImage: `linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%), url(\'${campusBg}\')`\n      }}',
  'style={{\n        backgroundImage: `linear-gradient(135deg, rgba(5, 65, 35, 0.85) 0%, rgba(20, 70, 40, 0.9) 50%, rgba(5, 65, 35, 0.85) 100%), url(\'${campusBg}\')`\n      }}'
);
fs.writeFileSync('RoleSelection.tsx', role);
console.log('RoleSelection.tsx updated');

