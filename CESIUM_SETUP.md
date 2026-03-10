# Cesium.js Admin Live Map Setup

## 1. Get Cesium Ion Token

1. Go to https://cesium.com/platform/cesiumion/
2. Sign up for free account
3. Go to "Access Tokens" 
4. Copy your default access token

## 2. Add to Environment Variables

Add to your `.env.local`:
```
VITE_CESIUM_ION_TOKEN=your_token_here
```

## 3. Add Cesium CSS to main.tsx

```tsx
import 'cesium/Build/Cesium/Widgets/widgets.css';
```

## 4. Update vite.config.ts

Add to your Vite config:
```ts
import cesiumPlugin from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [
    react(),
    cesiumPlugin(),
  ],
});
```

Install the plugin first:
```bash
npm install vite-plugin-cesium --legacy-peer-deps
```

## 5. Import CesiumAdminMap in your admin dashboard

```tsx
import { CesiumAdminMap } from '@/components/admin/CesiumAdminMap';

// In your admin page:
<CesiumAdminMap />
```

## Features Included

✅ Real-time 3D driver tracking
✅ Live Supabase subscription
✅ Driver status visualization (green=online, orange=busy, red=offline)
✅ Click driver for info popup
✅ 3D terrain and world imagery
✅ Pan/zoom/rotate the globe
✅ Driver heading visualization

## Database Requirements

Make sure your `drivers` table has these columns:
- `id` (uuid)
- `name` (text)
- `latitude` (float)
- `longitude` (float)
- `heading` (float) - optional, for direction
- `status` (text) - 'online', 'busy', 'offline'
