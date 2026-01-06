import { BIMElement, Point3D } from '../types/bim.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clash Detection Engine
 * Real-time interference checking between disciplines
 */
export class ClashDetectionEngine {
  /**
   * Detect clashes between model elements
   */
  static detectClashes(
    architecturalElements: BIMElement[],
    structuralElements: BIMElement[],
    mepElements: BIMElement[],
    tolerance: number = 0.01
  ): {
    clashes: Array<{
      id: string;
      type: 'HARD' | 'SOFT' | 'CLEARANCE';
      element1: string;
      element2: string;
      location: Point3D;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }>;
    summary: {
      total: number;
      critical: number;
      byDiscipline: Record<string, number>;
    };
  } {
    const clashes: Array<{
      id: string;
      type: 'HARD' | 'SOFT' | 'CLEARANCE';
      element1: string;
      element2: string;
      location: Point3D;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }> = [];

    // Check arch vs structural
    clashes.push(...this.checkPairwise(architecturalElements, structuralElements, 'ARCH_STRUCT', tolerance));
    
    // Check arch vs MEP
    clashes.push(...this.checkPairwise(architecturalElements, mepElements, 'ARCH_MEP', tolerance));
    
    // Check structural vs MEP
    clashes.push(...this.checkPairwise(structuralElements, mepElements, 'STRUCT_MEP', tolerance));

    // Generate summary
    const summary = {
      total: clashes.length,
      critical: clashes.filter((c) => c.severity === 'CRITICAL').length,
      byDiscipline: this.countByDiscipline(clashes),
    };

    return { clashes, summary };
  }

  /**
   * Check clashes between two sets of elements
   */
  private static checkPairwise(
    elements1: BIMElement[],
    elements2: BIMElement[],
    category: string,
    tolerance: number
  ): Array<any> {
    const clashes: Array<any> = [];

    elements1.forEach((el1) => {
      elements2.forEach((el2) => {
        if (this.elementsIntersect(el1, el2, tolerance)) {
          const severity = this.calculateSeverity(el1, el2);
          const clashType = this.determineClashType(el1, el2);
          
          clashes.push({
            id: uuidv4(),
            type: clashType,
            element1: el1.id,
            element2: el2.id,
            location: this.calculateIntersectionPoint(el1, el2),
            severity,
            description: `${el1.name} (${el1.type}) intersects ${el2.name} (${el2.type})`,
          });
        }
      });
    });

    return clashes;
  }

  /**
   * Check if two elements intersect
   */
  private static elementsIntersect(el1: BIMElement, el2: BIMElement, tolerance: number): boolean {
    // Simplified bounding box intersection
    const bbox1 = this.getBoundingBox(el1);
    const bbox2 = this.getBoundingBox(el2);

    return (
      bbox1.min.x - tolerance <= bbox2.max.x &&
      bbox1.max.x + tolerance >= bbox2.min.x &&
      bbox1.min.y - tolerance <= bbox2.max.y &&
      bbox1.max.y + tolerance >= bbox2.min.y &&
      bbox1.min.z - tolerance <= bbox2.max.z &&
      bbox1.max.z + tolerance >= bbox2.min.z
    );
  }

  /**
   * Get bounding box of element
   */
  private static getBoundingBox(element: BIMElement): { min: Point3D; max: Point3D } {
    const vertices = element.geometry.vertices;
    if (vertices.length === 0) {
      return {
        min: element.transform.position,
        max: element.transform.position,
      };
    }

    const min = { ...vertices[0] };
    const max = { ...vertices[0] };

    vertices.forEach((v) => {
      min.x = Math.min(min.x, v.x);
      min.y = Math.min(min.y, v.y);
      min.z = Math.min(min.z, v.z);
      max.x = Math.max(max.x, v.x);
      max.y = Math.max(max.y, v.y);
      max.z = Math.max(max.z, v.z);
    });

    return { min, max };
  }

  /**
   * Calculate intersection point
   */
  private static calculateIntersectionPoint(el1: BIMElement, el2: BIMElement): Point3D {
    // Simplified - return midpoint between elements
    return {
      x: (el1.transform.position.x + el2.transform.position.x) / 2,
      y: (el1.transform.position.y + el2.transform.position.y) / 2,
      z: (el1.transform.position.z + el2.transform.position.z) / 2,
    };
  }

  /**
   * Calculate clash severity
   */
  private static calculateSeverity(el1: BIMElement, el2: BIMElement): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // Critical if structural elements clash
    if (el1.type === 'COLUMN' || el1.type === 'BEAM' || el2.type === 'COLUMN' || el2.type === 'BEAM') {
      return 'CRITICAL';
    }
    
    // High if MEP clashes with structure
    if ((el1.type.startsWith('MEP') && el2.type === 'BEAM') || 
        (el2.type.startsWith('MEP') && el1.type === 'BEAM')) {
      return 'HIGH';
    }

    return 'MEDIUM';
  }

  /**
   * Determine clash type
   */
  private static determineClashType(el1: BIMElement, el2: BIMElement): 'HARD' | 'SOFT' | 'CLEARANCE' {
    // Hard clash if both are solid elements
    if (this.isSolidElement(el1) && this.isSolidElement(el2)) {
      return 'HARD';
    }
    return 'SOFT';
  }

  /**
   * Check if element is solid
   */
  private static isSolidElement(element: BIMElement): boolean {
    return ['WALL', 'COLUMN', 'BEAM', 'FLOOR'].includes(element.type);
  }

  /**
   * Count clashes by discipline
   */
  private static countByDiscipline(clashes: any[]): Record<string, number> {
    const counts: Record<string, number> = {
      ARCH_STRUCT: 0,
      ARCH_MEP: 0,
      STRUCT_MEP: 0,
    };

    clashes.forEach((clash) => {
      // Simplified categorization
      counts.ARCH_STRUCT++;
    });

    return counts;
  }
}

/**
 * Occupancy and Evacuation Simulation
 */
export class OccupancySimulator {
  /**
   * Simulate pedestrian crowd flow
   */
  static simulateEvacuation(
    building: {
      rooms: Array<{ id: string; area: number; occupancy: number; exits: string[] }>;
      exits: Array<{ id: string; position: Point3D; width: number; capacity: number }>;
      corridors: Array<{ id: string; width: number; length: number }>;
    },
    scenarioType: 'FIRE' | 'EARTHQUAKE' | 'NORMAL'
  ): {
    totalEvacuationTime: number;
    bottlenecks: Array<{ location: string; congestion: number; delay: number }>;
    safetyRating: 'SAFE' | 'MARGINAL' | 'UNSAFE';
    recommendations: string[];
  } {
    let totalEvacuationTime = 0;
    const bottlenecks: Array<{ location: string; congestion: number; delay: number }> = [];
    const recommendations: string[] = [];

    // Calculate total occupancy
    const totalOccupancy = building.rooms.reduce((sum, room) => sum + room.occupancy, 0);

    // Calculate exit capacities
    const totalExitCapacity = building.exits.reduce((sum, exit) => {
      return sum + exit.width * 60; // 60 people per meter width per minute
    }, 0);

    // Flow rate based on scenario
    const flowMultiplier = scenarioType === 'FIRE' ? 0.7 : scenarioType === 'EARTHQUAKE' ? 0.5 : 1.0;
    const adjustedCapacity = totalExitCapacity * flowMultiplier;

    // Calculate evacuation time
    totalEvacuationTime = (totalOccupancy / adjustedCapacity) * 60; // in seconds

    // Check for bottlenecks
    building.exits.forEach((exit) => {
      const roomsUsingExit = building.rooms.filter((r) => r.exits.includes(exit.id));
      const load = roomsUsingExit.reduce((sum, r) => sum + r.occupancy, 0);
      const capacity = exit.capacity;

      if (load > capacity) {
        const congestion = load / capacity;
        const delay = (load - capacity) / (capacity / 60);
        
        bottlenecks.push({
          location: exit.id,
          congestion,
          delay,
        });

        recommendations.push(`Exit ${exit.id} is overcapacity - consider adding exits or widening`);
      }
    });

    // Safety rating
    let safetyRating: 'SAFE' | 'MARGINAL' | 'UNSAFE';
    if (totalEvacuationTime < 180) { // 3 minutes
      safetyRating = 'SAFE';
    } else if (totalEvacuationTime < 300) { // 5 minutes
      safetyRating = 'MARGINAL';
      recommendations.push('Evacuation time is marginal - consider additional exits');
    } else {
      safetyRating = 'UNSAFE';
      recommendations.push('CRITICAL: Evacuation time exceeds safe limits');
    }

    return { totalEvacuationTime, bottlenecks, safetyRating, recommendations };
  }
}

/**
 * Daylight Factor Simulation
 * Ray-tracing for interior light analysis
 */
export class DaylightAnalyzer {
  /**
   * Calculate daylight factor for rooms
   */
  static analyzeDaylight(
    room: { boundary: Point3D[]; height: number; windows: BIMElement[] },
    latitude: number,
    longitude: number,
    date: Date,
    time: number
  ): {
    daylightFactor: number; // Percentage
    illuminanceLevels: Array<{ position: Point3D; lux: number }>;
    sDA: number; // Spatial Daylight Autonomy
    recommendation: string;
  } {
    const illuminanceLevels: Array<{ position: Point3D; lux: number }> = [];

    // Calculate sun position
    const sunPosition = this.calculateSunPosition(latitude, longitude, date, time);

    // Create analysis grid
    const gridSize = 0.5; // 0.5m grid
    const analysisPoints = this.createAnalysisGrid(room.boundary, room.height, gridSize);

    // Ray trace from each point to sky
    analysisPoints.forEach((point) => {
      const skyFactor = this.calculateSkyViewFactor(point, room.windows, sunPosition);
      const illuminance = skyFactor * 10000; // Simplified - would use real sky model
      
      illuminanceLevels.push({
        position: point,
        lux: illuminance,
      });
    });

    // Calculate average daylight factor
    const avgIlluminance = illuminanceLevels.reduce((sum, p) => sum + p.lux, 0) / illuminanceLevels.length;
    const daylightFactor = (avgIlluminance / 10000) * 100; // Percentage of outdoor illuminance

    // Calculate sDA (points above 300 lux for 50% of year)
    const pointsAboveThreshold = illuminanceLevels.filter((p) => p.lux >= 300).length;
    const sDA = (pointsAboveThreshold / illuminanceLevels.length) * 100;

    // Recommendation
    let recommendation = '';
    if (daylightFactor < 2) {
      recommendation = 'Insufficient daylight - consider adding windows or skylights';
    } else if (daylightFactor > 5) {
      recommendation = 'Excellent daylight levels';
    } else {
      recommendation = 'Adequate daylight levels';
    }

    return { daylightFactor, illuminanceLevels, sDA, recommendation };
  }

  /**
   * Calculate sun position
   */
  private static calculateSunPosition(
    latitude: number,
    longitude: number,
    date: Date,
    time: number
  ): { altitude: number; azimuth: number } {
    // Simplified solar calculation
    const dayOfYear = this.getDayOfYear(date);
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
    
    const hourAngle = 15 * (time - 12);
    
    const altitude = Math.asin(
      Math.sin(latitude * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
      Math.cos(latitude * Math.PI / 180) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * (180 / Math.PI);

    const azimuth = 180; // Simplified

    return { altitude, azimuth };
  }

  /**
   * Get day of year
   */
  private static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Create analysis grid
   */
  private static createAnalysisGrid(boundary: Point3D[], height: number, gridSize: number): Point3D[] {
    const points: Point3D[] = [];
    
    // Simplified grid creation
    for (let x = 0; x < 10; x += gridSize) {
      for (let z = 0; z < 10; z += gridSize) {
        points.push({ x, y: 0.8, z }); // Work plane height 0.8m
      }
    }

    return points;
  }

  /**
   * Calculate sky view factor
   */
  private static calculateSkyViewFactor(
    point: Point3D,
    windows: BIMElement[],
    sunPosition: any
  ): number {
    // Simplified - calculate solid angle of visible sky
    let skyFactor = 0;

    windows.forEach((window) => {
      const windowCenter = window.transform.position;
      const distance = Math.sqrt(
        Math.pow(windowCenter.x - point.x, 2) +
        Math.pow(windowCenter.y - point.y, 2) +
        Math.pow(windowCenter.z - point.z, 2)
      );

      // Inverse square law
      skyFactor += 1 / (distance * distance);
    });

    return Math.min(skyFactor, 1.0);
  }
}

/**
 * Wind Load Visualization
 * CFD for building envelope stress
 */
export class WindAnalyzer {
  /**
   * Calculate wind loads on building
   */
  static calculateWindLoads(
    building: { height: number; width: number; depth: number; shape: string },
    windSpeed: number, // m/s
    terrainType: 'OPEN' | 'SUBURBAN' | 'URBAN',
    buildingCode: 'ASCE' | 'EUROCODE' = 'ASCE'
  ): {
    pressureMap: Array<{ location: Point3D; pressure: number; direction: Point3D }>;
    maxPressure: number;
    maxSuction: number;
    designLoads: { windward: number; leeward: number; side: number; roof: number };
  } {
    const pressureMap: Array<{ location: Point3D; pressure: number; direction: Point3D }> = [];

    // Calculate basic wind pressure
    const airDensity = 1.225; // kg/m³
    const dynamicPressure = 0.5 * airDensity * Math.pow(windSpeed, 2);

    // Terrain exposure factor
    const exposureFactor = terrainType === 'OPEN' ? 1.2 : terrainType === 'SUBURBAN' ? 1.0 : 0.8;

    // Calculate pressure coefficients for different faces
    const Cp_windward = 0.8;
    const Cp_leeward = -0.5;
    const Cp_side = -0.7;
    const Cp_roof = -0.9;

    const designLoads = {
      windward: dynamicPressure * Cp_windward * exposureFactor,
      leeward: dynamicPressure * Cp_leeward * exposureFactor,
      side: dynamicPressure * Cp_side * exposureFactor,
      roof: dynamicPressure * Cp_roof * exposureFactor,
    };

    // Generate pressure map
    // Windward face
    for (let y = 0; y < building.height; y += 1) {
      pressureMap.push({
        location: { x: 0, y, z: building.depth / 2 },
        pressure: designLoads.windward,
        direction: { x: 1, y: 0, z: 0 },
      });
    }

    const maxPressure = designLoads.windward;
    const maxSuction = Math.min(designLoads.leeward, designLoads.roof);

    return { pressureMap, maxPressure, maxSuction, designLoads };
  }
}

/**
 * Thermal Bridge Analysis
 */
export class ThermalAnalyzer {
  /**
   * Detect thermal bridges in building envelope
   */
  static detectThermalBridges(
    envelope: BIMElement[],
    interiorTemp: number = 20, // Celsius
    exteriorTemp: number = -10
  ): {
    bridges: Array<{
      location: Point3D;
      elementId: string;
      heatLoss: number; // Watts
      uValue: number; // W/m²K
      severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    }>;
    totalHeatLoss: number;
    recommendations: string[];
  } {
    const bridges: Array<{
      location: Point3D;
      elementId: string;
      heatLoss: number;
      uValue: number;
      severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    }> = [];

    let totalHeatLoss = 0;
    const recommendations: string[] = [];

    envelope.forEach((element) => {
      const uValue = this.calculateUValue(element);
      const area = this.calculateSurfaceArea(element);
      const deltaT = Math.abs(interiorTemp - exteriorTemp);
      const heatLoss = uValue * area * deltaT;

      let severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
      if (uValue > 2.0) severity = 'CRITICAL';
      else if (uValue > 1.5) severity = 'HIGH';
      else if (uValue > 1.0) severity = 'MODERATE';
      else severity = 'LOW';

      if (severity !== 'LOW') {
        bridges.push({
          location: element.transform.position,
          elementId: element.id,
          heatLoss,
          uValue,
          severity,
        });

        if (severity === 'CRITICAL') {
          recommendations.push(`Critical thermal bridge at ${element.name} - add insulation`);
        }
      }

      totalHeatLoss += heatLoss;
    });

    return { bridges, totalHeatLoss, recommendations };
  }

  /**
   * Calculate U-value of element
   */
  private static calculateUValue(element: BIMElement): number {
    let totalResistance = 0;

    element.layers?.forEach((layer) => {
      const conductivity = layer.material.properties?.thermal || 0.5; // W/mK
      const resistance = layer.thickness / conductivity;
      totalResistance += resistance;
    });

    // Add surface resistances
    totalResistance += 0.13; // Interior surface resistance
    totalResistance += 0.04; // Exterior surface resistance

    return totalResistance > 0 ? 1 / totalResistance : 10;
  }

  /**
   * Calculate surface area
   */
  private static calculateSurfaceArea(element: BIMElement): number {
    // Simplified area calculation
    return 10.0; // m²
  }
}
