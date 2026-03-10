/**
 * Cesium.js 3D Admin Live Map
 * Real-time driver tracking with 3D globe visualization
 */

import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { supabase } from '@/integrations/supabase/client';

// Initialize Cesium ion token (free tier)
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || '';

interface Driver {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heading?: number;
  status: 'online' | 'offline' | 'busy';
}

export const CesiumAdminMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cesium Viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      imageryProvider: Cesium.createWorldImageryAsync(),
      baseLayerPicker: true,
      fullscreenButton: true,
      vrButton: false,
    });

    // Disable default double-click zoom
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    viewerRef.current = viewer;

    // Fly to default location (e.g., Manila)
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(121.0489, 14.0995, 50000),
      duration: 3,
    });

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // Subscribe to real-time driver updates
  useEffect(() => {
    const subscription = supabase
      .channel('driver_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
        },
        (payload) => {
          const driver = payload.new as any;
          if (driver.latitude && driver.longitude) {
            updateDriverOnMap(driver);
          }
        }
      )
      .subscribe();

    // Initial load
    fetchAllDrivers();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAllDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, latitude, longitude, heading, status')
        .eq('status', 'online');

      if (error) throw error;
      if (data) {
        setDrivers(data);
        data.forEach(driver => updateDriverOnMap(driver));
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const updateDriverOnMap = (driver: Driver) => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const position = Cesium.Cartesian3.fromDegrees(
      driver.longitude,
      driver.latitude,
      100 // 100m altitude
    );

    // Remove existing entity if it exists
    if (entitiesRef.current.has(driver.id)) {
      viewer.entities.remove(entitiesRef.current.get(driver.id)!);
    }

    // Create driver marker
    const heading = Cesium.Math.toRadians(driver.heading || 0);
    
    const entity = viewer.entities.add({
      position,
      point: {
        pixelSize: 10,
        color: 
          driver.status === 'online' ? Cesium.Color.GREEN :
          driver.status === 'busy' ? Cesium.Color.ORANGE :
          Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: driver.name,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
      },
      model: {
        uri: Cesium.Cesium3DTileset.fromUrl(
          'https://sandcastle.cesium.com/models/CesiumAir/Cesium_Air.glb',
          { minimumPixelSize: 128, maximumScale: 20000 }
        ),
        heading: heading,
      },
      properties: {
        driverId: driver.id,
        status: driver.status,
      },
    });

    entitiesRef.current.set(driver.id, entity);

    // Show driver info on click
    viewer.screenSpaceEventHandler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
        showDriverInfo(driver);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  const showDriverInfo = (driver: Driver) => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const infoBox = viewer.infoBox;
    if (infoBox) {
      infoBox.frame.src = '#';
      const content = `
        <div style="padding: 10px; font-family: Arial;">
          <h3>${driver.name}</h3>
          <p><strong>Status:</strong> ${driver.status}</p>
          <p><strong>Location:</strong> ${driver.latitude.toFixed(4)}, ${driver.longitude.toFixed(4)}</p>
          <p><strong>Heading:</strong> ${driver.heading || 0}°</p>
        </div>
      `;
      infoBox.frame.srcdoc = content;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Admin Live Map - 3D Tracking</h1>
        <p className="text-sm">Active Drivers: {drivers.length}</p>
      </div>
      <div
        ref={containerRef}
        className="flex-1"
        style={{ width: '100%', height: 'calc(100% - 60px)' }}
      />
    </div>
  );
};

export default CesiumAdminMap;
