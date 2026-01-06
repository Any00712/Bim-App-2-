# 🧪 Testing and Running BIM Pro Architect

## Quick Start Guide

### Prerequisites

Before you can test the software, ensure you have the following installed:

1. **Node.js 18 or higher** - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **A modern web browser** with WebGL 2.0 support (Chrome, Firefox, Edge, Safari)

### Installation Steps

1. **Clone the repository** (if you haven't already):
```bash
git clone https://github.com/Any00712/Bim-App-2-.git
cd Bim-App-2-
```

2. **Install dependencies**:
```bash
npm install
```

This will install all required packages including React, Three.js, TypeScript, and other dependencies.

### Running the Application

#### Development Mode (Recommended for Testing)

Run the application in development mode with hot-reloading:

```bash
npm run dev
```

This command starts both the frontend and backend servers concurrently:
- **Frontend (Client)**: http://localhost:3000
- **Backend API**: http://localhost:5000

Open your browser and navigate to **http://localhost:3000** to see the application.

#### Individual Server Commands

If you prefer to run servers separately:

**Frontend only:**
```bash
npm run dev:client
```

**Backend only:**
```bash
npm run dev:server
```

### Testing the Features

Once the application is running, you can test the following features:

#### 1. **Basic 3D Modeling**

- Click the **"Wall"** button in the toolbar to add a sample wall
- Click the **"Column"** button to add a structural column
- Click the **"Floor"** button to add a floor slab

#### 2. **3D Viewport Controls**

- **Rotate view**: Left-click and drag
- **Pan view**: Right-click and drag (or Middle-click)
- **Zoom**: Mouse wheel or pinch gesture
- **Visual modes**: Click the buttons in the top-right corner:
  - Wireframe
  - Shaded
  - Realistic

#### 3. **Element Selection**

- Click any element in the 3D viewport to select it
- The **Properties Panel** on the right will show element details
- The selected element will be highlighted in green

#### 4. **Properties Editing**

- Select an element
- In the Properties Panel (right sidebar), you can:
  - View element ID, type, and level
  - See position coordinates (X, Y, Z)
  - View material layers (if applicable)
  - Edit the element name (type in the name field)

#### 5. **Project Browser**

- The left sidebar shows all elements organized by type
- Click the arrow (▶/▼) to expand/collapse categories
- Click any element name to select it in the 3D viewport

#### 6. **Dark/Light Mode**

- Click the sun/moon icon (☀️/🌙) in the top menu bar to toggle themes

### Testing Advanced Features (API)

The backend provides REST API endpoints for advanced features. You can test them using tools like curl, Postman, or your browser's developer console.

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### List Projects
```bash
curl http://localhost:5000/api/projects
```

### Building for Production

To create a production build:

```bash
npm run build
```

This will:
1. Compile TypeScript to JavaScript
2. Build the client with optimizations
3. Output to the `dist/` folder

To run the production build:

```bash
npm start
```

### Code Quality Tools

#### Linting
Check code quality:
```bash
npm run lint
```

#### Formatting
Format code with Prettier:
```bash
npm run format
```

## Testing Specific BIM Features

### Example 1: Testing Parametric Walls

Open the browser console (F12) and try:

```javascript
// Access the geometry engine
import { GeometryEngine } from './src/core/GeometryEngine';

// Create a wall programmatically
const wall = GeometryEngine.createWallGeometry(
  { x: 0, y: 0, z: 0 },
  { x: 5, y: 0, z: 0 },
  3.0,  // height
  0.2   // thickness
);
```

### Example 2: Testing Stair Generation

```javascript
import { StairSolver } from './src/core/StructuralEngine';

const stair = StairSolver.generateStair(
  { id: '1', name: 'Level 1', elevation: 0, floorToFloorHeight: 3.0 },
  { id: '2', name: 'Level 2', elevation: 3.0, floorToFloorHeight: 3.0 },
  'IBC',
  'STRAIGHT'
);

console.log(stair.compliance); // View compliance messages
```

### Example 3: Testing Clash Detection

```javascript
import { ClashDetectionEngine } from './src/core/AnalysisEngine';

const clashes = ClashDetectionEngine.detectClashes(
  architecturalElements,
  structuralElements,
  mepElements,
  0.01
);

console.log(clashes.summary);
```

## Troubleshooting

### Common Issues

**Issue: "Port 3000 already in use"**
- Solution: Either stop the process using port 3000, or change the port in `vite.config.ts`

**Issue: "Module not found" errors**
- Solution: Run `npm install` again to ensure all dependencies are installed

**Issue: "Cannot find module 'three'"**
- Solution: Clear node_modules and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

**Issue: TypeScript errors**
- Solution: Ensure TypeScript is installed:
  ```bash
  npm install -g typescript
  ```

**Issue: Blank screen in browser**
- Solution: Check the browser console (F12) for errors
- Ensure WebGL is enabled in your browser

## Browser Requirements

- **Chrome/Edge**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14.1+

Ensure hardware acceleration is enabled in your browser settings.

## Performance Notes

- The 3D viewport uses WebGL and may be resource-intensive
- For best performance, use a dedicated GPU
- Minimum 8GB RAM recommended, 16GB ideal for large projects
- Large models may take a few seconds to load initially

## Getting Help

If you encounter any issues:

1. Check the browser console (F12) for error messages
2. Review the README.md for detailed feature documentation
3. Check FEATURES.md for implementation details
4. Open an issue on GitHub with:
   - Browser and version
   - Node.js version (`node --version`)
   - Steps to reproduce the issue
   - Console error messages (if any)

## Next Steps

After testing the basic features:

1. **Explore the Project Browser**: See how elements are organized by type
2. **Try different visual modes**: Wireframe, Shaded, Realistic
3. **Test element properties**: Select elements and view their properties
4. **Add multiple elements**: Create a simple building layout
5. **Experiment with the camera**: Practice navigating the 3D space

For advanced features like analysis engines, MEP systems, and collaboration tools, refer to the comprehensive documentation in README.md and FEATURES.md.

---

**Enjoy building with BIM Pro Architect!** 🏗️✨
