const fs = require('fs');
let content = fs.readFileSync('src/components/CommandCenterView.tsx', 'utf-8');

// Import centralRepo
if (!content.includes('centralRepo')) {
    content = content.replace(
        "import { sysEvents } from '../services/Architecture';",
        "import { sysEvents, centralRepo } from '../services/Architecture';"
    );
}

// Add state for dynamic latest alert
content = content.replace(
    "const [isQuickTrackOpen, setIsQuickTrackOpen] = useState(false);",
    "const [isQuickTrackOpen, setIsQuickTrackOpen] = useState(false);\n  const [latestDynamicAlert, setLatestDynamicAlert] = useState<any>(null);"
);

// Subscribe to EVENT_CREATED
const hookToInsert = `
  useEffect(() => {
    const handleNewEvent = () => {
      const allEvents = centralRepo.getAllEvents();
      if (allEvents.length > 0) {
        const latest = allEvents[allEvents.length - 1];
        setLatestDynamicAlert({
          id: latest.eventId,
          violationType: latest.eventType.replace(/_/g, ' '),
          vehiclePlate: latest.metadata?.registrationNumber || 'UNKNOWN',
          vehicleType: latest.metadata?.vehicleClass || 'Vehicle',
          cameraId: latest.cameraId || 'CAM-UNKNOWN',
          sourceType: latest.metadata?.sourceType || 'UNKNOWN_SOURCE',
          location: latest.metadata?.gps ? 'GPS ' + latest.metadata.gps.latitude.toFixed(3) : 'Ahmedabad',
          timestamp: new Date(latest.timestamp).toLocaleTimeString(),
          confidence: latest.confidence ? Math.round(latest.confidence * 100) : 90,
          evidenceUrl: latest.snapshotReference || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
        });
      }
    };
    handleNewEvent(); // Initial load
    const unsub = sysEvents.on('EVENT_CREATED', handleNewEvent);
    return () => unsub();
  }, []);
`;

content = content.replace("useEffect(() => {", hookToInsert + "\n  useEffect(() => {");

// Update activeAlertData
content = content.replace(
    "const activeAlertData = {",
    "const activeAlertData = latestDynamicAlert || {"
);

fs.writeFileSync('src/components/CommandCenterView.tsx', content);
console.log('Patched CommandCenterView.tsx');
