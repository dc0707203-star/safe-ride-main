import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Scan Driver QR Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative aspect-square bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-4">
              <div className="text-center text-white">
                <p className="text-sm text-destructive mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={handleClose}>
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
              <div className="absolute inset-[15%] border-2 border-primary rounded-lg">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Point camera at driver's QR code to start trip
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
