/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Sample Traffic Video Generator
 * Generates an authorized sample traffic video clip (WebM/MP4) on-the-fly in browser
 * so users can immediately test real frame-by-frame Gemini Vision without needing
 * an external video file.
 */

export async function generateSampleTrafficClip(): Promise<File> {
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not supported in this runtime');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  const stream = canvas.captureStream(20); // 20 fps
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4';

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<File>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const file = new File([blob], 'traffic_demo_sample.webm', { type: mimeType });
      resolve(file);
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  // Animate 60 frames (3 seconds)
  const totalFrames = 60;
  for (let f = 0; f < totalFrames; f++) {
    // 1. Draw road and background
    ctx.fillStyle = '#1e293b'; // Road
    ctx.fillRect(0, 0, 640, 360);

    // Sidewalk
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 640, 60);
    ctx.fillRect(0, 300, 640, 60);

    // Lane markings
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(640, 180);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Moving Car (Amber / Silver)
    const carX = (f * 8) % 700 - 60;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(carX, 200, 120, 50); // Car body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(carX + 15, 190, 80, 25); // Cabin/Windows
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(carX + 25, 195, 25, 15);
    ctx.fillRect(carX + 60, 195, 25, 15);
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(carX + 115, 215, 8, 12);

    // 3. Moving Motorcycle Rider (No Helmet demo)
    const bikeX = 640 - ((f * 10) % 750);
    ctx.fillStyle = '#3b82f6'; // Bike body
    ctx.fillRect(bikeX, 100, 70, 35);
    // Wheels
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bikeX + 10, 135, 12, 0, Math.PI * 2);
    ctx.arc(bikeX + 60, 135, 12, 0, Math.PI * 2);
    ctx.fill();
    // Rider Torso
    ctx.fillStyle = '#ef4444'; // Red jacket
    ctx.fillRect(bikeX + 25, 80, 20, 30);
    // Rider Head (Hair / No Helmet)
    ctx.fillStyle = '#451a03'; // Dark hair
    ctx.beginPath();
    ctx.arc(bikeX + 35, 72, 8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Pedestrian on Sidewalk
    const pedX = (f * 2 + 50) % 600;
    ctx.fillStyle = '#10b981'; // Green shirt
    ctx.fillRect(pedX, 25, 14, 25);
    ctx.fillStyle = '#fcd34d'; // Head
    ctx.beginPath();
    ctx.arc(pedX + 7, 18, 6, 0, Math.PI * 2);
    ctx.fill();

    // Traffic details timestamp
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(`CAM-AUTHORIZED-01 | ${(f / 20).toFixed(2)}s | TRAFFIC FLOW`, 20, 340);

    // Small delay between rendered frames
    await new Promise(r => setTimeout(r, 20));
  }

  recorder.stop();
  return recordingPromise;
}
