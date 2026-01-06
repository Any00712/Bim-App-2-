import { Vector3, Matrix4, Quaternion, Euler } from 'three';

/**
 * Core geometry types for BIM elements
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BIMGeometry {
  vertices: Point3D[];
  faces: number[][];
  normals: Vector3[];
  uvs?: number[][];
}

export enum ElementType {
  WALL = 'WALL',
  FLOOR = 'FLOOR',
  ROOF = 'ROOF',
  DOOR = 'DOOR',
  WINDOW = 'WINDOW',
  COLUMN = 'COLUMN',
  BEAM = 'BEAM',
  STAIR = 'STAIR',
  RAILING = 'RAILING',
  CURTAIN_WALL = 'CURTAIN_WALL',
  FOUNDATION = 'FOUNDATION',
  CEILING = 'CEILING',
  MEP_DUCT = 'MEP_DUCT',
  MEP_PIPE = 'MEP_PIPE',
  MEP_CONDUIT = 'MEP_CONDUIT',
  FURNITURE = 'FURNITURE',
  SITE = 'SITE',
}

export enum UnitType {
  MILLIMETERS = 'mm',
  CENTIMETERS = 'cm',
  METERS = 'm',
  INCHES = 'in',
  FEET = 'ft',
}

export interface Material {
  id: string;
  name: string;
  color: string;
  opacity: number;
  roughness: number;
  metalness: number;
  texture?: string;
  properties?: {
    thermal?: number;
    acoustic?: number;
    structural?: {
      strength: number;
      elasticity: number;
    };
  };
}

export interface Layer {
  id: string;
  name: string;
  material: Material;
  thickness: number;
  function: 'STRUCTURE' | 'INSULATION' | 'FINISH' | 'WATERPROOFING' | 'OTHER';
}

export interface BIMElement {
  id: string;
  type: ElementType;
  name: string;
  level: string;
  geometry: BIMGeometry;
  transform: {
    position: Point3D;
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  parameters: Map<string, any>;
  materials: Material[];
  layers?: Layer[];
  constraints?: Constraint[];
  metadata: {
    created: Date;
    modified: Date;
    author: string;
    phase: string;
  };
}

export interface Constraint {
  type: 'PARALLEL' | 'PERPENDICULAR' | 'ALIGNED' | 'TANGENT' | 'COINCIDENT';
  targetElementId?: string;
  value?: number;
}

export interface Level {
  id: string;
  name: string;
  elevation: number;
  floorToFloorHeight: number;
  computationHeight?: number;
}

export interface View {
  id: string;
  name: string;
  type: 'PLAN' | 'ELEVATION' | 'SECTION' | '3D' | 'DETAIL';
  level?: string;
  camera: {
    position: Point3D;
    target: Point3D;
    up: Vector3;
    fov?: number;
  };
  displaySettings: {
    showGrid: boolean;
    showAnnotations: boolean;
    detailLevel: 'COARSE' | 'MEDIUM' | 'FINE';
    visualStyle: 'WIREFRAME' | 'HIDDEN_LINE' | 'SHADED' | 'REALISTIC' | 'RENDERED';
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  elements: BIMElement[];
  levels: Level[];
  views: View[];
  units: UnitType;
  settings: {
    precision: number;
    snapSettings: {
      gridSnap: boolean;
      objectSnap: boolean;
      angleSnap: boolean;
      snapDistance: number;
    };
  };
  metadata: {
    created: Date;
    modified: Date;
    version: string;
  };
}

export interface ParametricFamily {
  id: string;
  name: string;
  category: ElementType;
  parameters: FamilyParameter[];
  geometry: (params: Map<string, any>) => BIMGeometry;
  constraints: Constraint[];
}

export interface FamilyParameter {
  name: string;
  type: 'LENGTH' | 'ANGLE' | 'NUMBER' | 'BOOLEAN' | 'MATERIAL' | 'TEXT';
  value: any;
  formula?: string;
  isInstance: boolean;
}
