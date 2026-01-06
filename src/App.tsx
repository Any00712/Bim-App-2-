import React, { useState, useEffect } from 'react';
import { BIMViewport, PropertiesPanel, Toolbar, ProjectBrowser, StatusBar } from './components/BIMComponents';
import { Project, BIMElement, ElementType, UnitType } from './types/bim.types';
import { GeometryEngine } from './core/GeometryEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main BIM Pro Architect Application
 * Ultra-professional BIM software for architecture development
 */
const App: React.FC = () => {
  const [project, setProject] = useState<Project>(createDefaultProject());
  const [selectedElement, setSelectedElement] = useState<BIMElement | null>(null);
  const [activeTool, setActiveTool] = useState<string>('SELECT');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    document.title = 'BIM Pro Architect - Professional Building Information Modeling';
  }, []);

  const handleElementSelect = (element: BIMElement) => {
    setSelectedElement(element);
  };

  const handleToolSelect = (tool: string) => {
    setActiveTool(tool);
    console.log('Tool selected:', tool);

    // Handle tool actions
    if (tool === 'WALL') {
      addSampleWall();
    } else if (tool === 'COLUMN') {
      addSampleColumn();
    } else if (tool === 'FLOOR') {
      addSampleFloor();
    }
  };

  const handleElementUpdate = (updated: BIMElement) => {
    const newElements = project.elements.map((el) =>
      el.id === updated.id ? updated : el
    );
    setProject({ ...project, elements: newElements });
    setSelectedElement(updated);
  };

  const addSampleWall = () => {
    const wallGeometry = GeometryEngine.createWallGeometry(
      { x: 0, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
      3.0,
      0.2
    );

    const wall: BIMElement = {
      id: uuidv4(),
      type: ElementType.WALL,
      name: `Wall ${project.elements.length + 1}`,
      level: 'Level 1',
      geometry: wallGeometry,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      parameters: new Map(),
      materials: [
        {
          id: uuidv4(),
          name: 'Concrete',
          color: '#808080',
          opacity: 1,
          roughness: 0.8,
          metalness: 0,
        },
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        author: 'User',
        phase: 'New Construction',
      },
    };

    setProject({
      ...project,
      elements: [...project.elements, wall],
    });
  };

  const addSampleColumn = () => {
    const columnGeometry = GeometryEngine.createColumnGeometry(
      { x: 0, y: 0, z: 0 },
      3.0,
      0.3,
      0.3,
      false
    );

    const column: BIMElement = {
      id: uuidv4(),
      type: ElementType.COLUMN,
      name: `Column ${project.elements.length + 1}`,
      level: 'Level 1',
      geometry: columnGeometry,
      transform: {
        position: { x: 2, y: 0, z: 2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      parameters: new Map(),
      materials: [
        {
          id: uuidv4(),
          name: 'Steel',
          color: '#4a4a4a',
          opacity: 1,
          roughness: 0.5,
          metalness: 0.8,
        },
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        author: 'User',
        phase: 'New Construction',
      },
    };

    setProject({
      ...project,
      elements: [...project.elements, column],
    });
  };

  const addSampleFloor = () => {
    const floorBoundary = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 10, y: 0, z: 10 },
      { x: 0, y: 0, z: 10 },
    ];

    const floorGeometry = GeometryEngine.createFloorGeometry(floorBoundary, 0.25, 0);

    const floor: BIMElement = {
      id: uuidv4(),
      type: ElementType.FLOOR,
      name: `Floor ${project.elements.length + 1}`,
      level: 'Level 1',
      geometry: floorGeometry,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      parameters: new Map(),
      materials: [
        {
          id: uuidv4(),
          name: 'Concrete Slab',
          color: '#a0a0a0',
          opacity: 1,
          roughness: 0.7,
          metalness: 0,
        },
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        author: 'User',
        phase: 'New Construction',
      },
    };

    setProject({
      ...project,
      elements: [...project.elements, floor],
    });
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: darkMode ? '#1e1e1e' : '#ffffff',
        color: darkMode ? '#ffffff' : '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Top Menu Bar */}
      <div
        style={{
          background: '#0d47a1',
          color: 'white',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
          🏗️ BIM Pro Architect
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '5px 15px',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            File
          </button>
          <button
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '5px 15px',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            Edit
          </button>
          <button
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '5px 15px',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            View
          </button>
          <button
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '5px 15px',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            Analysis
          </button>
          <button
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '5px 15px',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar onToolSelect={handleToolSelect} />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Project Browser */}
        <div style={{ width: '250px', borderRight: '1px solid #444' }}>
          <ProjectBrowser project={project} onElementSelect={handleElementSelect} />
        </div>

        {/* Center - 3D Viewport */}
        <div style={{ flex: 1 }}>
          <BIMViewport project={project} onElementSelect={handleElementSelect} />
        </div>

        {/* Right Sidebar - Properties */}
        <div style={{ width: '300px', borderLeft: '1px solid #444' }}>
          <PropertiesPanel element={selectedElement} onUpdate={handleElementUpdate} />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar project={project} />
    </div>
  );
};

/**
 * Create default project with sample data
 */
function createDefaultProject(): Project {
  return {
    id: uuidv4(),
    name: 'New BIM Project',
    description: 'Professional Architecture Project',
    address: '',
    elements: [],
    levels: [
      {
        id: uuidv4(),
        name: 'Level 1',
        elevation: 0,
        floorToFloorHeight: 3.0,
      },
      {
        id: uuidv4(),
        name: 'Level 2',
        elevation: 3.0,
        floorToFloorHeight: 3.0,
      },
    ],
    views: [],
    units: UnitType.METERS,
    settings: {
      precision: 3,
      snapSettings: {
        gridSnap: true,
        objectSnap: true,
        angleSnap: true,
        snapDistance: 0.1,
      },
    },
    metadata: {
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    },
  };
}

export default App;
