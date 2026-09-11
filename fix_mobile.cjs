const fs = require('fs');
let content = fs.readFileSync('src/components/MobileCameraTest.tsx', 'utf-8');

content = content.replace('SecurityEventDetection', ''); // Remove the type import

// Fix timestamp
content = content.replace('timestamp: Date.now(),', 'timestamp: new Date().toISOString(),');

// Fix detectionsData removing the type annotation
content = content.replace('const detectionsData: SecurityEventDetection[] = [{', 'const detectionsData = [{');

fs.writeFileSync('src/components/MobileCameraTest.tsx', content);
console.log('Fixed types in MobileCameraTest.tsx');
