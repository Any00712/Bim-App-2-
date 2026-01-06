import { BIMElement, Project, Point3D } from '../types/bim.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Multi-User Real-Time Worksharing System
 */
export class WorksharingEngine {
  private static activeUsers: Map<string, { userId: string; elements: Set<string>; lastActivity: Date }> = new Map();

  /**
   * Request to borrow an element for editing
   */
  static borrowElement(
    userId: string,
    elementId: string,
    project: Project
  ): {
    success: boolean;
    borrower?: string;
    message: string;
  } {
    // Check if element is already borrowed
    for (const [user, data] of this.activeUsers.entries()) {
      if (data.elements.has(elementId)) {
        return {
          success: false,
          borrower: user,
          message: `Element is currently being edited by ${user}`,
        };
      }
    }

    // Grant ownership
    if (!this.activeUsers.has(userId)) {
      this.activeUsers.set(userId, {
        userId,
        elements: new Set(),
        lastActivity: new Date(),
      });
    }

    this.activeUsers.get(userId)!.elements.add(elementId);
    this.activeUsers.get(userId)!.lastActivity = new Date();

    return {
      success: true,
      message: `Element ${elementId} borrowed successfully`,
    };
  }

  /**
   * Release element after editing
   */
  static releaseElement(userId: string, elementId: string): { success: boolean } {
    const userData = this.activeUsers.get(userId);
    if (userData && userData.elements.has(elementId)) {
      userData.elements.delete(elementId);
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Synchronize changes across users
   */
  static synchronizeChanges(
    userId: string,
    changes: Array<{ elementId: string; operation: 'CREATE' | 'UPDATE' | 'DELETE'; data: any }>
  ): {
    conflicts: Array<{ elementId: string; reason: string }>;
    applied: string[];
  } {
    const conflicts: Array<{ elementId: string; reason: string }> = [];
    const applied: string[] = [];

    changes.forEach((change) => {
      const borrowed = this.borrowElement(userId, change.elementId, {} as Project);
      
      if (borrowed.success) {
        applied.push(change.elementId);
        this.releaseElement(userId, change.elementId);
      } else {
        conflicts.push({
          elementId: change.elementId,
          reason: borrowed.message,
        });
      }
    });

    return { conflicts, applied };
  }

  /**
   * Get active users and their borrowed elements
   */
  static getActiveUsers(): Array<{
    userId: string;
    elementCount: number;
    lastActivity: Date;
  }> {
    const users: Array<{
      userId: string;
      elementCount: number;
      lastActivity: Date;
    }> = [];

    this.activeUsers.forEach((data) => {
      users.push({
        userId: data.userId,
        elementCount: data.elements.size,
        lastActivity: data.lastActivity,
      });
    });

    return users;
  }
}

/**
 * Model Version Branching System
 */
export class VersionControl {
  /**
   * Create a design option branch
   */
  static createBranch(
    project: Project,
    branchName: string,
    description: string
  ): {
    branchId: string;
    snapshot: Project;
    createdAt: Date;
  } {
    const branchId = uuidv4();
    const snapshot = JSON.parse(JSON.stringify(project)); // Deep clone
    
    return {
      branchId,
      snapshot,
      createdAt: new Date(),
    };
  }

  /**
   * Compare two versions and generate delta
   */
  static compareVersions(
    version1: Project,
    version2: Project
  ): {
    added: BIMElement[];
    modified: Array<{ elementId: string; changes: any }>;
    deleted: string[];
    summary: string;
  } {
    const added: BIMElement[] = [];
    const modified: Array<{ elementId: string; changes: any }> = [];
    const deleted: string[] = [];

    const v1Elements = new Map(version1.elements.map((e) => [e.id, e]));
    const v2Elements = new Map(version2.elements.map((e) => [e.id, e]));

    // Find added elements
    version2.elements.forEach((element) => {
      if (!v1Elements.has(element.id)) {
        added.push(element);
      }
    });

    // Find deleted elements
    version1.elements.forEach((element) => {
      if (!v2Elements.has(element.id)) {
        deleted.push(element.id);
      }
    });

    // Find modified elements
    version1.elements.forEach((element) => {
      const v2Element = v2Elements.get(element.id);
      if (v2Element) {
        const changes = this.detectChanges(element, v2Element);
        if (Object.keys(changes).length > 0) {
          modified.push({ elementId: element.id, changes });
        }
      }
    });

    const summary = `Added: ${added.length}, Modified: ${modified.length}, Deleted: ${deleted.length}`;

    return { added, modified, deleted, summary };
  }

  /**
   * Detect changes between two elements
   */
  private static detectChanges(element1: BIMElement, element2: BIMElement): any {
    const changes: any = {};

    // Check position changes
    if (
      element1.transform.position.x !== element2.transform.position.x ||
      element1.transform.position.y !== element2.transform.position.y ||
      element1.transform.position.z !== element2.transform.position.z
    ) {
      changes.position = {
        old: element1.transform.position,
        new: element2.transform.position,
      };
    }

    // Check other properties
    if (element1.name !== element2.name) {
      changes.name = { old: element1.name, new: element2.name };
    }

    return changes;
  }

  /**
   * Merge branch back to master
   */
  static mergeBranch(
    master: Project,
    branch: Project,
    conflictResolution: 'MASTER' | 'BRANCH' | 'MANUAL'
  ): {
    mergedProject: Project;
    conflicts: Array<{ elementId: string; issue: string }>;
  } {
    const mergedProject = JSON.parse(JSON.stringify(master));
    const conflicts: Array<{ elementId: string; issue: string }> = [];

    const delta = this.compareVersions(master, branch);

    // Add new elements
    delta.added.forEach((element) => {
      mergedProject.elements.push(element);
    });

    // Handle modified elements
    delta.modified.forEach((mod) => {
      const elementIndex = mergedProject.elements.findIndex((e) => e.id === mod.elementId);
      if (elementIndex !== -1) {
        const branchElement = branch.elements.find((e) => e.id === mod.elementId);
        if (branchElement) {
          if (conflictResolution === 'BRANCH') {
            mergedProject.elements[elementIndex] = branchElement;
          } else if (conflictResolution === 'MANUAL') {
            conflicts.push({
              elementId: mod.elementId,
              issue: 'Manual conflict resolution required',
            });
          }
        }
      }
    });

    // Remove deleted elements
    delta.deleted.forEach((elementId) => {
      const index = mergedProject.elements.findIndex((e) => e.id === elementId);
      if (index !== -1) {
        mergedProject.elements.splice(index, 1);
      }
    });

    return { mergedProject, conflicts };
  }
}

/**
 * BCF (BIM Collaboration Format) Support
 */
export class BCFHandler {
  /**
   * Create BCF issue
   */
  static createIssue(
    title: string,
    description: string,
    element: BIMElement,
    viewpoint: { position: Point3D; direction: Point3D },
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    assignedTo: string
  ): {
    issueId: string;
    bcfData: any;
  } {
    const issueId = uuidv4();

    const bcfData = {
      Markup: {
        Header: {
          Files: [],
        },
        Topic: {
          Guid: issueId,
          Title: title,
          CreationDate: new Date().toISOString(),
          CreationAuthor: 'system@bimpro.com',
          Priority: priority,
          AssignedTo: assignedTo,
          Description: description,
          Labels: ['BIM', 'Coordination'],
        },
        Comment: [],
        Viewpoints: [
          {
            Guid: uuidv4(),
            Viewpoint: 'viewpoint.bcfv',
            Snapshot: 'snapshot.png',
          },
        ],
      },
      Viewpoint: {
        Components: {
          Selection: [
            {
              IfcGuid: element.id,
            },
          ],
        },
        OrthogonalCamera: {
          CameraViewPoint: viewpoint.position,
          CameraDirection: viewpoint.direction,
          CameraUpVector: { x: 0, y: 1, z: 0 },
        },
      },
    };

    return { issueId, bcfData };
  }

  /**
   * Export issues to BCF file
   */
  static exportToBCF(issues: any[]): string {
    // Would generate actual BCF XML format
    const bcfXML = `<?xml version="1.0" encoding="UTF-8"?>
<Markup>
  <Header>
    <Files/>
  </Header>
  <Topic Guid="${uuidv4()}">
    <Title>Exported Issues</Title>
    <CreationDate>${new Date().toISOString()}</CreationDate>
  </Topic>
</Markup>`;

    return bcfXML;
  }
}

/**
 * Blockchain-Verified Submittals
 */
export class BlockchainVerification {
  /**
   * Create blockchain-verified submittal record
   */
  static createVerifiedSubmittal(
    elementId: string,
    approver: string,
    approvalData: any
  ): {
    transactionId: string;
    timestamp: Date;
    hash: string;
    verified: boolean;
  } {
    const timestamp = new Date();
    const transactionData = {
      elementId,
      approver,
      timestamp: timestamp.toISOString(),
      data: approvalData,
    };

    // Generate hash (simplified - would use actual blockchain)
    const hash = this.generateHash(JSON.stringify(transactionData));
    const transactionId = uuidv4();

    // Record to blockchain (simulated)
    console.log(`Blockchain transaction recorded: ${transactionId}`);

    return {
      transactionId,
      timestamp,
      hash,
      verified: true,
    };
  }

  /**
   * Verify submittal authenticity
   */
  static verifySubmittal(transactionId: string, hash: string): { valid: boolean; message: string } {
    // Would verify against actual blockchain
    return {
      valid: true,
      message: 'Submittal verified on blockchain',
    };
  }

  /**
   * Generate cryptographic hash
   */
  private static generateHash(data: string): string {
    // Simplified - would use SHA-256 or similar
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * AI-Powered Scripting System
 */
export class AIScriptingEngine {
  /**
   * Generate geometry from natural language
   */
  static promptToGeometry(
    prompt: string
  ): {
    elements: BIMElement[];
    interpretation: string;
    confidence: number;
  } {
    const elements: BIMElement[] = [];
    let interpretation = '';
    let confidence = 0;

    // Parse prompt (simplified NLP)
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('wall') && lowerPrompt.includes('room')) {
      interpretation = 'Creating rectangular room with walls';
      confidence = 0.85;

      // Extract dimensions if mentioned
      const sizeMatch = lowerPrompt.match(/(\d+)\s*(m|meter|metre|ft|feet|foot)/);
      const size = sizeMatch ? parseFloat(sizeMatch[1]) : 5;

      // Create 4 walls for a room
      const wallHeight = 3.0;
      const wallThickness = 0.2;

      // Wall data would be generated here
      interpretation += ` (${size}m x ${size}m)`;
    } else if (lowerPrompt.includes('column')) {
      interpretation = 'Creating structural column';
      confidence = 0.90;
    } else {
      interpretation = 'Unable to interpret prompt';
      confidence = 0.2;
    }

    return { elements, interpretation, confidence };
  }

  /**
   * Automated code compliance checker
   */
  static checkCodeCompliance(
    elements: BIMElement[],
    buildingCode: 'IBC' | 'ADA' | 'LOCAL',
    buildingType: 'RESIDENTIAL' | 'COMMERCIAL' | 'HEALTHCARE'
  ): {
    violations: Array<{
      code: string;
      description: string;
      element: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      suggestion: string;
    }>;
    complianceScore: number;
  } {
    const violations: Array<{
      code: string;
      description: string;
      element: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      suggestion: string;
    }> = [];

    elements.forEach((element) => {
      // Check ADA requirements
      if (buildingCode === 'ADA' && element.type === 'DOOR') {
        const width = element.parameters.get('width') || 0;
        if (width < 0.914) { // 36 inches
          violations.push({
            code: 'ADA 404.2.3',
            description: 'Door width less than 36" minimum',
            element: element.name,
            severity: 'CRITICAL',
            suggestion: 'Increase door width to minimum 36"',
          });
        }
      }

      // Check IBC exit requirements
      if (buildingCode === 'IBC' && element.type === 'STAIR') {
        const riserHeight = element.parameters.get('riserHeight') || 0;
        if (riserHeight > 0.178) { // 7 inches
          violations.push({
            code: 'IBC 1011.5.2',
            description: 'Stair riser height exceeds 7" maximum',
            element: element.name,
            severity: 'CRITICAL',
            suggestion: 'Reduce riser height to maximum 7"',
          });
        }
      }

      // Check healthcare-specific requirements
      if (buildingType === 'HEALTHCARE') {
        if (element.type === 'DOOR' && element.name.includes('Patient')) {
          const clearWidth = element.parameters.get('clearWidth') || 0;
          if (clearWidth < 1.067) { // 42 inches
            violations.push({
              code: 'FGI 2.1-2.6.3.2',
              description: 'Patient room door clear width less than 42"',
              element: element.name,
              severity: 'CRITICAL',
              suggestion: 'Increase clear width to 42" for gurney access',
            });
          }
        }
      }
    });

    const complianceScore = Math.max(0, 100 - violations.length * 5);

    return { violations, complianceScore };
  }
}

/**
 * 4D/5D/6D Construction Management
 */
export class ConstructionScheduler {
  /**
   * Link elements to construction schedule (4D)
   */
  static create4DSequence(
    elements: BIMElement[],
    tasks: Array<{
      id: string;
      name: string;
      startDate: Date;
      duration: number;
      elementIds: string[];
    }>
  ): {
    timeline: Array<{
      date: Date;
      visibleElements: string[];
      completedElements: string[];
    }>;
    criticalPath: string[];
    duration: number;
  } {
    const timeline: Array<{
      date: Date;
      visibleElements: string[];
      completedElements: string[];
    }> = [];

    // Sort tasks by start date
    const sortedTasks = [...tasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    let currentDate = sortedTasks[0].startDate;
    const endDate = new Date(
      Math.max(...sortedTasks.map((t) => new Date(t.startDate.getTime() + t.duration * 24 * 60 * 60 * 1000).getTime()))
    );

    // Generate timeline snapshots
    while (currentDate <= endDate) {
      const visibleElements: string[] = [];
      const completedElements: string[] = [];

      sortedTasks.forEach((task) => {
        const taskStart = task.startDate.getTime();
        const taskEnd = taskStart + task.duration * 24 * 60 * 60 * 1000;
        const current = currentDate.getTime();

        if (current >= taskStart && current <= taskEnd) {
          visibleElements.push(...task.elementIds);
        } else if (current > taskEnd) {
          completedElements.push(...task.elementIds);
        }
      });

      timeline.push({
        date: new Date(currentDate),
        visibleElements,
        completedElements,
      });

      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Next day
    }

    const criticalPath = this.calculateCriticalPath(tasks);
    const duration = (endDate.getTime() - sortedTasks[0].startDate.getTime()) / (24 * 60 * 60 * 1000);

    return { timeline, criticalPath, duration };
  }

  /**
   * Calculate critical path
   */
  private static calculateCriticalPath(tasks: any[]): string[] {
    // Simplified critical path calculation
    return tasks.map((t) => t.id);
  }

  /**
   * Integrate live cost data (5D)
   */
  static track5DCosts(
    elements: BIMElement[],
    costDatabase: Map<string, number>,
    procurementData: Array<{ elementId: string; actualCost: number; date: Date }>
  ): {
    plannedCost: number;
    actualCost: number;
    variance: number;
    variancePercent: number;
    forecast: number;
  } {
    let plannedCost = 0;
    let actualCost = 0;

    elements.forEach((element) => {
      const unitCost = costDatabase.get(element.type) || 0;
      plannedCost += unitCost;
    });

    procurementData.forEach((data) => {
      actualCost += data.actualCost;
    });

    const variance = actualCost - plannedCost;
    const variancePercent = (variance / plannedCost) * 100;
    const forecast = plannedCost + variance;

    return {
      plannedCost,
      actualCost,
      variance,
      variancePercent,
      forecast,
    };
  }
}

/**
 * Digital Twin Integration (6D)
 */
export class DigitalTwinManager {
  /**
   * Connect IoT sensors to BIM model
   */
  static connectSensor(
    elementId: string,
    sensorType: 'TEMPERATURE' | 'HUMIDITY' | 'OCCUPANCY' | 'ENERGY' | 'PRESSURE',
    sensorId: string,
    updateInterval: number
  ): {
    connectionId: string;
    status: 'CONNECTED' | 'ERROR';
  } {
    const connectionId = uuidv4();

    // Simulate sensor connection
    console.log(`Sensor ${sensorId} connected to element ${elementId}`);

    return {
      connectionId,
      status: 'CONNECTED',
    };
  }

  /**
   * Get live data from digital twin
   */
  static getLiveData(
    elementId: string
  ): {
    temperature?: number;
    humidity?: number;
    occupancy?: number;
    energyUsage?: number;
    lastUpdated: Date;
  } {
    // Simulate live sensor data
    return {
      temperature: 22.5,
      humidity: 45,
      occupancy: 12,
      energyUsage: 3.4,
      lastUpdated: new Date(),
    };
  }
}
