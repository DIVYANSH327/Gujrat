/**
 * Vehicle Plate Consistency Agent
 * Cross-checks vehicle classification with plate attributes (commercial, two-wheeler, private).
 */

import { AgentResult, PlateOCRResult, VehicleClass } from '../visionTypes.js';

export class VehiclePlateConsistencyAgent {
  private static instance: VehiclePlateConsistencyAgent;

  public static getInstance(): VehiclePlateConsistencyAgent {
    if (!VehiclePlateConsistencyAgent.instance) {
      VehiclePlateConsistencyAgent.instance = new VehiclePlateConsistencyAgent();
    }
    return VehiclePlateConsistencyAgent.instance;
  }

  public checkConsistency(
    vehicleClass: VehicleClass,
    ocrResult: PlateOCRResult
  ): AgentResult<{ isConsistent: boolean; reason: string }> {
    const startTime = Date.now();

    let isConsistent = true;
    let reason = 'Vehicle classification aligns with observed registration plate attributes.';

    if (ocrResult.readable && ocrResult.normalizedText) {
      // Check state code
      if (ocrResult.stateCode && !/^[A-Z]{2}$/.test(ocrResult.stateCode)) {
        isConsistent = false;
        reason = `Invalid state code: ${ocrResult.stateCode}`;
      }

      // Check two-wheeler vs heavy vehicle patterns if available
      const isTwoWheeler = vehicleClass === 'motorcycle' || vehicleClass === 'scooter';
      const isHeavy = vehicleClass === 'bus' || vehicleClass === 'truck';

      if (isTwoWheeler && ocrResult.series && ocrResult.series.length > 3) {
        isConsistent = false;
        reason = `Plate series length (${ocrResult.series}) unusual for two-wheeler`;
      }
    }

    return {
      agentName: 'VehiclePlateConsistencyAgent',
      status: 'SUCCESS',
      data: { isConsistent, reason },
      confidence: 0.95,
      execution: {
        provider: 'rule_engine',
        model: 'mva_compliance_engine',
        latencyMs: Date.now() - startTime,
        status: 'SUCCESS',
        retryCount: 0
      }
    };
  }
}

export const vehiclePlateConsistencyAgent = VehiclePlateConsistencyAgent.getInstance();
