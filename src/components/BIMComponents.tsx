import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { BIMElement, Project, View } from '../types/bim.types';
import { GeometryEngine } from '../core/GeometryEngine';

/**
 * Main 3D Viewport Component
 * Professional-grade viewer with real-time rendering
 */
export const BIMViewport: React.FC<{
  project: Project;
  activeView?: View;
  onElementSelect?: (element: BIMElement) => void;
}> = ({ project, activeView, onElementSelect }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [visualStyle, setVisualStyle] = useState<'WIREFRAME' | 'SHADED' | 'REALISTIC'>('REALISTIC');

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Viewport Controls */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
        }}
      >
        <button onClick={() => setVisualStyle('WIREFRAME')}>Wireframe</button>
        <button onClick={() => setVisualStyle('SHADED')}>Shaded</button>
        <button onClick={() => setVisualStyle('REALISTIC')}>Realistic</button>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={60} />
        
        {/* Lighting Setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight intensity={0.3} groundColor="#444444" />

        {/* Grid and Reference */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={100}
          fadeStrength={1}
        />

        {/* Render BIM Elements */}
        {project.elements.map((element) => (
          <BIMElementMesh
            key={element.id}
            element={element}
            visualStyle={visualStyle}
            isSelected={selectedElement === element.id}
            onSelect={() => {
              setSelectedElement(element.id);
              onElementSelect?.(element);
            }}
          />
        ))}

        {/* Camera Controls */}
        <OrbitControls makeDefault />

        {/* Viewport Gizmo */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

/**
 * Individual BIM Element Mesh Component
 */
const BIMElementMesh: React.FC<{
  element: BIMElement;
  visualStyle: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ element, visualStyle, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Convert BIM geometry to Three.js geometry
  const geometry = GeometryEngine.toThreeGeometry(element.geometry);

  // Material based on visual style
  const getMaterial = () => {
    const baseColor = element.materials[0]?.color || '#cccccc';
    
    switch (visualStyle) {
      case 'WIREFRAME':
        return <meshBasicMaterial color={baseColor} wireframe />;
      case 'SHADED':
        return <meshLambertMaterial color={baseColor} />;
      case 'REALISTIC':
      default:
        return (
          <meshStandardMaterial
            color={baseColor}
            roughness={element.materials[0]?.roughness || 0.5}
            metalness={element.materials[0]?.metalness || 0}
          />
        );
    }
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[
        element.transform.position.x,
        element.transform.position.y,
        element.transform.position.z,
      ]}
      rotation={[
        element.transform.rotation.x,
        element.transform.rotation.y,
        element.transform.rotation.z,
      ]}
      scale={[
        element.transform.scale.x,
        element.transform.scale.y,
        element.transform.scale.z,
      ]}
      onClick={onSelect}
      onPointerOver={() => {
        if (meshRef.current) {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {getMaterial()}
      {isSelected && (
        <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.5} />
      )}
    </mesh>
  );
};

/**
 * Properties Panel Component
 */
export const PropertiesPanel: React.FC<{
  element: BIMElement | null;
  onUpdate: (element: BIMElement) => void;
}> = ({ element, onUpdate }) => {
  if (!element) {
    return (
      <div style={{ padding: '20px' }}>
        <p>No element selected</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        background: '#2a2a2a',
        color: 'white',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <h3>Properties</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>ID:</strong> {element.id}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          <strong>Name:</strong>
          <input
            type="text"
            value={element.name}
            onChange={(e) => {
              const updated = { ...element, name: e.target.value };
              onUpdate(updated);
            }}
            style={{ width: '100%', marginTop: '5px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Type:</strong> {element.type}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Level:</strong> {element.level}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Position:</strong>
        <div>X: {element.transform.position.x.toFixed(3)}m</div>
        <div>Y: {element.transform.position.y.toFixed(3)}m</div>
        <div>Z: {element.transform.position.z.toFixed(3)}m</div>
      </div>

      {element.layers && element.layers.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Layers:</strong>
          {element.layers.map((layer, index) => (
            <div key={index} style={{ marginLeft: '10px', marginTop: '5px' }}>
              {layer.name}: {layer.thickness}m - {layer.material.name}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <strong>Created:</strong> {element.metadata.created.toLocaleString()}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Modified:</strong> {element.metadata.modified.toLocaleString()}
      </div>
    </div>
  );
};

/**
 * Toolbar Component
 */
export const Toolbar: React.FC<{
  onToolSelect: (tool: string) => void;
}> = ({ onToolSelect }) => {
  const tools = [
    { id: 'SELECT', icon: '🖱️', label: 'Select' },
    { id: 'WALL', icon: '🧱', label: 'Wall' },
    { id: 'DOOR', icon: '🚪', label: 'Door' },
    { id: 'WINDOW', icon: '🪟', label: 'Window' },
    { id: 'COLUMN', icon: '🏛️', label: 'Column' },
    { id: 'BEAM', icon: '🏗️', label: 'Beam' },
    { id: 'FLOOR', icon: '⬜', label: 'Floor' },
    { id: 'ROOF', icon: '🏠', label: 'Roof' },
    { id: 'STAIR', icon: '🪜', label: 'Stair' },
    { id: 'MEASURE', icon: '📏', label: 'Measure' },
    { id: 'SECTION', icon: '✂️', label: 'Section' },
    { id: 'RENDER', icon: '🎨', label: 'Render' },
  ];

  return (
    <div
      style={{
        background: '#1a1a1a',
        padding: '10px',
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap',
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool.id)}
          style={{
            padding: '8px 12px',
            background: '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title={tool.label}
        >
          <span>{tool.icon}</span>
          <span style={{ fontSize: '12px' }}>{tool.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Project Browser Component
 */
export const ProjectBrowser: React.FC<{
  project: Project;
  onElementSelect: (element: BIMElement) => void;
}> = ({ project, onElementSelect }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['WALL']));

  // Group elements by type
  const elementsByType = project.elements.reduce((acc, element) => {
    if (!acc[element.type]) {
      acc[element.type] = [];
    }
    acc[element.type].push(element);
    return acc;
  }, {} as Record<string, BIMElement[]>);

  const toggleCategory = (type: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div
      style={{
        background: '#2a2a2a',
        color: 'white',
        height: '100%',
        overflowY: 'auto',
        padding: '10px',
      }}
    >
      <h3>Project Browser</h3>
      
      {Object.entries(elementsByType).map(([type, elements]) => (
        <div key={type} style={{ marginBottom: '10px' }}>
          <div
            onClick={() => toggleCategory(type)}
            style={{
              cursor: 'pointer',
              padding: '5px',
              background: '#3a3a3a',
              marginBottom: '5px',
              borderRadius: '3px',
            }}
          >
            <span>{expandedCategories.has(type) ? '▼' : '▶'}</span> {type} ({elements.length})
          </div>
          
          {expandedCategories.has(type) && (
            <div style={{ marginLeft: '20px' }}>
              {elements.map((element) => (
                <div
                  key={element.id}
                  onClick={() => onElementSelect(element)}
                  style={{
                    padding: '5px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4a4a4a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {element.name}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Status Bar Component
 */
export const StatusBar: React.FC<{
  project: Project;
  cursorPosition?: { x: number; y: number; z: number };
}> = ({ project, cursorPosition }) => {
  return (
    <div
      style={{
        background: '#1a1a1a',
        color: 'white',
        padding: '5px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
      }}
    >
      <div>
        <strong>Project:</strong> {project.name} | <strong>Elements:</strong> {project.elements.length}
      </div>
      
      {cursorPosition && (
        <div>
          <strong>Cursor:</strong> X: {cursorPosition.x.toFixed(3)} Y: {cursorPosition.y.toFixed(3)} Z:{' '}
          {cursorPosition.z.toFixed(3)}
        </div>
      )}
      
      <div>
        <strong>Units:</strong> {project.units}
      </div>
    </div>
  );
};
