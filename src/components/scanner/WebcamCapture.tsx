'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import ReactWebcam from 'react-webcam';

export interface WebcamCaptureRef {
    getScreenshot: () => string | null;
}

interface WebcamCaptureProps {
    onUserMediaError?: () => void;
    className?: string;
}

const WebcamCapture = forwardRef<WebcamCaptureRef, WebcamCaptureProps>(
    ({ onUserMediaError, className }, ref) => {
        const webcamRef = useRef<ReactWebcam>(null);

        useImperativeHandle(ref, () => ({
            getScreenshot: () => {
                return webcamRef.current?.getScreenshot() || null;
            }
        }));

        return (
            <ReactWebcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                }}
                onUserMediaError={onUserMediaError}
                className={className}
            />
        );
    }
);

WebcamCapture.displayName = 'WebcamCapture';

export default WebcamCapture;
