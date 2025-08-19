import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { groqService } from "./services/groq";
import { fhirService } from "./services/fhir";
import { insertClinicalSummarySchema, insertAuditLogSchema } from "@shared/schema";

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
        gender: patient.gender,
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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
