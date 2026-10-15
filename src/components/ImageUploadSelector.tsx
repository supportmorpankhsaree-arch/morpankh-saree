"use client";

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, FolderOpen, X, CameraOff, RefreshCw, Check } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { toast } from '@/hooks/use-toast';

interface ImageUploadSelectorProps {
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => void;
  accept?: string;
  multiple?: boolean;
}

export function ImageUploadSelector({ 
  open, 
  onClose, 
  onFileSelected, 
  accept = "image/*",
  multiple = false 
}: ImageUploadSelectorProps) {
  const [mode, setMode] = useState<'selection' | 'camera'>('selection');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const camera = useCameraCapture();
  const cameraRef = useRef(camera);
  
  cameraRef.current = camera;

  useEffect(() => {
    if (!open) {
      setMode('selection');
      cameraRef.current.closeCamera();
    }
  }, [open]);

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(file => onFileSelected(file));
      } else {
        onFileSelected(files[0]);
      }
      onClose();
    }
  };

  const handleCameraClick = () => {
    if (!camera.isCameraSupported()) {
      toast({
        title: 'Camera Not Available',
        description: 'Your device does not support camera access. Please use the gallery option.',
        variant: 'destructive',
      });
      return;
    }
    setMode('camera');
    camera.openCamera();
  };

  const handleCapture = async () => {
    // Wait a moment for video to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imageDataUrl = camera.captureImage();
    if (!imageDataUrl) {
      toast({
        title: 'Error',
        description: 'Camera not ready. Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const file = await camera.convertToFile(imageDataUrl);
      
      if (!file || file.size === 0) {
        toast({
          title: 'Error',
          description: 'Failed to capture image. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      onFileSelected(file);
      camera.closeCamera();
      onClose();
      toast({
        title: 'Success',
        description: 'Image captured successfully',
      });
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process captured image',
        variant: 'destructive',
      });
    }
  };

  const handleRetake = () => {
    camera.retakeImage();
  };

  const handleBack = () => {
    camera.closeCamera();
    setMode('selection');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Select Image Source</DialogTitle>
        </DialogHeader>

        {mode === 'selection' && (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-semibold text-center">Choose Image Source</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleGalleryClick}
                variant="outline"
                className="flex flex-col items-center gap-2 h-32 hover:bg-muted/50"
              >
                <FolderOpen className="h-8 w-8" />
                <span className="text-sm font-medium">Select from Gallery</span>
              </Button>

              <Button
                onClick={handleCameraClick}
                variant="outline"
                className="flex flex-col items-center gap-2 h-32 hover:bg-muted/50"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Take Picture</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
              >
                Back
              </Button>
              <h3 className="text-lg font-semibold">Camera</h3>
              <div className="w-16" />
            </div>

            {camera.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">{camera.error}</p>
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Use Gallery Instead
                </Button>
              </div>
            )}

            {!camera.error && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {camera.isCameraOpen && !camera.capturedImage && (
                    <video
                      ref={camera.videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {camera.capturedImage && (
                    <img
                      src={camera.capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                  )}

                  <canvas
                    ref={camera.canvasRef}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-2">
                  {!camera.capturedImage ? (
                    <Button
                      onClick={handleCapture}
                      disabled={!camera.isCameraOpen}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleRetake}
                        variant="outline"
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                      <Button
                        onClick={handleCapture}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
