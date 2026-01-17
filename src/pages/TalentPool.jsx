import { useState, useEffect } from "react";
import { z } from "zod";
import { JobService, TalentPoolService } from "../lib/api.js";
import { matchingService } from "../services/matchingService.js";
import { getRole } from "../auth/auth.js";
import TalentPoolFilters from "./components/TalentPoolFilters.jsx";
import TalentPoolResults from "./components/TalentPoolResults.jsx";
import TalentPoolSaved from "./components/TalentPoolSaved.jsx";

// Response validation schema
const MatchingDimensionsSchema = z.object({
  experience: z.number().min(0).max(1),
  location: z.number().min(0).max(1),
  skills: z.number().min(0).max(1),
  preferences: z.number().min(0).max(1),
  activity: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
});

const MatchQualitySchema = z.object({
  overall: z.enum(["excellent", "good", "fair", "poor"]),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendations: z.array(z.string()),
});

const ExplanationSchema = z.object({
  confidence: z.enum(["high", "medium", "low"]),
  reasons: z.array(z.string()),
  quality: MatchQualitySchema,
  dimensions: MatchingDimensionsSchema,
  data_completeness: z.number().min(0).max(1),
  text_match: z.number().min(0).max(100),
  overall_score: z.number().min(0).max(100),
});

const MatchingCandidateSchema = z.object({
  id: z.string(),
  score_percent: z.number().min(0).max(100),
  explanation: ExplanationSchema,
  _source: z.any().optional(),
});

const MatchingResponseSchema = z.object({
  jobId: z.string(),
  total: z.number().int().min(0),
  candidates: z.array(MatchingCandidateSchema),
  appliedFilters: z
    .object({
      matchMode: z.string(),
      minScore: z.number(),
      size: z.number(),
      experimentId: z.string(),
    })
    .optional(),
});

function TalentPool() {
  const [activeTab, setActiveTab] = useState("matching"); // matching | saved
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [matchingError, setMatchingError] = useState(null);

  // Load jobs for matching
  useEffect(() => {
    const loadJobs = async () => {
      // Only load jobs if user is authenticated and is a recruiter
      const role = getRole();
      if (role !== "recruiter") {
        return;
      }

      try {
        const response = await JobService.myJobs({ page: 1, limit: 100 });
        const jobsData = response?.data || response || [];
        const approvedJobs = jobsData.filter(
          (job) => job.status === "approved"
        );
        setJobs(approvedJobs);

        // Default select first approved job
        if (approvedJobs.length > 0 && !selectedJobId) {
          setSelectedJobId(approvedJobs[0].id);
        }
      } catch (error) {
        console.error("Failed to load jobs:", error);
      }
    };
    loadJobs();
  }, [selectedJobId]);

  const handleMatching = async (filters) => {
    if (!selectedJobId) return;

    setLoading(true);
    setMatchingError(null);
    try {
      const response = await matchingService.getCandidatesForJob(
        selectedJobId,
        filters
      );
      const payload = response?.data || response || {};

      // Validate response against schema
      const validatedResponse = MatchingResponseSchema.parse(payload);
      const candidates = validatedResponse.candidates;

      setMatchingResults(candidates);
    } catch (error) {
      console.error("Matching failed:", error);

      // Handle specific HTTP status codes
      if (error?.status === 404) {
        setMatchingError(
          "Việc làm này không khả dụng để tìm ứng viên. Vui lòng chọn việc khác."
        );
      } else if (error?.status === 403) {
        setMatchingError("Bạn không có quyền tìm ứng viên cho việc làm này.");
      } else if (error?.name === "ZodError") {
        console.error("Response validation failed:", error.errors);
        setMatchingError("Dữ liệu từ server không hợp lệ. Vui lòng thử lại.");
      } else {
        setMatchingError(
          error?.message || "Không thể tìm kiếm ứng viên. Vui lòng thử lại."
        );
      }

      setMatchingResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCandidate = async (candidateId) => {
    try {
      await TalentPoolService.saveCandidate(candidateId, selectedJobId);
      // Show success feedback (could be replaced with toast notification)
      console.log(`Successfully saved candidate ${candidateId} to talent pool`);
      // In a real app, you might want to show a toast notification here
    } catch (error) {
      console.error("Failed to save candidate:", error);
      // In a real app, show error toast
      alert("Không thể lưu ứng viên. Vui lòng thử lại.");
    }
  };

  const handleBulkSaveCandidates = async (candidateIds) => {
    try {
      await TalentPoolService.bulkSaveCandidates(candidateIds, selectedJobId);
      console.log(
        `Successfully saved ${candidateIds.length} candidates to talent pool`
      );
      // In a real app, show success toast with count
    } catch (error) {
      console.error("Failed to bulk save candidates:", error);
      alert("Không thể lưu ứng viên. Vui lòng thử lại.");
      throw error; // Re-throw to let the UI handle it
    }
  };

  return (
    <div className="talent-pool">
      <section className="rd-card rd-hero-card">
        <div>
          <h1>Talent Pool</h1>
          <p>Khám phá và quản lý nguồn ứng viên tiềm năng cho công ty bạn</p>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="rd-tabs">
        <button
          className={activeTab === "matching" ? "active" : ""}
          onClick={() => setActiveTab("matching")}
        >
          Tìm ứng viên mới
        </button>
        <button
          className={activeTab === "saved" ? "active" : ""}
          onClick={() => setActiveTab("saved")}
        >
          Ứng viên đã lưu
        </button>
      </div>

      {activeTab === "matching" && (
        <>
          {/* Job Selection */}
          <section className="rd-card job-selection-card">
            <div className="rd-card__head">
              <h3>Chọn vị trí cần tuyển</h3>
            </div>
            <div className="rd-card__body">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="rd-select"
                disabled={loading}
              >
                <option value="">Chọn vị trí...</option>
                {jobs.map((job) => {
                  const loc = job.locations || job.location;
                  const displayLocation =
                    loc?.parent?.name && loc?.name
                      ? `${loc.parent.name} - ${loc.name}`
                      : loc?.name || "Chưa xác định";
                  return (
                    <option key={job.id} value={job.id}>
                      {job.title} - {displayLocation}
                    </option>
                  );
                })}
              </select>
              {jobs.length === 0 && (
                <div
                  className="empty-state"
                  style={{ padding: "20px", margin: "10px 0" }}
                >
                  <div className="empty-icon">💼</div>
                  <p className="empty-description">
                    Bạn chưa có vị trí nào được duyệt. Hãy{" "}
                    <a
                      href="/post-job"
                      style={{ color: "#3b82f6", textDecoration: "underline" }}
                    >
                      đăng tin tuyển dụng
                    </a>{" "}
                    trước.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Filters */}
          <TalentPoolFilters
            onMatch={handleMatching}
            loading={loading}
            disabled={!selectedJobId}
          />

          {/* Error Display */}
          {matchingError && (
            <div
              className="rd-card"
              style={{ borderColor: "#ef4444", backgroundColor: "#fef2f2" }}
            >
              <div className="rd-card__body">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontSize: "20px" }}>⚠️</span>
                  <div>
                    <p
                      style={{ margin: 0, fontWeight: "600", color: "#dc2626" }}
                    >
                      Không thể tìm kiếm ứng viên
                    </p>
                    <p style={{ margin: "4px 0 0 0", color: "#7f1d1d" }}>
                      {matchingError}
                    </p>
                  </div>
                  <button
                    onClick={() => setMatchingError(null)}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      fontSize: "18px",
                      cursor: "pointer",
                      color: "#dc2626",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <TalentPoolResults
            candidates={matchingResults}
            loading={loading}
            onSaveCandidate={handleSaveCandidate}
            onBulkSaveCandidates={handleBulkSaveCandidates}
            selectedJobId={selectedJobId}
          />
        </>
      )}

      {activeTab === "saved" && (
        <TalentPoolSaved selectedJobId={selectedJobId} />
      )}
    </div>
  );
}

export default TalentPool;
