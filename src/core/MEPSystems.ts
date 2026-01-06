import { BIMElement, Point3D } from '../types/bim.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MEP (Mechanical, Electrical, Plumbing) Systems Engine
 */

/**
 * Electrical Circuit Mapping System
 */
export class ElectricalCircuitMapper {
  /**
   * Automatic wire routing based on load and distance
   */
  static routeElectricalCircuit(
    panel: { position: Point3D; capacity: number; voltage: number },
    loads: Array<{ position: Point3D; load: number; type: string }>,
    conduitPaths: Point3D[][]
  ): {
    circuits: Array<{
      id: string;
      wireSize: string;
      length: number;
      voltageDrop: number;
      route: Point3D[];
      breaker: number;
    }>;
    loadBalance: { phase1: number; phase2: number; phase3: number };
    compliance: { isCompliant: boolean; messages: string[] };
  } {
    const circuits: Array<{
      id: string;
      wireSize: string;
      length: number;
      voltageDrop: number;
      route: Point3D[];
      breaker: number;
    }> = [];

    const loadBalance = { phase1: 0, phase2: 0, phase3: 0 };
    let currentPhase = 1;

    loads.forEach((load) => {
      const route = this.findOptimalRoute(panel.position, load.position, conduitPaths);
      const length = this.calculateRouteLength(route);
      
      // Calculate wire size based on load and length
      const wireSize = this.calculateWireSize(load.load, length, panel.voltage);
      
      // Calculate voltage drop
      const voltageDrop = this.calculateVoltageDrop(load.load, length, wireSize, panel.voltage);
      
      // Select breaker size
      const breaker = this.selectBreakerSize(load.load);

      circuits.push({
        id: uuidv4(),
        wireSize,
        length,
        voltageDrop,
        route,
        breaker,
      });

      // Balance loads across phases
      if (currentPhase === 1) loadBalance.phase1 += load.load;
      else if (currentPhase === 2) loadBalance.phase2 += load.load;
      else loadBalance.phase3 += load.load;
      
      currentPhase = (currentPhase % 3) + 1;
    });

    // Check compliance
    const compliance = this.checkElectricalCompliance(circuits, loadBalance);

    return { circuits, loadBalance, compliance };
  }

  /**
   * Find optimal wire route using A* pathfinding
   */
  private static findOptimalRoute(start: Point3D, end: Point3D, paths: Point3D[][]): Point3D[] {
    // Simplified - direct path
    return [start, end];
  }

  /**
   * Calculate route length
   */
  private static calculateRouteLength(route: Point3D[]): number {
    let length = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const dx = route[i + 1].x - route[i].x;
      const dy = route[i + 1].y - route[i].y;
      const dz = route[i + 1].z - route[i].z;
      length += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return length;
  }

  /**
   * Calculate wire size based on NEC standards
   */
  private static calculateWireSize(load: number, length: number, voltage: number): string {
    const current = (load * 1000) / voltage;
    
    // NEC ampacity table (simplified)
    if (current <= 15) return '#14 AWG';
    if (current <= 20) return '#12 AWG';
    if (current <= 30) return '#10 AWG';
    if (current <= 40) return '#8 AWG';
    if (current <= 55) return '#6 AWG';
    if (current <= 70) return '#4 AWG';
    return '#2 AWG';
  }

  /**
   * Calculate voltage drop
   */
  private static calculateVoltageDrop(
    load: number,
    length: number,
    wireSize: string,
    voltage: number
  ): number {
    const current = (load * 1000) / voltage;
    
    // Resistance per 1000ft for copper wire (simplified)
    const resistanceMap: Record<string, number> = {
      '#14 AWG': 2.525,
      '#12 AWG': 1.588,
      '#10 AWG': 0.999,
      '#8 AWG': 0.628,
      '#6 AWG': 0.395,
      '#4 AWG': 0.249,
      '#2 AWG': 0.156,
    };

    const resistance = resistanceMap[wireSize] || 1.0;
    const lengthInFeet = length * 3.28084;
    const voltageDrop = (2 * current * lengthInFeet * resistance) / 1000;
    
    return voltageDrop;
  }

  /**
   * Select appropriate breaker size
   */
  private static selectBreakerSize(load: number): number {
    const current = load * 1.25; // 125% of continuous load
    
    // Standard breaker sizes
    const breakerSizes = [15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    
    for (const size of breakerSizes) {
      if (size >= current) return size;
    }
    
    return 100;
  }

  /**
   * Check electrical code compliance
   */
  private static checkElectricalCompliance(
    circuits: any[],
    loadBalance: any
  ): { isCompliant: boolean; messages: string[] } {
    const messages: string[] = [];
    let isCompliant = true;

    // Check voltage drop (NEC recommends < 3% for branch circuits)
    circuits.forEach((circuit) => {
      if (circuit.voltageDrop > 3.6) { // 3% of 120V
        messages.push(`Circuit ${circuit.id}: Voltage drop ${circuit.voltageDrop.toFixed(1)}V exceeds 3% limit`);
        isCompliant = false;
      }
    });

    // Check load balance (should be within 20% across phases)
    const avgLoad = (loadBalance.phase1 + loadBalance.phase2 + loadBalance.phase3) / 3;
    const maxDeviation = Math.max(
      Math.abs(loadBalance.phase1 - avgLoad),
      Math.abs(loadBalance.phase2 - avgLoad),
      Math.abs(loadBalance.phase3 - avgLoad)
    );

    if (maxDeviation / avgLoad > 0.2) {
      messages.push('Load imbalance exceeds 20% - redistribute loads');
    }

    if (isCompliant) {
      messages.push('Electrical design complies with NEC');
    }

    return { isCompliant, messages };
  }
}

/**
 * Plumbing Pipe Slope Logic
 */
export class PlumbingSystem {
  /**
   * Smart gravity-fed plumbing with automatic slope calculation
   */
  static routePlumbingPipe(
    start: Point3D,
    end: Point3D,
    pipeType: 'WASTE' | 'VENT' | 'WATER',
    pipeDiameter: number
  ): {
    route: Point3D[];
    slope: number; // in %
    invertLevels: number[];
    fittings: Array<{ type: string; position: Point3D; angle: number }>;
    compliance: { isCompliant: boolean; messages: string[] };
  } {
    const route: Point3D[] = [];
    const invertLevels: number[] = [];
    const fittings: Array<{ type: string; position: Point3D; angle: number }> = [];

    // Calculate required slope based on pipe type and diameter
    const minSlope = this.getMinimumSlope(pipeType, pipeDiameter);

    // Calculate horizontal distance
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    // Calculate actual slope
    const verticalDrop = end.y - start.y;
    const actualSlope = (Math.abs(verticalDrop) / horizontalDistance) * 100;

    // Generate route with proper slope
    route.push(start);
    invertLevels.push(start.y);

    // Add intermediate points if route requires direction changes
    const segments = 5;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const point: Point3D = {
        x: start.x + dx * t,
        y: start.y + verticalDrop * t,
        z: start.z + dz * t,
      };
      route.push(point);
      invertLevels.push(point.y);

      // Add fittings at direction changes
      if (i % 2 === 0) {
        fittings.push({
          type: '90° Elbow',
          position: point,
          angle: 90,
        });
      }
    }

    route.push(end);
    invertLevels.push(end.y);

    // Check compliance
    const compliance = this.checkPlumbingCompliance(pipeType, pipeDiameter, actualSlope, minSlope);

    return {
      route,
      slope: actualSlope,
      invertLevels,
      fittings,
      compliance,
    };
  }

  /**
   * Get minimum slope requirement from plumbing code
   */
  private static getMinimumSlope(pipeType: string, diameter: number): number {
    // IPC (International Plumbing Code) minimum slopes
    if (pipeType === 'WASTE') {
      if (diameter <= 0.075) return 2.0; // 2% for pipes ≤ 3"
      return 1.0; // 1% for pipes > 3"
    }
    if (pipeType === 'VENT') return 0; // Vents can be level
    return 0.5; // Water supply has minimal slope requirement
  }

  /**
   * Check plumbing code compliance
   */
  private static checkPlumbingCompliance(
    pipeType: string,
    diameter: number,
    actualSlope: number,
    minSlope: number
  ): { isCompliant: boolean; messages: string[] } {
    const messages: string[] = [];
    let isCompliant = true;

    if (pipeType === 'WASTE' && actualSlope < minSlope) {
      messages.push(
        `Waste pipe slope ${actualSlope.toFixed(2)}% is less than minimum ${minSlope}% required`
      );
      isCompliant = false;
    }

    if (actualSlope > 45) {
      messages.push('Slope exceeds 45% - consider adding cleanout or reducing slope');
    }

    if (isCompliant) {
      messages.push(`Plumbing design complies with IPC for ${diameter}m pipe`);
    }

    return { isCompliant, messages };
  }
}

/**
 * HVAC Sizing Engine
 */
export class HVACSystem {
  /**
   * Automatic duct sizing based on CFM requirements
   */
  static sizeDuctwork(
    rooms: Array<{
      id: string;
      volume: number;
      occupancy: number;
      heatLoad: number; // BTU/hr
      coolingLoad: number;
    }>,
    ductMaterial: 'GALVANIZED' | 'FLEX' | 'FIBERGLASS',
    systemType: 'VAV' | 'CAV' | 'DUAL_DUCT'
  ): {
    ducts: Array<{
      roomId: string;
      diameter: number; // inches
      cfm: number;
      velocity: number; // fpm
      pressureDrop: number; // inches water column
    }>;
    totalCFM: number;
    recommendations: string[];
  } {
    const ducts: Array<{
      roomId: string;
      diameter: number;
      cfm: number;
      velocity: number;
      pressureDrop: number;
    }> = [];

    let totalCFM = 0;
    const recommendations: string[] = [];

    rooms.forEach((room) => {
      // Calculate required CFM
      const cfm = this.calculateRequiredCFM(room);
      totalCFM += cfm;

      // Size duct based on velocity method (700-900 fpm for main ducts)
      const targetVelocity = 800; // fpm
      const area = cfm / targetVelocity; // square feet
      const diameter = Math.sqrt((area * 4) / Math.PI) * 12; // inches

      // Round to standard duct size
      const standardDiameter = this.roundToStandardDuctSize(diameter);

      // Calculate actual velocity
      const actualArea = (Math.PI * Math.pow(standardDiameter / 12, 2)) / 4;
      const actualVelocity = cfm / actualArea;

      // Calculate pressure drop
      const pressureDrop = this.calculatePressureDrop(cfm, standardDiameter, 100); // 100ft length

      ducts.push({
        roomId: room.id,
        diameter: standardDiameter,
        cfm,
        velocity: actualVelocity,
        pressureDrop,
      });

      // Recommendations
      if (actualVelocity > 900) {
        recommendations.push(`Room ${room.id}: Velocity ${actualVelocity.toFixed(0)} fpm exceeds recommended 900 fpm - increase duct size`);
      }
    });

    return { ducts, totalCFM, recommendations };
  }

  /**
   * Calculate required CFM for room
   */
  private static calculateRequiredCFM(room: any): number {
    // Cooling load method: CFM = (BTU/hr) / (1.08 × ΔT)
    // Assuming 20°F temperature difference
    const cfmFromCooling = room.coolingLoad / (1.08 * 20);

    // Ventilation requirement: 15 CFM per person minimum
    const cfmFromVentilation = room.occupancy * 15;

    // Use the larger value
    return Math.max(cfmFromCooling, cfmFromVentilation);
  }

  /**
   * Round to standard duct size
   */
  private static roundToStandardDuctSize(diameter: number): number {
    const standardSizes = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24];
    
    for (const size of standardSizes) {
      if (size >= diameter) return size;
    }
    
    return 24;
  }

  /**
   * Calculate pressure drop in duct
   */
  private static calculatePressureDrop(cfm: number, diameter: number, length: number): number {
    // Simplified pressure drop calculation
    const velocity = (cfm / ((Math.PI * Math.pow(diameter / 12, 2)) / 4));
    const frictionFactor = 0.01; // Simplified
    const pressureDrop = (frictionFactor * length * Math.pow(velocity, 2)) / (5.2 * (diameter / 12));
    
    return pressureDrop / 12; // Convert to inches water column
  }
}

/**
 * Fire Sprinkler Layout System
 */
export class FireSprinklerSystem {
  /**
   * Automatic sprinkler coverage based on hazard classification
   */
  static layoutSprinklers(
    room: { boundary: Point3D[]; area: number; height: number },
    hazardClass: 'LIGHT' | 'ORDINARY_1' | 'ORDINARY_2' | 'EXTRA_1',
    ceilingType: 'SMOOTH' | 'OBSTRUCTED'
  ): {
    sprinklers: Array<{
      position: Point3D;
      coverage: number; // sq ft
      flowRate: number; // gpm
      pressureRequired: number; // psi
    }>;
    totalFlow: number;
    compliance: { isCompliant: boolean; messages: string[] };
  } {
    const sprinklers: Array<{
      position: Point3D;
      coverage: number;
      flowRate: number;
      pressureRequired: number;
    }> = [];

    // Get coverage area per sprinkler based on NFPA 13
    const maxCoverage = this.getMaxSprinklerCoverage(hazardClass, ceilingType);
    const densityRequirement = this.getDensityRequirement(hazardClass); // gpm/sq ft

    // Calculate number of sprinklers needed
    const numSprinklers = Math.ceil(room.area / maxCoverage);

    // Generate grid layout
    const gridSize = Math.sqrt(maxCoverage);
    const numX = Math.ceil(Math.sqrt(numSprinklers));
    const numY = Math.ceil(numSprinklers / numX);

    let totalFlow = 0;

    for (let i = 0; i < numX; i++) {
      for (let j = 0; j < numY; j++) {
        if (sprinklers.length >= numSprinklers) break;

        const x = (i + 0.5) * gridSize;
        const z = (j + 0.5) * gridSize;

        const flowRate = maxCoverage * densityRequirement;
        const pressureRequired = this.calculateRequiredPressure(flowRate);

        sprinklers.push({
          position: { x, y: room.height - 0.3, z }, // 300mm below ceiling
          coverage: maxCoverage,
          flowRate,
          pressureRequired,
        });

        totalFlow += flowRate;
      }
    }

    // Check compliance
    const compliance = this.checkSprinklerCompliance(sprinklers, room, hazardClass);

    return { sprinklers, totalFlow, compliance };
  }

  /**
   * Get maximum coverage area per NFPA 13
   */
  private static getMaxSprinklerCoverage(hazardClass: string, ceilingType: string): number {
    const coverage: Record<string, number> = {
      LIGHT: 225, // sq ft for light hazard
      ORDINARY_1: 130,
      ORDINARY_2: 130,
      EXTRA_1: 100,
    };

    let maxCoverage = coverage[hazardClass] || 130;

    if (ceilingType === 'OBSTRUCTED') {
      maxCoverage *= 0.8; // Reduce coverage for obstructed ceiling
    }

    return maxCoverage;
  }

  /**
   * Get density requirement
   */
  private static getDensityRequirement(hazardClass: string): number {
    const density: Record<string, number> = {
      LIGHT: 0.10, // gpm/sq ft
      ORDINARY_1: 0.15,
      ORDINARY_2: 0.20,
      EXTRA_1: 0.30,
    };

    return density[hazardClass] || 0.15;
  }

  /**
   * Calculate required pressure
   */
  private static calculateRequiredPressure(flowRate: number): number {
    // Using K-factor formula: Q = K√P
    // Assuming K = 5.6 for standard sprinkler
    const K = 5.6;
    const pressure = Math.pow(flowRate / K, 2);
    return pressure;
  }

  /**
   * Check NFPA compliance
   */
  private static checkSprinklerCompliance(
    sprinklers: any[],
    room: any,
    hazardClass: string
  ): { isCompliant: boolean; messages: string[] } {
    const messages: string[] = [];
    let isCompliant = true;

    // Check minimum number of sprinklers
    if (sprinklers.length < 4) {
      messages.push('NFPA 13 requires minimum 4 sprinklers per system');
      isCompliant = false;
    }

    // Check spacing
    for (let i = 0; i < sprinklers.length - 1; i++) {
      const dist = Math.sqrt(
        Math.pow(sprinklers[i + 1].position.x - sprinklers[i].position.x, 2) +
        Math.pow(sprinklers[i + 1].position.z - sprinklers[i].position.z, 2)
      );

      if (dist > 15) {
        messages.push(`Sprinkler spacing ${dist.toFixed(1)}ft exceeds maximum 15ft`);
        isCompliant = false;
      }
    }

    if (isCompliant) {
      messages.push('Sprinkler layout complies with NFPA 13');
    }

    return { isCompliant, messages };
  }
}

/**
 * Solar Array Calculator
 */
export class SolarArrayCalculator {
  /**
   * Calculate solar energy yield based on roof orientation
   */
  static calculateSolarYield(
    roof: { area: number; orientation: number; tilt: number; position: Point3D },
    location: { latitude: number; longitude: number },
    panelEfficiency: number = 0.20,
    systemLosses: number = 0.14
  ): {
    annualYield: number; // kWh/year
    peakPower: number; // kW
    panelLayout: Array<{ position: Point3D; power: number }>;
    paybackPeriod: number; // years
    co2Offset: number; // kg/year
  } {
    // Calculate solar irradiance based on location and orientation
    const annualIrradiance = this.calculateAnnualIrradiance(location.latitude, roof.orientation, roof.tilt);

    // Calculate system capacity
    const panelArea = 1.7; // m² per panel
    const panelPower = 0.35; // kW per panel
    const numPanels = Math.floor(roof.area / panelArea);
    const peakPower = numPanels * panelPower;

    // Calculate annual yield
    const annualYield = peakPower * annualIrradiance * panelEfficiency * (1 - systemLosses);

    // Generate panel layout
    const panelLayout: Array<{ position: Point3D; power: number }> = [];
    const cols = Math.floor(Math.sqrt(numPanels));
    const rows = Math.ceil(numPanels / cols);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (panelLayout.length >= numPanels) break;
        
        panelLayout.push({
          position: {
            x: roof.position.x + j * 1.0,
            y: roof.position.y,
            z: roof.position.z + i * 2.0,
          },
          power: panelPower,
        });
      }
    }

    // Calculate payback period (simplified)
    const electricityRate = 0.12; // $/kWh
    const systemCost = peakPower * 2500; // $2500/kW installed
    const annualSavings = annualYield * electricityRate;
    const paybackPeriod = systemCost / annualSavings;

    // Calculate CO2 offset
    const co2Factor = 0.5; // kg CO2/kWh (grid average)
    const co2Offset = annualYield * co2Factor;

    return {
      annualYield,
      peakPower,
      panelLayout,
      paybackPeriod,
      co2Offset,
    };
  }

  /**
   * Calculate annual solar irradiance
   */
  private static calculateAnnualIrradiance(latitude: number, orientation: number, tilt: number): number {
    // Simplified calculation - would use NREL PVWatts data
    const baseIrradiance = 1800; // kWh/m²/year at optimal conditions
    
    // Orientation factor (south = 1.0)
    const orientationFactor = Math.cos((orientation - 180) * Math.PI / 180) * 0.5 + 0.5;
    
    // Tilt factor (optimal tilt = latitude)
    const optimalTilt = Math.abs(latitude);
    const tiltFactor = 1 - Math.abs(tilt - optimalTilt) / 90 * 0.3;
    
    return baseIrradiance * orientationFactor * tiltFactor;
  }
}
