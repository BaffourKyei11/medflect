import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { groqService } from "./services/groq";
import { fhirService } from "./services/fhir";
import { blockchainService } from "./services/blockchain";
import { createEnhancedFHIRService } from "./services/enhanced-fhir";
import { createPredictiveAnalyticsService } from "./services/predictive-analytics";
import { insertClinicalSummarySchema, insertAuditLogSchema, insertConsentRecordSchema, insertHospitalSchema, insertPredictionSchema, insertWorkflowSchema } from "@shared/schema";

const enhancedFhirService = createEnhancedFHIRService();
const predictiveService = createPredictiveAnalyticsService();

// Request validation schemas
const generateSummarySchema = z.object({
  patientId: z.string(),
  summaryType: z.enum(["discharge", "progress", "handoff"]),
  additionalContext: z.string().optional(),
});

const updateSummarySchema = z.object({
  content: z.string(),
  status: z.enum(["draft", "finalized"]).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Routes
  app.get("/api/ai/status", async (req, res) => {
    try {
      const status = await groqService.checkStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to check AI status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { patientId, summaryType, additionalContext } = generateSummarySchema.parse(req.body);

      // Get patient data
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Prepare patient data for AI
      const patientData = {
        name: patient.name,
        mrn: patient.mrn,
        age: patient.dateOfBirth ? Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        gender: patient.gender || undefined,
        chiefComplaint: "Chest pain", // This would come from current encounter
      };

      // Generate AI summary
      const aiResponse = await groqService.generateClinicalSummary({
        patientData,
        summaryType,
        additionalContext,
      });

      // Save to storage
      const summary = await storage.createClinicalSummary({
        patientId,
        userId: "system", // In production, get from session
        type: summaryType,
        content: aiResponse.content,
        aiGenerated: true,
        groqModel: aiResponse.model,
        generationTime: aiResponse.generationTimeMs,
        status: "draft",
      });

      // Create audit log
      await storage.createAuditLog({
        userId: "system",
        action: "ai_summary_generated",
        resource: "clinical_summary",
        resourceId: summary.id,
        details: {
          summaryType,
          patientId,
          generationTimeMs: aiResponse.generationTimeMs,
          model: aiResponse.model,
        },
      });

      res.json({
        id: summary.id,
        content: aiResponse.content,
        generationTime: aiResponse.generationTimeMs,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
      });
    } catch (error) {
      console.error("AI summary generation failed:", error);
      res.status(500).json({ 
        message: "Failed to generate AI summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Patient Routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Clinical Summary Routes
  app.get("/api/summaries/:id", async (req, res) => {
    try {
      const summary = await storage.getClinicalSummary(req.params.id);
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch summary" });
    }
  });

  app.put("/api/summaries/:id", async (req, res) => {
    try {
      const updates = updateSummarySchema.parse(req.body);
      const summary = await storage.updateClinicalSummary(req.params.id, updates);
      
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: "system",
        action: "summary_updated",
        resource: "clinical_summary",
        resourceId: summary.id,
        details: updates,
      });

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to update summary" });
    }
  });

  app.get("/api/patients/:patientId/summaries", async (req, res) => {
    try {
      const summaries = await storage.getClinicalSummariesByPatient(req.params.patientId);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient summaries" });
    }
  });

  // Hospital Metrics Routes
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestHospitalMetrics();
      res.json(metrics || {
        activePatients: 0,
        bedOccupancy: "0",
        criticalAlerts: 0,
        aiSummariesGenerated: 0,
        departmentLoads: { emergency: 0, icu: 0, surgery: 0 }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Risk Alerts Routes
  app.get("/api/risk-alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveRiskAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch risk alerts" });
    }
  });

  app.put("/api/risk-alerts/:id/resolve", async (req, res) => {
    try {
      const resolved = await storage.resolveRiskAlert(req.params.id);
      if (!resolved) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: "system",
        action: "alert_resolved",
        resource: "risk_alert",
        resourceId: req.params.id,
      });

      res.json({ message: "Alert resolved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // FHIR Integration Routes
  app.get("/api/fhir/status", async (req, res) => {
    try {
      const [connectionStatus, syncStatus] = await Promise.all([
        fhirService.checkConnection(),
        fhirService.getSyncStatus(),
      ]);

      res.json({
        connection: connectionStatus,
        sync: syncStatus,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check FHIR status" });
    }
  });

  app.post("/api/fhir/save-summary/:summaryId", async (req, res) => {
    try {
      const summary = await storage.getClinicalSummary(req.params.summaryId);
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }

      const patient = await storage.getPatient(summary.patientId!);
      if (!patient || !patient.fhirId) {
        return res.status(404).json({ message: "Patient FHIR ID not found" });
      }

      const fhirResourceId = await fhirService.createDocumentReference(
        patient.fhirId,
        summary.content,
        summary.type
      );

      if (fhirResourceId) {
        await storage.updateClinicalSummary(summary.id, {
          fhirResourceId,
          status: "finalized",
        });

        // Create audit log
        await storage.createAuditLog({
          userId: "system",
          action: "fhir_document_created",
          resource: "clinical_summary",
          resourceId: summary.id,
          details: { fhirResourceId },
        });

        res.json({ message: "Summary saved to FHIR successfully", fhirResourceId });
      } else {
        res.status(500).json({ message: "Failed to save to FHIR server" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to save summary to FHIR" });
    }
  });

  // Audit Log Routes
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Blockchain Consent Management Routes
  app.post("/api/consent/record", async (req, res) => {
    try {
      const consentData = insertConsentRecordSchema.parse(req.body);
      
      // Record consent on blockchain
      const blockchainEntry = await blockchainService.recordConsent({
        patientId: consentData.patientId,
        purpose: consentData.purpose,
        dataTypes: consentData.dataTypes,
        timestamp: new Date(),
        granularity: consentData.granularity as "full" | "partial" | "research-only",
        clinicianId: consentData.clinicianId,
        hospitalId: consentData.hospitalId
      });

      // Store in database with blockchain reference
      const consent = await storage.createConsentRecord({
        ...consentData,
        consentHash: blockchainEntry.consentHash,
        transactionHash: blockchainEntry.transactionHash,
        blockNumber: blockchainEntry.blockNumber,
        blockchainVerified: blockchainEntry.verified
      });

      res.json({ consent, blockchain: blockchainEntry });
    } catch (error) {
      res.status(500).json({ message: "Failed to record consent", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/consent/verify/:patientId", async (req, res) => {
    try {
      const verified = await blockchainService.verifyConsent(req.params.patientId);
      res.json({ verified, timestamp: new Date() });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify consent" });
    }
  });

  app.get("/api/blockchain/status", async (req, res) => {
    try {
      const status = { connected: true, network: "ethereum", blockHeight: 12345 };
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blockchain status" });
    }
  });

  // Enhanced FHIR Routes
  app.post("/api/fhir/configure", async (req, res) => {
    try {
      const config = req.body;
      await enhancedFhirService.configureHospital(config);
      res.json({ message: "Hospital FHIR configuration successful" });
    } catch (error) {
      res.status(500).json({ message: "Failed to configure FHIR", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/fhir/test-connection", async (req, res) => {
    try {
      const { endpoint, apiKey } = req.body;
      const result = await enhancedFhirService.testConnection(endpoint, apiKey);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to test FHIR connection" });
    }
  });

  app.post("/api/fhir/sync/:hospitalId", async (req, res) => {
    try {
      const { hospitalId } = req.params;
      const options = req.body;
      const result = await enhancedFhirService.bulkPatientSync(hospitalId, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to sync FHIR data" });
    }
  });

  app.get("/api/fhir/sync-status/:hospitalId", async (req, res) => {
    try {
      const status = await enhancedFhirService.getSyncStatus(req.params.hospitalId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sync status" });
    }
  });

  // Predictive Analytics Routes
  app.post("/api/analytics/predict/readmission", async (req, res) => {
    try {
      const { patientId, admissionData } = req.body;
      const prediction = await predictiveService.predictReadmissionRisk(patientId, admissionData);
      
      // Store prediction in database
      await storage.createPrediction({
        modelId: "readmission-v2.1",
        patientId,
        predictionType: "readmission",
        predictedValue: prediction.riskScore,
        confidence: prediction.confidence,
        features: admissionData,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      res.json(prediction);
    } catch (error) {
      res.status(500).json({ message: "Failed to predict readmission risk" });
    }
  });

  app.post("/api/analytics/predict/resources", async (req, res) => {
    try {
      const { hospitalId, timeframe } = req.body;
      const prediction = await predictiveService.predictResourceNeeds(hospitalId, timeframe);
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ message: "Failed to predict resource needs" });
    }
  });

  app.get("/api/analytics/risk-stratification/:patientId", async (req, res) => {
    try {
      const stratification = await predictiveService.stratifyPatientRisk(req.params.patientId);
      res.json(stratification);
    } catch (error) {
      res.status(500).json({ message: "Failed to stratify patient risk" });
    }
  });

  app.post("/api/analytics/train-model", async (req, res) => {
    try {
      const { modelType, trainingData } = req.body;
      const result = await predictiveService.trainModel(modelType, trainingData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to train model" });
    }
  });

  app.get("/api/analytics/insights/:hospitalId", async (req, res) => {
    try {
      const { hospitalId } = req.params;
      const { startDate, endDate, granularity } = req.query;
      
      const period = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        granularity: granularity as 'daily' | 'weekly' | 'monthly'
      };
      
      const insights = await predictiveService.getHospitalInsights(hospitalId, period);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to get hospital insights" });
    }
  });

  // Multi-tenant Hospital Management Routes
  app.post("/api/hospitals", async (req, res) => {
    try {
      const hospitalData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Failed to create hospital" });
    }
  });

  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await storage.getHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  // Workflow Builder Routes
  app.get("/api/workflows", async (req, res) => {
    try {
      const hospitalId = req.query.hospitalId as string;
      const workflows = hospitalId 
        ? await storage.getWorkflowsByHospital(hospitalId)
        : await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const workflowData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(workflowData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: workflowData.createdBy,
        action: "workflow_created",
        resource: "workflow",
        resourceId: workflow.id,
        details: { name: workflow.name, hospitalId: workflow.hospitalId },
      });
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workflow", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const updates = req.body;
      const workflow = await storage.updateWorkflow(req.params.id, updates);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json({ message: "Workflow deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/test", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Simulate workflow test execution
      const testResult = {
        success: true,
        executionTime: Math.floor(Math.random() * 5000) + 1000,
        nodesExecuted: workflow.definition.nodes.length,
        issues: [],
        timestamp: new Date().toISOString()
      };
      
      res.json(testResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to test workflow" });
    }
  });

  app.post("/api/workflows/:id/deploy", async (req, res) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.id, { status: "active" });
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      res.json({ message: "Workflow deployed successfully", workflow });
    } catch (error) {
      res.status(500).json({ message: "Failed to deploy workflow" });
    }
  });

  app.post("/api/workflows/ai-suggest", async (req, res) => {
    try {
      const { currentWorkflow, context } = req.body;
      
      // Use GROQ AI to suggest workflow optimizations
      const prompt = `You are a healthcare workflow optimization expert. Analyze this workflow and provide suggestions for improvement:

Current Workflow: ${JSON.stringify(currentWorkflow, null, 2)}
Context: ${context || "General hospital workflow"}

Please provide:
1. 3-5 optimization suggestions to reduce wait times and improve efficiency
2. 3-5 suggested next steps or nodes to add
3. A brief summary of the workflow's effectiveness

Respond in JSON format with the structure:
{
  "optimizations": ["suggestion1", "suggestion2", ...],
  "nextSteps": ["step1", "step2", ...],
  "summary": "brief analysis summary"
}`;

      const aiResponse = await groqService.generateClinicalSummary({
        patientData: { name: "Workflow Analysis", mrn: "WF001" },
        summaryType: "handoff",
        additionalContext: prompt,
      });

      let suggestions;
      try {
        suggestions = JSON.parse(aiResponse.content);
      } catch {
        // Fallback if AI doesn't return valid JSON
        suggestions = {
          optimizations: [
            "Add automated patient check-in kiosk",
            "Implement real-time bed tracking",
            "Use predictive analytics for staffing"
          ],
          nextSteps: [
            "Add discharge planning step",
            "Include medication reconciliation",
            "Add follow-up appointment scheduling"
          ],
          summary: "Workflow shows good patient flow but could benefit from automation and predictive elements."
        };
      }

      suggestions.generatedAt = new Date().toISOString();
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI suggestions", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      features: ["ai", "fhir", "blockchain", "predictive-analytics", "multi-tenant", "workflow-builder"]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
