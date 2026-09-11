const fs = require('fs');
let content = fs.readFileSync('src/components/MobileCameraTest.tsx', 'utf-8');

if (!content.includes('!navigator.mediaDevices')) {
    content = content.replace(
        "setErrorMessage(null);\n    try {",
        "setErrorMessage(null);\n    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {\n      setCameraState('ERROR');\n      setErrorMessage('Camera API is not supported in this browser. Please ensure you are using HTTPS.');\n      return;\n    }\n    try {"
    );
    fs.writeFileSync('src/components/MobileCameraTest.tsx', content);
    console.log('Added secure context / API check for getUserMedia.');
} else {
    console.log('Check already exists.');
}
