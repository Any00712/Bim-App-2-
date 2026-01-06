import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Project API endpoints
app.get('/api/projects', (req, res) => {
  res.json({
    projects: [],
    message: 'Project API - List all projects',
  });
});

app.post('/api/projects', (req, res) => {
  res.json({
    message: 'Project created',
    projectId: 'new-project-id',
  });
});

// BIM Analysis endpoints
app.post('/api/analysis/clash-detection', (req, res) => {
  res.json({
    clashes: [],
    summary: { total: 0, critical: 0 },
  });
});

app.post('/api/analysis/energy', (req, res) => {
  res.json({
    energyUsage: 0,
    recommendations: [],
  });
});

// IFC Import/Export
app.post('/api/ifc/import', (req, res) => {
  res.json({
    message: 'IFC file imported',
    elementsCount: 0,
  });
});

app.get('/api/ifc/export/:projectId', (req, res) => {
  res.json({
    message: 'IFC export generated',
    downloadUrl: '/downloads/project.ifc',
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🏗️  BIM Pro Architect Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});

export default app;
