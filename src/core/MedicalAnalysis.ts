import { BIMElement, Point3D } from '../types/bim.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clinical Path Analysis System
 * AI simulation of doctor and patient movement patterns
 */
export class ClinicalPathAnalyzer {
  /**
   * Analyze movement patterns to minimize travel distances
   */
  static analyzeMovementPatterns(
    rooms: Array<{ id: string; type: string; position: Point3D; area: number }>,
    pathways: Point3D[][],
    userType: 'DOCTOR' | 'PATIENT' | 'NURSE' | 'EQUIPMENT'
  ): {
    optimalPaths: Array<{ from: string; to: string; distance: number; time: number }>;
    bottlenecks: Array<{ location: Point3D; congestionLevel: number }>;
    recommendations: string[];
  } {
    const optimalPaths: Array<{ from: string; to: string; distance: number; time: number }> = [];
    const bottlenecks: Array<{ location: Point3D; congestionLevel: number }> = [];
    const recommendations: string[] = [];

    // Calculate all room-to-room distances
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const distance = this.calculatePathDistance(rooms[i].position, rooms[j].position, pathways);
        const walkingSpeed = userType === 'PATIENT' ? 0.8 : 1.2; // m/s
        const time = distance / walkingSpeed;

        optimalPaths.push({
          from: rooms[i].id,
          to: rooms[j].id,
          distance,
          time,
        });
      }
    }

    // Identify bottlenecks using pathway intersection analysis
    pathways.forEach((path) => {
      const midpoint = path[Math.floor(path.length / 2)];
      const congestion = this.calculateCongestion(midpoint, pathways);
      
      if (congestion > 3) {
        bottlenecks.push({ location: midpoint, congestionLevel: congestion });
      }
    });

    // Generate recommendations
    if (bottlenecks.length > 0) {
      recommendations.push('Consider widening corridors at identified bottleneck locations');
    }

    const avgDistance = optimalPaths.reduce((sum, p) => sum + p.distance, 0) / optimalPaths.length;
    if (avgDistance > 30) {
      recommendations.push('Average travel distance is high - consider decentralized nurse stations');
    }

    return { optimalPaths, bottlenecks, recommendations };
  }

  /**
   * Calculate path distance using A* algorithm
   */
  private static calculatePathDistance(
    start: Point3D,
    end: Point3D,
    pathways: Point3D[][]
  ): number {
    // Simplified - direct distance
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate congestion at a point
   */
  private static calculateCongestion(point: Point3D, pathways: Point3D[][]): number {
    let count = 0;
    const threshold = 2.0; // 2 meters

    pathways.forEach((path) => {
      path.forEach((p) => {
        const distance = Math.sqrt(
          Math.pow(p.x - point.x, 2) + Math.pow(p.z - point.z, 2)
        );
        if (distance < threshold) count++;
      });
    });

    return count;
  }
}

/**
 * Medical Equipment Interdependency Tracker
 */
export class MedicalEquipmentTracker {
  /**
   * Check equipment requirements when placing medical devices
   */
  static checkEquipmentRequirements(
    equipment: {
      type: string;
      model: string;
      position: Point3D;
    },
    room: BIMElement
  ): {
    requirements: Array<{
      type: 'ELECTRICAL' | 'GAS' | 'VACUUM' | 'DATA' | 'WATER' | 'DRAINAGE';
      voltage?: number;
      amperage?: number;
      gasType?: string;
      pressure?: number;
      satisfied: boolean;
    }>;
    warnings: string[];
  } {
    const requirements: Array<{
      type: 'ELECTRICAL' | 'GAS' | 'VACUUM' | 'DATA' | 'WATER' | 'DRAINAGE';
      voltage?: number;
      amperage?: number;
      gasType?: string;
      pressure?: number;
      satisfied: boolean;
    }> = [];
    const warnings: string[] = [];

    // Define equipment requirements
    const equipmentDatabase: Record<string, any[]> = {
      'ANESTHESIA_MACHINE': [
        { type: 'ELECTRICAL', voltage: 230, amperage: 15 },
        { type: 'GAS', gasType: 'OXYGEN', pressure: 50 },
        { type: 'GAS', gasType: 'MEDICAL_AIR', pressure: 50 },
        { type: 'VACUUM', pressure: -40 },
      ],
      'MRI_SCANNER': [
        { type: 'ELECTRICAL', voltage: 480, amperage: 200 },
        { type: 'WATER', pressure: 40 }, // Cooling
        { type: 'DRAINAGE', pressure: 0 },
      ],
      'SURGICAL_TABLE': [
        { type: 'ELECTRICAL', voltage: 230, amperage: 20 },
        { type: 'DATA', satisfied: false },
      ],
      'PATIENT_MONITOR': [
        { type: 'ELECTRICAL', voltage: 120, amperage: 5 },
        { type: 'DATA', satisfied: false },
      ],
    };

    const reqs = equipmentDatabase[equipment.type] || [];

    reqs.forEach((req) => {
      // Check if room has required infrastructure
      const satisfied = this.checkInfrastructure(room, req);
      requirements.push({ ...req, satisfied });

      if (!satisfied) {
        warnings.push(
          `Missing ${req.type} infrastructure for ${equipment.type}`
        );
      }
    });

    return { requirements, warnings };
  }

  /**
   * Check if room has required infrastructure
   */
  private static checkInfrastructure(room: BIMElement, requirement: any): boolean {
    // Simplified - check room parameters
    const infrastructure = room.parameters.get('infrastructure') || [];
    return infrastructure.includes(requirement.type);
  }
}

/**
 * Cleanroom Pressurization Logic
 * Specialized HVAC zoning for operating theaters
 */
export class CleanroomSystem {
  /**
   * Calculate HVAC requirements for cleanrooms
   */
  static calculateHVACRequirements(
    room: BIMElement,
    cleanroomClass: 'ISO_5' | 'ISO_6' | 'ISO_7' | 'ISO_8',
    roomVolume: number
  ): {
    airChangesPerHour: number;
    filterType: string;
    pressureDifferential: number; // Pascals
    temperatureRange: { min: number; max: number };
    humidityRange: { min: number; max: number };
    complianceStatus: string;
  } {
    let airChangesPerHour = 20;
    let filterType = 'HEPA_H13';
    let pressureDifferential = 5; // Pa

    switch (cleanroomClass) {
      case 'ISO_5':
        airChangesPerHour = 240; // Very high for surgical suites
        filterType = 'ULPA_U15';
        pressureDifferential = 15;
        break;
      case 'ISO_6':
        airChangesPerHour = 150;
        filterType = 'HEPA_H14';
        pressureDifferential = 10;
        break;
      case 'ISO_7':
        airChangesPerHour = 60;
        filterType = 'HEPA_H13';
        pressureDifferential = 8;
        break;
      case 'ISO_8':
        airChangesPerHour = 20;
        filterType = 'HEPA_H13';
        pressureDifferential = 5;
        break;
    }

    const temperatureRange = { min: 20, max: 24 }; // Celsius
    const humidityRange = { min: 40, max: 60 }; // Percentage

    const requiredCFM = (roomVolume * airChangesPerHour) / 60;
    const complianceStatus = `Requires ${requiredCFM.toFixed(0)} CFM with ${filterType} filtration`;

    return {
      airChangesPerHour,
      filterType,
      pressureDifferential,
      temperatureRange,
      humidityRange,
      complianceStatus,
    };
  }
}

/**
 * Acoustic Privacy Mapping
 * Real-time heatmaps of sound transmission
 */
export class AcousticAnalyzer {
  /**
   * Calculate sound transmission between rooms
   */
  static analyzeSoundTransmission(
    sourceRoom: BIMElement,
    receiverRoom: BIMElement,
    walls: BIMElement[]
  ): {
    stc: number; // Sound Transmission Class
    privacyRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    recommendations: string[];
  } {
    let totalSTC = 0;
    let wallCount = 0;

    // Calculate STC for each wall between rooms
    walls.forEach((wall) => {
      const stc = this.calculateWallSTC(wall);
      totalSTC += stc;
      wallCount++;
    });

    const averageSTC = wallCount > 0 ? totalSTC / wallCount : 0;

    let privacyRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    const recommendations: string[] = [];

    if (averageSTC >= 55) {
      privacyRating = 'EXCELLENT';
    } else if (averageSTC >= 50) {
      privacyRating = 'GOOD';
    } else if (averageSTC >= 45) {
      privacyRating = 'FAIR';
      recommendations.push('Consider adding acoustic insulation for better privacy');
    } else {
      privacyRating = 'POOR';
      recommendations.push('Wall assembly does not meet privacy standards');
      recommendations.push('Recommend double stud wall with resilient channels');
    }

    return { stc: averageSTC, privacyRating, recommendations };
  }

  /**
   * Calculate STC rating for a wall
   */
  private static calculateWallSTC(wall: BIMElement): number {
    let stc = 0;

    wall.layers?.forEach((layer) => {
      // Base STC contribution by material type
      const materialSTC: Record<string, number> = {
        GYPSUM: 5,
        CONCRETE: 15,
        BRICK: 12,
        INSULATION: 8,
        ACOUSTIC_INSULATION: 15,
      };

      // Simplified STC calculation
      stc += (materialSTC['GYPSUM'] || 0) * layer.thickness * 10;
    });

    return Math.min(stc, 65); // Cap at typical maximum
  }

  /**
   * Generate acoustic heatmap data
   */
  static generateAcousticHeatmap(
    rooms: BIMElement[],
    walls: BIMElement[]
  ): Array<{ roomId: string; noiseLeve: number; color: string }> {
    const heatmap: Array<{ roomId: string; noiseLevel: number; color: string }> = [];

    rooms.forEach((room) => {
      // Calculate average noise transmission
      let totalNoise = 0;
      const adjacentWalls = walls.filter((w) => this.isAdjacentToRoom(w, room));
      
      adjacentWalls.forEach((wall) => {
        const stc = this.calculateWallSTC(wall);
        totalNoise += 60 - stc; // Lower STC = higher transmitted noise
      });

      const averageNoise = adjacentWalls.length > 0 ? totalNoise / adjacentWalls.length : 0;
      
      // Map to color
      let color = '#00ff00'; // Green (quiet)
      if (averageNoise > 30) color = '#ffff00'; // Yellow
      if (averageNoise > 40) color = '#ff9900'; // Orange
      if (averageNoise > 50) color = '#ff0000'; // Red (loud)

      heatmap.push({ roomId: room.id, noiseLevel: averageNoise, color });
    });

    return heatmap;
  }

  private static isAdjacentToRoom(wall: BIMElement, room: BIMElement): boolean {
    // Simplified adjacency check
    return true; // Would check if wall bounds intersect room bounds
  }
}

/**
 * Nurse Station Sightline Analysis
 * 3D cone-of-vision checks
 */
export class SightlineAnalyzer {
  /**
   * Check visibility from nurse station to patient rooms
   */
  static analyzeNurseStationSightlines(
    nurseStation: { position: Point3D; viewHeight: number },
    patientDoors: Array<{ position: Point3D; roomId: string }>,
    obstacles: BIMElement[]
  ): {
    visibleDoors: string[];
    blockedDoors: Array<{ roomId: string; obstructions: string[] }>;
    coveragePercentage: number;
    recommendations: string[];
  } {
    const visibleDoors: string[] = [];
    const blockedDoors: Array<{ roomId: string; obstructions: string[] }> = [];

    patientDoors.forEach((door) => {
      const isVisible = this.checkLineOfSight(
        nurseStation.position,
        door.position,
        obstacles
      );

      if (isVisible) {
        visibleDoors.push(door.roomId);
      } else {
        const obstructions = this.identifyObstructions(
          nurseStation.position,
          door.position,
          obstacles
        );
        blockedDoors.push({ roomId: door.roomId, obstructions });
      }
    });

    const coveragePercentage = (visibleDoors.length / patientDoors.length) * 100;

    const recommendations: string[] = [];
    if (coveragePercentage < 80) {
      recommendations.push('Consider relocating nurse station for better visibility');
      recommendations.push('Install vision panels in blocking walls');
    }
    if (coveragePercentage < 50) {
      recommendations.push('CRITICAL: Less than 50% of patient rooms visible');
      recommendations.push('Consider multiple nurse stations or monitoring system');
    }

    return { visibleDoors, blockedDoors, coveragePercentage, recommendations };
  }

  /**
   * Check line of sight between two points
   */
  private static checkLineOfSight(
    from: Point3D,
    to: Point3D,
    obstacles: BIMElement[]
  ): boolean {
    // Ray casting to check for obstructions
    for (const obstacle of obstacles) {
      if (this.rayIntersectsElement(from, to, obstacle)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if ray intersects element
   */
  private static rayIntersectsElement(
    from: Point3D,
    to: Point3D,
    element: BIMElement
  ): boolean {
    // Simplified ray-box intersection
    const elementPos = element.transform.position;
    const threshold = 2.0;

    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.sqrt(dx * dx + dz * dz);

    for (let t = 0; t <= 1; t += 0.1) {
      const px = from.x + dx * t;
      const pz = from.z + dz * t;

      const dist = Math.sqrt(
        Math.pow(px - elementPos.x, 2) + Math.pow(pz - elementPos.z, 2)
      );

      if (dist < threshold) return true;
    }

    return false;
  }

  /**
   * Identify obstructing elements
   */
  private static identifyObstructions(
    from: Point3D,
    to: Point3D,
    obstacles: BIMElement[]
  ): string[] {
    const obstructions: string[] = [];

    obstacles.forEach((obstacle) => {
      if (this.rayIntersectsElement(from, to, obstacle)) {
        obstructions.push(obstacle.name);
      }
    });

    return obstructions;
  }
}

/**
 * Radiation Shielding Calculator
 * Automatic thickness for lead-lined walls
 */
export class RadiationShieldingCalculator {
  /**
   * Calculate required lead thickness for X-ray/MRI rooms
   */
  static calculateShieldingRequirements(
    roomType: 'X_RAY' | 'CT_SCAN' | 'MRI' | 'LINEAR_ACCELERATOR' | 'PET_SCAN',
    maxKVP: number, // Maximum kilovoltage
    workload: number, // mA-min per week
    useFactors: number = 0.25
  ): {
    leadThickness: number; // in mm
    alternativeOptions: Array<{ material: string; thickness: number }>;
    calculations: {
      shieldingFactor: number;
      transmissionFactor: number;
    };
  } {
    let leadThickness = 0;

    // Simplified shielding calculations based on NCRP guidelines
    switch (roomType) {
      case 'X_RAY':
        if (maxKVP <= 100) {
          leadThickness = 1.6; // 1/16 inch
        } else if (maxKVP <= 125) {
          leadThickness = 2.4; // 3/32 inch
        } else {
          leadThickness = 3.2; // 1/8 inch
        }
        break;
      case 'CT_SCAN':
        leadThickness = 2.0; // Typical for CT
        break;
      case 'MRI':
        leadThickness = 0; // MRI doesn't require lead shielding
        break;
      case 'LINEAR_ACCELERATOR':
        leadThickness = 6.0; // Heavy shielding required
        break;
      case 'PET_SCAN':
        leadThickness = 4.0;
        break;
    }

    // Adjust for workload
    const workloadFactor = Math.log10(workload / 1000) * 0.5;
    leadThickness += workloadFactor;

    // Alternative shielding materials
    const alternativeOptions = [
      { material: 'Concrete', thickness: leadThickness * 13 }, // Lead equivalency
      { material: 'Steel', thickness: leadThickness * 3.5 },
      { material: 'Lead Glass', thickness: leadThickness * 1.2 },
    ];

    const shieldingFactor = Math.pow(10, leadThickness / 2);
    const transmissionFactor = 1 / shieldingFactor;

    return {
      leadThickness: Math.round(leadThickness * 10) / 10,
      alternativeOptions,
      calculations: {
        shieldingFactor,
        transmissionFactor,
      },
    };
  }
}
