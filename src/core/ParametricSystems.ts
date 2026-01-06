import { BIMElement, Point3D, Material, Layer } from '../types/bim.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced Parametric Component System
 * Handles intelligent wall systems with load-bearing calculations and smart joins
 */
export class ParametricWallSystem {
  /**
   * Calculate structural load-bearing capacity based on material density
   */
  static calculateLoadBearingCapacity(
    wall: BIMElement,
    materials: Material[]
  ): {
    maxVerticalLoad: number; // in kN
    maxLateralLoad: number; // in kN
    safetyFactor: number;
  } {
    let totalThickness = 0;
    let totalStrength = 0;

    wall.layers?.forEach((layer) => {
      const material = materials.find((m) => m.id === layer.material.id);
      if (material?.properties?.structural) {
        totalThickness += layer.thickness;
        totalStrength += material.properties.structural.strength * layer.thickness;
      }
    });

    // Simplified calculation - real implementation would use engineering formulas
    const wallArea = this.calculateWallArea(wall);
    const maxVerticalLoad = totalStrength * wallArea * 0.8; // 80% safety factor
    const maxLateralLoad = maxVerticalLoad * 0.3; // Lateral is typically 30% of vertical

    return {
      maxVerticalLoad,
      maxLateralLoad,
      safetyFactor: 0.8,
    };
  }

  /**
   * Smart wall join logic - automatic cleaning and trimming at intersections
   */
  static cleanWallIntersections(
    walls: BIMElement[],
    tolerance: number = 0.001
  ): BIMElement[] {
    const cleanedWalls: BIMElement[] = [];

    walls.forEach((wall, index) => {
      const intersectingWalls = walls.filter((w, i) => i !== index && this.wallsIntersect(wall, w, tolerance));
      
      if (intersectingWalls.length > 0) {
        const cleaned = this.trimWallAtIntersections(wall, intersectingWalls);
        cleanedWalls.push(cleaned);
      } else {
        cleanedWalls.push(wall);
      }
    });

    return cleanedWalls;
  }

  /**
   * Detect if two walls intersect
   */
  private static wallsIntersect(wall1: BIMElement, wall2: BIMElement, tolerance: number): boolean {
    // Simplified intersection detection
    const w1Start = wall1.geometry.vertices[0];
    const w1End = wall1.geometry.vertices[3];
    const w2Start = wall2.geometry.vertices[0];
    const w2End = wall2.geometry.vertices[3];

    return this.lineSegmentsIntersect(w1Start, w1End, w2Start, w2End, tolerance);
  }

  /**
   * Check if two line segments intersect
   */
  private static lineSegmentsIntersect(
    p1: Point3D,
    p2: Point3D,
    p3: Point3D,
    p4: Point3D,
    tolerance: number
  ): boolean {
    const d1x = p2.x - p1.x;
    const d1z = p2.z - p1.z;
    const d2x = p4.x - p3.x;
    const d2z = p4.z - p3.z;

    const det = d1x * d2z - d1z * d2x;
    if (Math.abs(det) < tolerance) return false;

    const t = ((p3.x - p1.x) * d2z - (p3.z - p1.z) * d2x) / det;
    const u = ((p3.x - p1.x) * d1z - (p3.z - p1.z) * d1x) / det;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  /**
   * Trim wall at intersections
   */
  private static trimWallAtIntersections(wall: BIMElement, intersecting: BIMElement[]): BIMElement {
    // Create a copy of the wall with trimmed geometry
    const trimmed = { ...wall };
    trimmed.id = uuidv4();
    // In a real implementation, this would modify the geometry to clean up intersections
    trimmed.metadata = {
      ...wall.metadata,
      modified: new Date(),
    };
    return trimmed;
  }

  /**
   * Calculate wall surface area
   */
  private static calculateWallArea(wall: BIMElement): number {
    // Simplified area calculation
    const vertices = wall.geometry.vertices;
    if (vertices.length < 4) return 0;

    const length = Math.sqrt(
      Math.pow(vertices[3].x - vertices[0].x, 2) + Math.pow(vertices[3].z - vertices[0].z, 2)
    );
    const height = vertices[4].y - vertices[0].y;

    return length * height;
  }
}

/**
 * Automated Room Analysis System
 */
export class RoomAnalyzer {
  /**
   * Real-time calculation of room volumes and areas
   */
  static calculateRoomMetrics(
    walls: BIMElement[],
    floors: BIMElement[],
    ceilings: BIMElement[]
  ): {
    area: number;
    volume: number;
    perimeter: number;
    boundingBox: { min: Point3D; max: Point3D };
  } {
    const boundary = this.extractRoomBoundary(walls);
    const area = this.calculatePolygonArea(boundary);
    const perimeter = this.calculatePerimeter(boundary);

    // Find floor and ceiling heights
    const floorElevation = floors.length > 0 ? floors[0].transform.position.y : 0;
    const ceilingElevation = ceilings.length > 0 ? ceilings[0].transform.position.y : 3.0;
    const height = ceilingElevation - floorElevation;

    const volume = area * height;

    const boundingBox = this.calculateBoundingBox(boundary);

    return { area, volume, perimeter, boundingBox };
  }

  /**
   * Extract room boundary from walls
   */
  private static extractRoomBoundary(walls: BIMElement[]): Point3D[] {
    const boundary: Point3D[] = [];
    
    // Simplified - extract vertices from wall endpoints
    walls.forEach((wall) => {
      if (wall.geometry.vertices.length > 0) {
        boundary.push(wall.geometry.vertices[0]);
      }
    });

    return boundary;
  }

  /**
   * Calculate polygon area using Shoelace formula
   */
  private static calculatePolygonArea(points: Point3D[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].z;
      area -= points[j].x * points[i].z;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Calculate perimeter
   */
  private static calculatePerimeter(points: Point3D[]): number {
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dz = points[j].z - points[i].z;
      perimeter += Math.sqrt(dx * dx + dz * dz);
    }
    return perimeter;
  }

  /**
   * Calculate bounding box
   */
  private static calculateBoundingBox(points: Point3D[]): { min: Point3D; max: Point3D } {
    if (points.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    const min = { ...points[0] };
    const max = { ...points[0] };

    points.forEach((p) => {
      min.x = Math.min(min.x, p.x);
      min.y = Math.min(min.y, p.y);
      min.z = Math.min(min.z, p.z);
      max.x = Math.max(max.x, p.x);
      max.y = Math.max(max.y, p.y);
      max.z = Math.max(max.z, p.z);
    });

    return { min, max };
  }

  /**
   * Automatic room detection - detects enclosed spaces
   */
  static detectRooms(walls: BIMElement[]): Array<{ id: string; boundary: Point3D[]; name: string }> {
    const rooms: Array<{ id: string; boundary: Point3D[]; name: string }> = [];
    
    // Simplified room detection algorithm
    // In a real implementation, this would use graph theory to find closed loops
    const detected = {
      id: uuidv4(),
      boundary: this.extractRoomBoundary(walls),
      name: 'Room ' + (rooms.length + 1),
    };

    rooms.push(detected);
    return rooms;
  }
}

/**
 * Generative Floor Plan System using AI
 */
export class GenerativeFloorPlanner {
  /**
   * Generate floor plan layouts based on requirements
   */
  static generateLayout(
    requirements: {
      rooms: Array<{ type: string; minArea: number; adjacency: string[] }>;
      siteArea: number;
      daylightingGoals: 'MAXIMIZE' | 'MODERATE' | 'MINIMAL';
      orientation: number; // Building orientation in degrees
    }
  ): {
    layout: Array<{ type: string; boundary: Point3D[]; area: number }>;
    score: number;
  } {
    const layout: Array<{ type: string; boundary: Point3D[]; area: number }> = [];
    
    // Simplified generative algorithm
    // Real implementation would use genetic algorithms or machine learning
    let currentX = 0;
    let currentZ = 0;

    requirements.rooms.forEach((room) => {
      const width = Math.sqrt(room.minArea);
      const depth = room.minArea / width;

      const boundary: Point3D[] = [
        { x: currentX, y: 0, z: currentZ },
        { x: currentX + width, y: 0, z: currentZ },
        { x: currentX + width, y: 0, z: currentZ + depth },
        { x: currentX, y: 0, z: currentZ + depth },
      ];

      layout.push({
        type: room.type,
        boundary,
        area: room.minArea,
      });

      currentX += width + 0.5; // Add corridor space
    });

    // Calculate layout score based on daylighting and adjacency
    const score = this.evaluateLayout(layout, requirements);

    return { layout, score };
  }

  /**
   * Evaluate layout quality
   */
  private static evaluateLayout(
    layout: Array<{ type: string; boundary: Point3D[]; area: number }>,
    requirements: any
  ): number {
    let score = 100;

    // Penalize for poor daylighting (simplified)
    if (requirements.daylightingGoals === 'MAXIMIZE') {
      // Check if rooms are oriented correctly
      score += 10;
    }

    // Check adjacency requirements
    // Real implementation would verify room connections

    return score;
  }
}

/**
 * Dynamic Façade System
 */
export class DynamicFacadeSystem {
  /**
   * Generate parametric curtain wall based on solar orientation
   */
  static generateSolarResponsiveFacade(
    buildingFace: Point3D[],
    height: number,
    solarOrientation: number, // Degrees from north
    latitude: number
  ): {
    panels: Array<{
      position: Point3D;
      rotation: number;
      shadingDepth: number;
      glassType: 'CLEAR' | 'TINTED' | 'LOW_E' | 'FRITTED';
    }>;
  } {
    const panels: Array<{
      position: Point3D;
      rotation: number;
      shadingDepth: number;
      glassType: 'CLEAR' | 'TINTED' | 'LOW_E' | 'FRITTED';
    }> = [];

    // Calculate solar exposure
    const solarExposure = this.calculateSolarExposure(solarOrientation, latitude);

    // Generate panel grid
    const panelWidth = 1.5;
    const panelHeight = 2.0;

    for (let y = 0; y < height; y += panelHeight) {
      const length = Math.sqrt(
        Math.pow(buildingFace[1].x - buildingFace[0].x, 2) +
          Math.pow(buildingFace[1].z - buildingFace[0].z, 2)
      );

      for (let x = 0; x < length; x += panelWidth) {
        const position: Point3D = {
          x: buildingFace[0].x + x,
          y: buildingFace[0].y + y,
          z: buildingFace[0].z,
        };

        // Adjust shading based on solar exposure
        let shadingDepth = 0;
        let glassType: 'CLEAR' | 'TINTED' | 'LOW_E' | 'FRITTED' = 'CLEAR';

        if (solarExposure > 70) {
          shadingDepth = 0.5;
          glassType = 'LOW_E';
        } else if (solarExposure > 50) {
          shadingDepth = 0.3;
          glassType = 'TINTED';
        }

        panels.push({
          position,
          rotation: 0,
          shadingDepth,
          glassType,
        });
      }
    }

    return { panels };
  }

  /**
   * Calculate solar exposure percentage
   */
  private static calculateSolarExposure(orientation: number, latitude: number): number {
    // Simplified calculation
    // Real implementation would use solar path analysis
    const optimalOrientation = latitude > 0 ? 180 : 0; // South in northern hemisphere
    const deviation = Math.abs(orientation - optimalOrientation);
    return Math.max(0, 100 - deviation / 1.8);
  }
}

/**
 * Adaptive Component System
 * Components that change LOD based on view scale
 */
export class AdaptiveComponentSystem {
  /**
   * Get appropriate LOD based on camera distance
   */
  static getAdaptiveLOD(
    component: BIMElement,
    cameraDistance: number,
    viewScale: number
  ): 'COARSE' | 'MEDIUM' | 'FINE' | 'EXTRA_FINE' {
    const effectiveDistance = cameraDistance / viewScale;

    if (effectiveDistance > 50) return 'COARSE';
    if (effectiveDistance > 20) return 'MEDIUM';
    if (effectiveDistance > 5) return 'FINE';
    return 'EXTRA_FINE';
  }

  /**
   * Generate geometry based on LOD
   */
  static generateLODGeometry(component: BIMElement, lod: string): BIMElement {
    const simplified = { ...component };

    // Adjust geometry detail based on LOD
    switch (lod) {
      case 'COARSE':
        // Use bounding box representation
        simplified.geometry = this.createBoundingBoxGeometry(component);
        break;
      case 'MEDIUM':
        // Simplified geometry with major features
        simplified.geometry = this.createMediumDetailGeometry(component);
        break;
      case 'FINE':
      case 'EXTRA_FINE':
        // Full detail - use original geometry
        break;
    }

    return simplified;
  }

  private static createBoundingBoxGeometry(component: BIMElement): any {
    // Create simple box from bounding box
    return component.geometry; // Simplified for now
  }

  private static createMediumDetailGeometry(component: BIMElement): any {
    // Reduce polygon count
    return component.geometry; // Simplified for now
  }
}
