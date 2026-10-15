"use client";

import { useState, useRef, useCallback } from 'react';

interface CameraState {
  isCameraOpen: boolean;
  stream: MediaStream | null;
  capturedImage: string | null;
  error: string | null;
}

export function useCameraCapture() {
  const [state, setState] = useState<CameraState>({
    isCameraOpen: false,
    stream: null,
    capturedImage: null,
    error: null,
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isCameraSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 
           typeof navigator.mediaDevices !== 'undefined' &&
           typeof navigator.mediaDevices.getUserMedia === 'function';
  }, []);

  const openCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      setState(prev => ({ ...prev, error: 'Camera not supported on this device' }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setState(prev => ({
        ...prev,
        isCameraOpen: true,
        stream,
        error: null,
        capturedImage: null,
      }));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const video = videoRef.current;
          if (!video) {
            resolve();
            return;
          }
          
          const onReady = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('canplay', onReady);
            resolve();
          };
          
          video.addEventListener('loadeddata', onReady);
          video.addEventListener('canplay', onReady);
          
          // Fallback timeout
          setTimeout(() => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('canplay', onReady);
            resolve();
          }, 2000);
          
          video.play().catch(() => {
            // Play might fail initially, but we still resolve
            resolve();
          });
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [isCameraSupported]);

  const closeCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    setState({
      isCameraOpen: false,
      stream: null,
      capturedImage: null,
      error: null,
    });
  }, [state.stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready and has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0 || !video.readyState || video.readyState < 2) {
      return null;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Validate the data URL
    if (!imageDataUrl || imageDataUrl === 'data:,') {
      return null;
    }
    
    setState(prev => ({ ...prev, capturedImage: imageDataUrl }));
    
    return imageDataUrl;
  }, []);

  const retakeImage = useCallback(() => {
    setState(prev => ({ ...prev, capturedImage: null }));
  }, []);

  const convertToFile = useCallback(async (imageDataUrl: string, fileName: string = 'camera-capture.jpg'): Promise<File> => {
    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Empty blob created from image data');
      }
      
      return new File([blob], fileName, { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting to file:', error);
      
      // Fallback: Use canvas to blob
      return new Promise((resolve, reject) => {
        if (!canvasRef.current) {
          reject(new Error('Canvas not available'));
          return;
        }
        
        canvasRef.current.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          
          if (blob.size === 0) {
            reject(new Error('Empty blob created from canvas'));
            return;
          }
          
          resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      });
    }
  }, []);

  return {
    isCameraOpen: state.isCameraOpen,
    capturedImage: state.capturedImage,
    error: state.error,
    videoRef,
    canvasRef,
    isCameraSupported,
    openCamera,
    closeCamera,
    captureImage,
    retakeImage,
    convertToFile,
  };
}
