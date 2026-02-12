import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | null = null;

    const startScanning = async () => {
      try {
        setIsLoading(true);
        setError(null);

        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (result) {
              onScan(result.getText());
            }
          }
        );
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        setIsLoading(false);
      }
    };

    if (videoRef.current) {
      startScanning();
    }

    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scanner un code barre
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-destructive">{error}</p>
                <Button variant="outline" className="mt-4" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
          
          <video 
            ref={videoRef}
            className="w-full h-full object-cover"
          />
          
          {/* Scan overlay */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-primary rounded-lg relative">
                <div className="absolute inset-0 border-2 border-primary/30 animate-pulse" />
                <div className="absolute -top-0.5 left-1/4 right-1/4 h-0.5 bg-primary animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm text-muted-foreground">
          Placez le code barre dans le cadre
        </div>
      </div>
    </div>
  );
};
