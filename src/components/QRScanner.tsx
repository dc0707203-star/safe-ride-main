import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/library";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

const QRScanner = ({ isOpen, onClose, onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsLoading(true);
      setError(null);

      try {
        readerRef.current = new BrowserMultiFormatReader();
        
        const videoInputDevices = await readerRef.current.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError("No camera found on this device");
          setIsLoading(false);
          return;
        }

        // Prefer back camera
        const backCamera = videoInputDevices.find(
          (device) => device.label.toLowerCase().includes("back") || 
                       device.label.toLowerCase().includes("rear")
        );
        const deviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        await readerRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const text = result.getText();
              onScan(text);
              stopScanner();
            }
            // Suppress "NotFoundException" and "No MultiFormat Readers" errors - these are normal when no QR is in view
            if (err && err.name !== "NotFoundException" && !err.message?.includes("No MultiFormat Readers")) {
              console.error("Scan error:", err);
            }
          }
        );

        setIsLoading(false);
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError(err.message || "Failed to access camera. Please check permissions.");
        setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan]);

  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl shadow-black/80 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/50">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Scan QR Code</h3>
              <p className="text-xs text-emerald-400 font-semibold">Driver Verification</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-white/70 hover:text-white" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative aspect-square bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/80 to-black/90 z-10 backdrop-blur-sm">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full w-fit mx-auto mb-4 border border-emerald-500/50 shadow-lg shadow-emerald-500/30">
                  <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                </div>
                <p className="text-white font-semibold text-base">Starting camera...</p>
                <p className="text-white/60 text-xs mt-1.5">Please allow camera access</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/90 to-black/95 z-10 backdrop-blur-sm p-6">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full w-fit mx-auto mb-4 border border-red-500/50 shadow-lg shadow-red-500/30">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h4 className="text-red-400 font-bold text-lg mb-2">Permission Denied</h4>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">{error}</p>
                <Button 
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scan overlay */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgb(76, 175, 80) 25%, rgb(76, 175, 80) 26%, transparent 27%, transparent 74%, rgb(76, 175, 80) 75%, rgb(76, 175, 80) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgb(76, 175, 80) 25%, rgb(76, 175, 80) 26%, transparent 27%, transparent 74%, rgb(76, 175, 80) 75%, rgb(76, 175, 80) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px'
                }} />
              </div>
              
              {/* Focus frame */}
              <div className="absolute inset-[12%] border-2 border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Corner markers */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 text-center bg-gradient-to-r from-emerald-500/5 to-transparent border-t border-white/10">
          <p className="text-white font-semibold text-sm mb-1">
            Point camera at driver's QR code
          </p>
          <p className="text-white/60 text-xs">
            Make sure the code is clearly visible and well-lit
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
