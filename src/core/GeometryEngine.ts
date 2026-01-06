import * as THREE from 'three';
import { BIMGeometry, Point3D } from '../types/bim.types';

/**
 * Advanced 3D Geometry Engine for BIM
 * Handles precision modeling, boolean operations, and complex geometry generation
 */
export class GeometryEngine {
  private static readonly PRECISION = 1e-6;

  /**
   * Create a parametric wall geometry with advanced features
   */
  static createWallGeometry(
    startPoint: Point3D,
    endPoint: Point3D,
    height: number,
    thickness: number,
    baseOffset: number = 0
  ): BIMGeometry {
    const start = new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z);
    const end = new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);
    
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const offset = perpendicular.multiplyScalar(thickness / 2);

    const vertices: Point3D[] = [
      // Bottom face
      { x: start.x - offset.x, y: baseOffset, z: start.z - offset.z },
      { x: start.x + offset.x, y: baseOffset, z: start.z + offset.z },
      { x: end.x + offset.x, y: baseOffset, z: end.z + offset.z },
      { x: end.x - offset.x, y: baseOffset, z: end.z - offset.z },
      // Top face
      { x: start.x - offset.x, y: baseOffset + height, z: start.z - offset.z },
      { x: start.x + offset.x, y: baseOffset + height, z: start.z + offset.z },
      { x: end.x + offset.x, y: baseOffset + height, z: end.z + offset.z },
      { x: end.x - offset.x, y: baseOffset + height, z: end.z - offset.z },
    ];

    const faces: number[][] = [
      [0, 1, 2, 3], // Bottom
      [4, 7, 6, 5], // Top
      [0, 4, 5, 1], // Side 1
      [1, 5, 6, 2], // Side 2
      [2, 6, 7, 3], // Side 3
      [3, 7, 4, 0], // Side 4
    ];

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Create a floor/slab geometry with custom boundary
   */
  static createFloorGeometry(
    boundary: Point3D[],
    thickness: number,
    elevation: number = 0
  ): BIMGeometry {
    const vertices: Point3D[] = [];
    const faces: number[][] = [];

    // Bottom vertices
    boundary.forEach((pt) => {
      vertices.push({ x: pt.x, y: elevation, z: pt.z });
    });

    // Top vertices
    boundary.forEach((pt) => {
      vertices.push({ x: pt.x, y: elevation + thickness, z: pt.z });
    });

    const n = boundary.length;

    // Bottom face
    const bottomFace = Array.from({ length: n }, (_, i) => i);
    faces.push(bottomFace);

    // Top face (reversed for correct normal)
    const topFace = Array.from({ length: n }, (_, i) => n + (n - 1 - i));
    faces.push(topFace);

    // Side faces
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      faces.push([i, next, next + n, i + n]);
    }

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Create a door opening with parametric dimensions
   */
  static createDoorGeometry(
    width: number,
    height: number,
    thickness: number,
    frameWidth: number = 0.05
  ): BIMGeometry {
    const vertices: Point3D[] = [];
    const faces: number[][] = [];

    // Door panel (simplified representation)
    const hw = width / 2;
    const hf = frameWidth / 2;

    // Frame vertices
    const frameVertices = [
      // Outer frame bottom
      { x: -hw - hf, y: 0, z: -thickness / 2 },
      { x: hw + hf, y: 0, z: -thickness / 2 },
      { x: hw + hf, y: height + hf, z: -thickness / 2 },
      { x: -hw - hf, y: height + hf, z: -thickness / 2 },
      // Inner frame bottom
      { x: -hw, y: frameWidth, z: -thickness / 2 + frameWidth },
      { x: hw, y: frameWidth, z: -thickness / 2 + frameWidth },
      { x: hw, y: height, z: -thickness / 2 + frameWidth },
      { x: -hw, y: height, z: -thickness / 2 + frameWidth },
    ];

    vertices.push(...frameVertices);

    // Door panel
    const panelThickness = thickness * 0.4;
    vertices.push(
      { x: -hw + 0.01, y: frameWidth, z: 0 },
      { x: hw - 0.01, y: frameWidth, z: 0 },
      { x: hw - 0.01, y: height - 0.01, z: 0 },
      { x: -hw + 0.01, y: height - 0.01, z: 0 }
    );

    // Create basic faces for the door
    faces.push([0, 1, 2, 3]); // Frame outer
    faces.push([4, 7, 6, 5]); // Frame inner
    faces.push([8, 9, 10, 11]); // Door panel

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Create a window geometry with frame and glass
   */
  static createWindowGeometry(
    width: number,
    height: number,
    sillHeight: number,
    frameDepth: number = 0.1,
    mullionWidth: number = 0.05
  ): BIMGeometry {
    const vertices: Point3D[] = [];
    const faces: number[][] = [];

    const hw = width / 2;
    const hm = mullionWidth / 2;

    // Simplified window frame
    // Outer frame
    vertices.push(
      { x: -hw, y: 0, z: 0 },
      { x: hw, y: 0, z: 0 },
      { x: hw, y: height, z: 0 },
      { x: -hw, y: height, z: 0 }
    );

    // Inner frame (glass area)
    vertices.push(
      { x: -hw + mullionWidth, y: mullionWidth, z: frameDepth / 2 },
      { x: hw - mullionWidth, y: mullionWidth, z: frameDepth / 2 },
      { x: hw - mullionWidth, y: height - mullionWidth, z: frameDepth / 2 },
      { x: -hw + mullionWidth, y: height - mullionWidth, z: frameDepth / 2 }
    );

    faces.push([0, 1, 2, 3]); // Frame face
    faces.push([4, 7, 6, 5]); // Glass area

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Create a column geometry (rectangular or circular)
   */
  static createColumnGeometry(
    basePoint: Point3D,
    height: number,
    width: number,
    depth: number,
    isCircular: boolean = false,
    segments: number = 16
  ): BIMGeometry {
    const vertices: Point3D[] = [];
    const faces: number[][] = [];

    if (isCircular) {
      const radius = width / 2;
      
      // Bottom circle
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push({
          x: basePoint.x + Math.cos(angle) * radius,
          y: basePoint.y,
          z: basePoint.z + Math.sin(angle) * radius,
        });
      }

      // Top circle
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push({
          x: basePoint.x + Math.cos(angle) * radius,
          y: basePoint.y + height,
          z: basePoint.z + Math.sin(angle) * radius,
        });
      }

      // Create faces
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        faces.push([i, next, next + segments, i + segments]);
      }

      // Top and bottom caps
      faces.push(Array.from({ length: segments }, (_, i) => i));
      faces.push(Array.from({ length: segments }, (_, i) => segments + (segments - 1 - i)));
    } else {
      // Rectangular column
      const hw = width / 2;
      const hd = depth / 2;

      vertices.push(
        { x: basePoint.x - hw, y: basePoint.y, z: basePoint.z - hd },
        { x: basePoint.x + hw, y: basePoint.y, z: basePoint.z - hd },
        { x: basePoint.x + hw, y: basePoint.y, z: basePoint.z + hd },
        { x: basePoint.x - hw, y: basePoint.y, z: basePoint.z + hd },
        { x: basePoint.x - hw, y: basePoint.y + height, z: basePoint.z - hd },
        { x: basePoint.x + hw, y: basePoint.y + height, z: basePoint.z - hd },
        { x: basePoint.x + hw, y: basePoint.y + height, z: basePoint.z + hd },
        { x: basePoint.x - hw, y: basePoint.y + height, z: basePoint.z + hd }
      );

      faces.push(
        [0, 1, 2, 3], // Bottom
        [4, 7, 6, 5], // Top
        [0, 4, 5, 1], // Front
        [1, 5, 6, 2], // Right
        [2, 6, 7, 3], // Back
        [3, 7, 4, 0]  // Left
      );
    }

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Create a beam geometry
   */
  static createBeamGeometry(
    startPoint: Point3D,
    endPoint: Point3D,
    width: number,
    height: number,
    profileType: 'RECTANGULAR' | 'I_BEAM' | 'H_BEAM' = 'RECTANGULAR'
  ): BIMGeometry {
    const start = new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z);
    const end = new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    
    // For simplicity, creating a rectangular beam
    const hw = width / 2;
    const hh = height / 2;

    const perpX = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
    const perpY = direction.clone().cross(perpX).normalize();

    const vertices: Point3D[] = [];

    // Start cross-section
    const corners = [
      [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]
    ];

    corners.forEach(([x, y]) => {
      const offset = perpX.clone().multiplyScalar(x).add(perpY.clone().multiplyScalar(y));
      const v = start.clone().add(offset);
      vertices.push({ x: v.x, y: v.y, z: v.z });
    });

    // End cross-section
    corners.forEach(([x, y]) => {
      const offset = perpX.clone().multiplyScalar(x).add(perpY.clone().multiplyScalar(y));
      const v = end.clone().add(offset);
      vertices.push({ x: v.x, y: v.y, z: v.z });
    });

    const faces: number[][] = [
      [0, 1, 2, 3], // Start cap
      [4, 7, 6, 5], // End cap
      [0, 4, 5, 1], // Bottom
      [1, 5, 6, 2], // Right
      [2, 6, 7, 3], // Top
      [3, 7, 4, 0], // Left
    ];

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Create a roof geometry with slope
   */
  static createRoofGeometry(
    boundary: Point3D[],
    baseElevation: number,
    roofType: 'FLAT' | 'GABLE' | 'HIP' | 'SHED',
    slope: number = 0, // In degrees
    thickness: number = 0.3
  ): BIMGeometry {
    const vertices: Point3D[] = [];
    const faces: number[][] = [];

    if (roofType === 'FLAT') {
      // Simple flat roof
      boundary.forEach((pt) => {
        vertices.push({ x: pt.x, y: baseElevation, z: pt.z });
      });
      boundary.forEach((pt) => {
        vertices.push({ x: pt.x, y: baseElevation + thickness, z: pt.z });
      });

      const n = boundary.length;
      faces.push(Array.from({ length: n }, (_, i) => i));
      faces.push(Array.from({ length: n }, (_, i) => n + (n - 1 - i)));

      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        faces.push([i, next, next + n, i + n]);
      }
    } else if (roofType === 'GABLE') {
      // Simplified gable roof
      const center = this.calculateCentroid(boundary);
      const rise = Math.tan((slope * Math.PI) / 180) * 5; // Simplified

      // Base vertices
      boundary.forEach((pt) => {
        vertices.push({ x: pt.x, y: baseElevation, z: pt.z });
      });

      // Ridge vertices
      vertices.push({ x: center.x, y: baseElevation + rise, z: center.z });

      const n = boundary.length;
      for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        faces.push([i, next, n]); // Triangular roof faces
      }
    }

    const normals = this.calculateNormals(vertices, faces);

    return { vertices, faces, normals };
  }

  /**
   * Calculate normals for faces
   */
  private static calculateNormals(vertices: Point3D[], faces: number[][]): THREE.Vector3[] {
    const normals: THREE.Vector3[] = [];

    faces.forEach((face) => {
      if (face.length < 3) return;

      const v1 = new THREE.Vector3(
        vertices[face[0]].x,
        vertices[face[0]].y,
        vertices[face[0]].z
      );
      const v2 = new THREE.Vector3(
        vertices[face[1]].x,
        vertices[face[1]].y,
        vertices[face[1]].z
      );
      const v3 = new THREE.Vector3(
        vertices[face[2]].x,
        vertices[face[2]].y,
        vertices[face[2]].z
      );

      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v1);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      normals.push(normal);
    });

    return normals;
  }

  /**
   * Calculate centroid of a polygon
   */
  private static calculateCentroid(points: Point3D[]): Point3D {
    let x = 0,
      y = 0,
      z = 0;
    points.forEach((pt) => {
      x += pt.x;
      y += pt.y;
      z += pt.z;
    });
    const n = points.length;
    return { x: x / n, y: y / n, z: z / n };
  }

  /**
   * Convert BIMGeometry to THREE.BufferGeometry for rendering
   */
  static toThreeGeometry(bimGeometry: BIMGeometry): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Convert faces to triangulated vertices
    bimGeometry.faces.forEach((face) => {
      if (face.length === 3) {
        indices.push(face[0], face[1], face[2]);
      } else if (face.length === 4) {
        // Triangulate quad
        indices.push(face[0], face[1], face[2]);
        indices.push(face[0], face[2], face[3]);
      } else {
        // Triangulate polygon (fan triangulation)
        for (let i = 1; i < face.length - 1; i++) {
          indices.push(face[0], face[i], face[i + 1]);
        }
      }
    });

    // Flatten vertices
    bimGeometry.vertices.forEach((v) => {
      vertices.push(v.x, v.y, v.z);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }
}
