/**
 * Performance optimization utilities for low-spec Android devices
 */

export interface DeviceCapabilities {
  isLowSpec: boolean;
  isAndroid: boolean;
  isSlowNetwork: boolean;
  isMobile: boolean;
  ram?: number;
  cores?: number;
}

/**
 * Detect if device is low-spec (low RAM, few cores, Android)
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(ua);
  const isMobile = /mobile|tablet|android|iphone|ipad/.test(ua);
  
  // Try to detect RAM and CPU cores
  // These are approximate and not always accurate
  const cores = (navigator as any).hardwareConcurrency || 2;
  const ram = (navigator?.deviceMemory) || 4; // In GB
  
  // Consider device as low-spec if:
  // - On Android AND (low RAM or few cores)
  // - Mobile with < 2GB RAM or < 2 cores
  const isLowSpec = 
    (isAndroid && (ram < 2 || cores < 2)) ||
    (isMobile && (ram < 1.5 || cores < 2));

  // Check for slow network
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  const isSlowNetwork = connection && 
    (connection.effectiveType === '3g' || connection.effectiveType === '4g') &&
    connection.saveData;

  return {
    isLowSpec,
    isAndroid,
    isSlowNetwork,
    isMobile,
    ram: (navigator as any).deviceMemory,
    cores
  };
}

/**
 * Get optimized timing values based on device capability
 */
export function getOptimizedTimings(capabilities: DeviceCapabilities) {
  if (capabilities.isLowSpec) {
    return {
      locationUpdateInterval: 30000, // 30s instead of 10s
      mapPollInterval: 5000, // 5s instead of 2s
      realTimeMapInterval: 10000, // 10s instead of 5s
      timerUpdateInterval: 5000, // 5s instead of 1s for alert timers
      animationDuration: 0, // Disable animations
      transitionDuration: 100, // Reduce transition time
      debounceDelay: 500,
    };
  }
  
  return {
    locationUpdateInterval: 10000, // 10s
    mapPollInterval: 2000, // 2s
    realTimeMapInterval: 5000, // 5s
    timerUpdateInterval: 1000, // 1s
    animationDuration: 300, // Default
    transitionDuration: 300,
    debounceDelay: 300,
  };
}

/**
 * Add performance detection class to document for CSS optimization
 */
export function applyPerformanceClass() {
  const capabilities = detectDeviceCapabilities();
  
  if (capabilities.isLowSpec) {
    document.documentElement.classList.add('low-spec-device');
    document.documentElement.classList.add('reduce-motion');
    // Disable animations at the CSS level
    document.documentElement.style.setProperty('--animation-duration', '0ms');
    document.documentElement.style.setProperty('--transition-duration', '100ms');
  } else {
    document.documentElement.classList.remove('low-spec-device');
    document.documentElement.classList.remove('reduce-motion');
    document.documentElement.style.setProperty('--animation-duration', '300ms');
    document.documentElement.style.setProperty('--transition-duration', '300ms');
  }
  
  return capabilities;
}

/**
 * Debounce function to reduce frequent updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to reduce frequent updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export default {
  detectDeviceCapabilities,
  getOptimizedTimings,
  applyPerformanceClass,
  debounce,
  throttle,
};
