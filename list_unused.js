const fs = require('fs');
const files = [
  "src/services/detectorLojistaDesesperado.ts",
  "src/services/queueManager.ts",
  "src/utils/detectorLojistaDesesperado.ts",
  "src/utils/expansionPacks.ts",
  "src/utils/scrapingSpeedAccelerator.ts",
  "src/utils/visualIcpEnricher.ts",
  "src/utils/webhookSyncEngine.ts",
  "src/components/AiCopilotNegotiationModal.tsx",
  "src/components/GeoDensityHeatmapModal.tsx",
  "src/components/HunterIaModule.tsx",
  "src/components/KeywordCrossScannerModule.tsx",
  "src/components/LeadSalesDeck.tsx",
  "src/components/PartnerOsModule.tsx",
  "src/components/TrainingModeModal.tsx",
  "src/components/YieldStrategiesCard.tsx",
  "src/components/keywordIntelligence/SimulatorAndLabTab.tsx"
];

const list = files.map(f => `- ${f}`).join('\n');
console.log(list);
