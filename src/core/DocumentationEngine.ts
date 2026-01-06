import { BIMElement, View, Point3D, Material } from '../types/bim.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Automatic Documentation Generation System
 */
export class DocumentationEngine {
  /**
   * Generate 4-way interior elevations automatically
   */
  static generateInteriorElevations(
    room: { id: string; boundary: Point3D[]; height: number },
    elements: BIMElement[]
  ): Array<{
    direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
    view: View;
    annotations: Array<{ type: string; position: Point3D; text: string }>;
  }> {
    const elevations: Array<{
      direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
      view: View;
      annotations: Array<{ type: string; position: Point3D; text: string }>;
    }> = [];

    const directions: Array<'NORTH' | 'SOUTH' | 'EAST' | 'WEST'> = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    const center = this.calculateCentroid(room.boundary);

    directions.forEach((dir, index) => {
      const angle = index * 90;
      const cameraPos = this.calculateCameraPosition(center, dir, 5);
      const target = center;

      const view: View = {
        id: uuidv4(),
        name: `Room ${room.id} - ${dir} Elevation`,
        type: 'ELEVATION',
        camera: {
          position: cameraPos,
          target,
          up: { x: 0, y: 1, z: 0 } as any,
        },
        displaySettings: {
          showGrid: false,
          showAnnotations: true,
          detailLevel: 'FINE',
          visualStyle: 'HIDDEN_LINE',
        },
      };

      // Generate annotations
      const annotations = this.generateElevationAnnotations(elements, dir);

      elevations.push({ direction: dir, view, annotations });
    });

    return elevations;
  }

  /**
   * Calculate camera position for elevation
   */
  private static calculateCameraPosition(
    center: Point3D,
    direction: string,
    distance: number
  ): Point3D {
    const offset: Record<string, Point3D> = {
      NORTH: { x: 0, y: 0, z: distance },
      SOUTH: { x: 0, y: 0, z: -distance },
      EAST: { x: distance, y: 0, z: 0 },
      WEST: { x: -distance, y: 0, z: 0 },
    };

    return {
      x: center.x + offset[direction].x,
      y: center.y + 1.5, // Eye height
      z: center.z + offset[direction].z,
    };
  }

  /**
   * Generate annotations for elevation
   */
  private static generateElevationAnnotations(
    elements: BIMElement[],
    direction: string
  ): Array<{ type: string; position: Point3D; text: string }> {
    const annotations: Array<{ type: string; position: Point3D; text: string }> = [];

    elements.forEach((element) => {
      if (element.type === 'DOOR' || element.type === 'WINDOW') {
        annotations.push({
          type: 'DIMENSION',
          position: element.transform.position,
          text: `${element.name} - ${element.type}`,
        });
      }
    });

    return annotations;
  }

  /**
   * Generate smart sections that update dynamically
   */
  static generateSmartSection(
    cutPlane: { point: Point3D; normal: Point3D },
    elements: BIMElement[],
    name: string
  ): {
    sectionView: View;
    cutElements: Array<{ elementId: string; cutGeometry: any }>;
    annotations: Array<{ type: string; text: string; position: Point3D }>;
  } {
    const sectionView: View = {
      id: uuidv4(),
      name: `Section - ${name}`,
      type: 'SECTION',
      camera: {
        position: cutPlane.point,
        target: { x: cutPlane.point.x, y: cutPlane.point.y, z: cutPlane.point.z + 1 },
        up: { x: 0, y: 1, z: 0 } as any,
      },
      displaySettings: {
        showGrid: true,
        showAnnotations: true,
        detailLevel: 'FINE',
        visualStyle: 'HIDDEN_LINE',
      },
    };

    const cutElements: Array<{ elementId: string; cutGeometry: any }> = [];
    const annotations: Array<{ type: string; text: string; position: Point3D }> = [];

    // Determine which elements are cut by the plane
    elements.forEach((element) => {
      if (this.elementIntersectsPlane(element, cutPlane)) {
        cutElements.push({
          elementId: element.id,
          cutGeometry: this.generateCutGeometry(element, cutPlane),
        });

        // Add material annotations
        element.layers?.forEach((layer) => {
          annotations.push({
            type: 'MATERIAL_TAG',
            text: `${layer.material.name} - ${layer.thickness}mm`,
            position: element.transform.position,
          });
        });
      }
    });

    return { sectionView, cutElements, annotations };
  }

  /**
   * Check if element intersects cutting plane
   */
  private static elementIntersectsPlane(element: BIMElement, cutPlane: any): boolean {
    // Simplified plane intersection check
    return true; // Would check if element's bounding box intersects plane
  }

  /**
   * Generate cut geometry
   */
  private static generateCutGeometry(element: BIMElement, cutPlane: any): any {
    // Would generate the 2D profile where element is cut
    return {};
  }

  /**
   * Generate automated dimension chains
   */
  static generateDimensionChains(
    elements: BIMElement[],
    dimensionType: 'TO_CENTER' | 'TO_FACE' | 'OVERALL'
  ): Array<{
    start: Point3D;
    end: Point3D;
    value: number;
    text: string;
  }> {
    const dimensions: Array<{
      start: Point3D;
      end: Point3D;
      value: number;
      text: string;
    }> = [];

    // Sort elements by position
    const sorted = [...elements].sort((a, b) => a.transform.position.x - b.transform.position.x);

    for (let i = 0; i < sorted.length - 1; i++) {
      const start = sorted[i].transform.position;
      const end = sorted[i + 1].transform.position;
      
      const value = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2) +
        Math.pow(end.z - start.z, 2)
      );

      dimensions.push({
        start,
        end,
        value,
        text: `${(value * 1000).toFixed(0)}mm`,
      });
    }

    return dimensions;
  }

  /**
   * Generate live legend keys
   */
  static generateLiveLegend(
    elements: BIMElement[],
    view: View
  ): Array<{
    symbolType: string;
    name: string;
    color: string;
    pattern?: string;
  }> {
    const legend: Array<{
      symbolType: string;
      name: string;
      color: string;
      pattern?: string;
    }> = [];

    const materialsUsed = new Set<string>();
    const elementTypesUsed = new Set<string>();

    // Extract unique materials and types from visible elements
    elements.forEach((element) => {
      elementTypesUsed.add(element.type);
      element.materials.forEach((mat) => {
        materialsUsed.add(mat.name);
      });
    });

    // Generate legend entries
    materialsUsed.forEach((material) => {
      legend.push({
        symbolType: 'MATERIAL',
        name: material,
        color: '#808080', // Would map to actual material color
        pattern: 'SOLID',
      });
    });

    elementTypesUsed.forEach((type) => {
      legend.push({
        symbolType: 'ELEMENT',
        name: type,
        color: this.getElementTypeColor(type),
      });
    });

    return legend;
  }

  /**
   * Get standard color for element type
   */
  private static getElementTypeColor(type: string): string {
    const colors: Record<string, string> = {
      WALL: '#000000',
      DOOR: '#8B4513',
      WINDOW: '#87CEEB',
      COLUMN: '#FF0000',
      BEAM: '#0000FF',
    };
    return colors[type] || '#808080';
  }

  /**
   * Multi-language annotation translation
   */
  static translateAnnotations(
    annotations: Array<{ text: string; language: string }>,
    targetLanguage: string
  ): Array<{ original: string; translated: string }> {
    // Simplified translation - would integrate with translation API
    const translations: Array<{ original: string; translated: string }> = [];

    const translationDB: Record<string, Record<string, string>> = {
      en: {
        'Wall': 'Wall',
        'Door': 'Door',
        'Window': 'Window',
      },
      es: {
        'Wall': 'Pared',
        'Door': 'Puerta',
        'Window': 'Ventana',
      },
      fr: {
        'Wall': 'Mur',
        'Door': 'Porte',
        'Window': 'Fenêtre',
      },
      de: {
        'Wall': 'Wand',
        'Door': 'Tür',
        'Window': 'Fenster',
      },
      zh: {
        'Wall': '墙',
        'Door': '门',
        'Window': '窗',
      },
    };

    annotations.forEach((annotation) => {
      const translated = translationDB[targetLanguage]?.[annotation.text] || annotation.text;
      translations.push({ original: annotation.text, translated });
    });

    return translations;
  }

  /**
   * Automatic sheet numbering and indexing
   */
  static generateSheetIndex(
    sheets: Array<{ discipline: string; type: string; number: number }>,
    revisionNumber: string
  ): Array<{
    sheetNumber: string;
    sheetName: string;
    revision: string;
  }> {
    const index: Array<{
      sheetNumber: string;
      sheetName: string;
      revision: string;
    }> = [];

    const disciplineCodes: Record<string, string> = {
      ARCHITECTURAL: 'A',
      STRUCTURAL: 'S',
      MECHANICAL: 'M',
      ELECTRICAL: 'E',
      PLUMBING: 'P',
      CIVIL: 'C',
    };

    const typeCodes: Record<string, string> = {
      FLOOR_PLAN: '1',
      ELEVATION: '2',
      SECTION: '3',
      DETAIL: '4',
      SCHEDULE: '5',
    };

    sheets.forEach((sheet) => {
      const disciplineCode = disciplineCodes[sheet.discipline] || 'X';
      const typeCode = typeCodes[sheet.type] || '0';
      const sheetNumber = `${disciplineCode}${typeCode}${sheet.number.toString().padStart(2, '0')}`;
      
      index.push({
        sheetNumber,
        sheetName: `${sheet.discipline} ${sheet.type} ${sheet.number}`,
        revision: revisionNumber,
      });
    });

    return index;
  }

  /**
   * Batch export orchestrator
   */
  static async batchExport(
    project: any,
    formats: Array<'PDF' | 'DWG' | 'IFC' | 'NWC' | 'RVT'>,
    namingConvention: string
  ): Promise<Array<{ filename: string; format: string; size: number }>> {
    const exportedFiles: Array<{ filename: string; format: string; size: number }> = [];

    for (const format of formats) {
      const filename = this.generateFileName(project.name, format, namingConvention);
      const fileContent = await this.exportToFormat(project, format);
      
      exportedFiles.push({
        filename,
        format,
        size: fileContent.length,
      });
    }

    return exportedFiles;
  }

  /**
   * Generate standardized filename
   */
  private static generateFileName(projectName: string, format: string, convention: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${projectName}_${date}.${format.toLowerCase()}`;
  }

  /**
   * Export to format
   */
  private static async exportToFormat(project: any, format: string): Promise<string> {
    // Would generate actual file content
    return `Exported ${format} file content`;
  }

  /**
   * Calculate centroid of polygon
   */
  private static calculateCentroid(points: Point3D[]): Point3D {
    const centroid = { x: 0, y: 0, z: 0 };
    points.forEach((p) => {
      centroid.x += p.x;
      centroid.y += p.y;
      centroid.z += p.z;
    });
    const n = points.length;
    return {
      x: centroid.x / n,
      y: centroid.y / n,
      z: centroid.z / n,
    };
  }
}

/**
 * Real-Time Cost Estimating Engine
 */
export class CostEstimator {
  /**
   * Calculate real-time project cost
   */
  static calculateProjectCost(
    elements: BIMElement[],
    laborRates: { trade: string; rate: number }[],
    materialDatabase: Map<string, { unitCost: number; wasteFactor: number }>
  ): {
    totalCost: number;
    breakdown: Array<{
      category: string;
      materialCost: number;
      laborCost: number;
      subtotal: number;
    }>;
    contingency: number;
  } {
    const breakdown: Array<{
      category: string;
      materialCost: number;
      laborCost: number;
      subtotal: number;
    }> = [];

    const categories = this.groupElementsByCategory(elements);

    let totalMaterialCost = 0;
    let totalLaborCost = 0;

    categories.forEach((categoryElements, category) => {
      const materialCost = this.calculateMaterialCost(categoryElements, materialDatabase);
      const laborCost = this.calculateLaborCost(categoryElements, laborRates);
      
      breakdown.push({
        category,
        materialCost,
        laborCost,
        subtotal: materialCost + laborCost,
      });

      totalMaterialCost += materialCost;
      totalLaborCost += laborCost;
    });

    const subtotal = totalMaterialCost + totalLaborCost;
    const contingency = subtotal * 0.10; // 10% contingency
    const totalCost = subtotal + contingency;

    return { totalCost, breakdown, contingency };
  }

  /**
   * Group elements by category
   */
  private static groupElementsByCategory(elements: BIMElement[]): Map<string, BIMElement[]> {
    const groups = new Map<string, BIMElement[]>();
    
    elements.forEach((element) => {
      const category = element.type;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(element);
    });

    return groups;
  }

  /**
   * Calculate material cost
   */
  private static calculateMaterialCost(
    elements: BIMElement[],
    database: Map<string, { unitCost: number; wasteFactor: number }>
  ): number {
    let cost = 0;

    elements.forEach((element) => {
      element.materials.forEach((material) => {
        const data = database.get(material.id);
        if (data) {
          const quantity = this.calculateMaterialQuantity(element);
          cost += quantity * data.unitCost * (1 + data.wasteFactor);
        }
      });
    });

    return cost;
  }

  /**
   * Calculate labor cost
   */
  private static calculateLaborCost(
    elements: BIMElement[],
    rates: { trade: string; rate: number }[]
  ): number {
    // Simplified labor calculation
    const hours = elements.length * 2; // 2 hours per element (simplified)
    const defaultRate = rates[0]?.rate || 50;
    return hours * defaultRate;
  }

  /**
   * Calculate material quantity
   */
  private static calculateMaterialQuantity(element: BIMElement): number {
    // Simplified - would calculate actual volume/area
    return 1.0;
  }
}

/**
 * Carbon Footprint Calculator
 * LCA (Life Cycle Assessment) for building materials
 */
export class CarbonCalculator {
  /**
   * Calculate embodied carbon for project
   */
  static calculateEmbodiedCarbon(
    elements: BIMElement[],
    carbonDatabase: Map<string, { kgCO2perUnit: number; unit: string }>
  ): {
    totalCarbon: number; // kg CO2e
    breakdown: Array<{ material: string; quantity: number; carbon: number }>;
    rating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E';
  } {
    const breakdown: Array<{ material: string; quantity: number; carbon: number }> = [];
    let totalCarbon = 0;

    elements.forEach((element) => {
      element.materials.forEach((material) => {
        const data = carbonDatabase.get(material.id);
        if (data) {
          const quantity = this.calculateMaterialVolume(element);
          const carbon = quantity * data.kgCO2perUnit;
          
          breakdown.push({
            material: material.name,
            quantity,
            carbon,
          });

          totalCarbon += carbon;
        }
      });
    });

    // Rate based on kg CO2e per m² of floor area (simplified)
    const rating = this.calculateCarbonRating(totalCarbon / 1000); // Assume 1000m² building

    return { totalCarbon, breakdown, rating };
  }

  /**
   * Calculate carbon rating
   */
  private static calculateCarbonRating(kgCO2perM2: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' {
    if (kgCO2perM2 < 300) return 'A+';
    if (kgCO2perM2 < 400) return 'A';
    if (kgCO2perM2 < 500) return 'B';
    if (kgCO2perM2 < 600) return 'C';
    if (kgCO2perM2 < 700) return 'D';
    return 'E';
  }

  /**
   * Calculate material volume
   */
  private static calculateMaterialVolume(element: BIMElement): number {
    // Simplified volume calculation
    return 1.0;
  }
}
