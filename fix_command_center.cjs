const fs = require('fs');
let content = fs.readFileSync('src/components/CommandCenterView.tsx', 'utf-8');

content = content.replace("sysEvents.on('EVENT_CREATED', handleNewEvent);", 
    "sysEvents.on('LOG', (msg: any) => { if (msg?.type === 'EVENT_STORED') handleNewEvent(); });");

fs.writeFileSync('src/components/CommandCenterView.tsx', content);
console.log('Fixed Command Center events.');
