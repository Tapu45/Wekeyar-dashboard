// src/components/UploadProgressBar.tsx
import React, { useState, useEffect, useRef } from 'react';

interface UploadProgressBarProps {
  isUploading: boolean;
  onComplete: () => void;
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ isUploading, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    // Reset state when upload starts
    if (isUploading) {
      setProgress(0);
      isCompletedRef.current = false;
      
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received progress update:", data.progress); // Debug log
          // Handle progress updates
          if (data.progress !== undefined) {
            // Update progress with the decimal precision value
            setProgress(data.progress);
            
            // Notify parent when complete (only once)
            if (data.progress >= 100 && !isCompletedRef.current) {
              isCompletedRef.current = true;
              setTimeout(() => onComplete(), 500);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
      
      socketRef.current = ws;
      
      // Clean up WebSocket connection when component unmounts or upload is done
      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    }
  }, [isUploading, onComplete]);

  // Don't render if not uploading and progress is 0
  if (!isUploading && progress === 0) {
    return null;
  }

  return (
    <div className="mt-4 mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Processing file: {progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-150 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {progress < 100 && (
        <p className="text-sm text-gray-500 mt-2">
          Please wait while we process your file. Do not refresh the page.
        </p>
      )}
      {progress >= 100 && (
        <p className="text-sm text-green-500 mt-2">
          File processing complete!
        </p>
      )}
    </div>
  );
};

export default UploadProgressBar;