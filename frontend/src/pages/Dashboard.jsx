import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  User,
  LogOut,
  History,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("idle"); // idle | uploading | parsing | ocr | ai | complete | error
  const [statusMessage, setStatusMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
      fetchHistory();
    }
  }, [navigate]);

  const handleAuthFailure = (message) => {
    if (message) {
      setError(message);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("http://localhost:3000/api/user/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthFailure("Session expired. Please log in again.");
      }
    }
  };

  const handleLogout = () => {
    handleAuthFailure("");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
    setError("");
  };

  const validateJobDescription = () => {
    if (!jobDescription || jobDescription.trim().length === 0) {
      return { isValid: true }; // Optional field, so empty is valid
    }
    const trimmed = jobDescription.trim();
    const wordCount = trimmed.split(/\s+/).filter(word => word.length > 0).length;
    
    if (trimmed.length < 50) {
      return { isValid: false, message: "Job description must be at least 50 characters long." };
    }
    if (wordCount < 10) {
      return { isValid: false, message: "Job description must contain at least 10 words." };
    }
    return { isValid: true };
  };

  const connectToProgressStream = (sessionId) => {
    const token = localStorage.getItem("token");
    const eventSource = new EventSource(
      `http://localhost:3000/api/analyze/progress/${sessionId}?token=${token}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProcessingPhase(data.phase);
        setStatusMessage(data.message);
        setProgressPercent(data.progress);
      } catch (error) {
        console.error("Error parsing progress data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      eventSource.close();
    };

    return eventSource;
  };

  const handleUpload = async () => {
    if (!file) return;
    
    // Validate job description if provided
    const jdValidation = validateJobDescription();
    if (!jdValidation.isValid) {
      setError(jdValidation.message);
      return;
    }
    
    setLoading(true);
    setError("");
    setAnalysis(null);
    setUploadProgress(0);
    setProgressPercent(0);
    setProcessingPhase("uploading");
    setStatusMessage("Uploading resume...");

    // Generate session ID for progress tracking
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Connect to progress stream
    const eventSource = connectToProgressStream(sessionId);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription && jobDescription.trim().length > 0) {
      formData.append("jobDescription", jobDescription.trim());
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3000/api/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            "X-Session-Id": sessionId,
          },
          onUploadProgress: (event) => {
            if (!event.total) {
              setStatusMessage("Uploading resume...");
              return;
            }
            const ratio = event.loaded / event.total;
            const percent = Math.min(100, Math.round(ratio * 100));
            setUploadProgress(percent);
            setProgressPercent(Math.min(15, percent * 0.15)); // Upload is 15% of total
            setStatusMessage(`Uploading resume... ${percent}%`);

            if (percent >= 100) {
              setStatusMessage("Upload complete. Processing...");
              setProgressPercent(18);
            }
          },
        }
      );

      setAnalysis(res.data);
      fetchHistory(); // Refresh history

      // Clean up
      eventSource.close();

      setTimeout(() => {
        setProcessingPhase("idle");
        setUploadProgress(0);
        setProgressPercent(0);
        setStatusMessage("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "Failed to analyze resume. Please try again."
      );
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthFailure("Session expired. Please log in again.");
      } else {
        setProcessingPhase("error");
        setStatusMessage("Analysis failed");
        setProgressPercent(0);
      }
      eventSource.close();
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setJobDescription("");
    setAnalysis(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">
                AI Resume Analyzer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{user.name}</span>
                </div>
              )}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                title="History"
              >
                <History className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* History Modal/Section */}
        {showHistory && (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Scans</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="overflow-hidden">
              {history.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {history.map((item) => {
                    const numericScore =
                      typeof item.score === "number" ? item.score : null;
                    const badgeClass =
                      numericScore !== null
                        ? numericScore >= 80
                          ? "bg-green-100 text-green-800"
                          : numericScore >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800";
                    return (
                      <li
                        key={item.id}
                        className="py-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
                        >
                          Score: {numericScore !== null ? numericScore : "N/A"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No history found.</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Top Down Layout */}
        <div className="space-y-8">
          {/* Upload Section */}
          {!analysis && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Your Resume
              </h2>
              <p className="text-gray-500 mb-8">
                Get instant AI feedback to improve your ATS score.
              </p>

              <div className="max-w-xl mx-auto space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 hover:border-indigo-500 transition-colors bg-gray-50">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-16 w-16 text-indigo-500 mb-4" />
                    <span className="text-lg font-medium text-gray-700">
                      Click to upload PDF
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      Max 2 pages
                    </span>
                    {file && (
                      <span className="mt-4 inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {file.name}
                      </span>
                    )}
                  </label>
                </div>

                {/* Job Description Matcher Field */}
                <div className="text-left">
                  <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description Matcher (Optional)
                  </label>
                  <textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={handleJobDescriptionChange}
                    placeholder="Paste the job description here to get personalized matching scores and improvement suggestions..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 50 characters and 10 words if provided
                  </p>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className={`relative mt-6 w-full overflow-hidden rounded-xl text-white cursor-pointer font-bold text-lg shadow-md transition-all transform ${
                    !file && !loading ? "hover:scale-[1.02]" : ""
                  } ${
                    !file && !loading
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-indigo-700 hover:bg-indigo-900"
                  } ${loading ? "cursor-wait" : ""}`}
                >
                  {/* Progress bar background */}
                  <span
                    className="absolute inset-0 bg-linear-to-r from-sky-300 to-sky-500 transition-all duration-700 ease-out"
                    style={{
                      width: loading ? `${progressPercent}%` : "0%",
                      opacity: loading ? 0.4 : 0,
                    }}
                  />

                  {/* Subtle shimmer animation during processing */}
                  {loading && processingPhase !== "uploading" && (
                    <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  )}

                  <span className="relative flex items-center justify-center gap-2 py-4 px-6">
                    {loading ? (
                      <Loader
                        className={`h-5 w-5 ${
                          processingPhase === "ai"
                            ? "animate-spin"
                            : "animate-spin"
                        }`}
                      />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                    <span className="flex flex-col items-center">
                      <span>
                        {loading
                          ? statusMessage || "Analyzing"
                          : "Analyze Resume"}
                      </span>
                      {loading && (
                        <span className="text-xs opacity-75 mt-1">
                          {processingPhase === "uploading" &&
                            "Uploading file..."}
                          {processingPhase === "parsing" &&
                            "Extracting text..."}
                          {processingPhase === "ocr" &&
                            "Processing with OCR..."}
                          {processingPhase === "ai" && "Generating insights..."}
                          {processingPhase === "complete" && "Done!"}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          {analysis && (
            <div className="space-y-6 animate-fade-in">
              {/* Score Header */}
              <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col md:flex-row items-center justify-between border-l-8 border-indigo-600">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Analysis Results
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Here is how your resume performs.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center">
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                      Resume Score
                    </p>
                    <p
                      className={`text-5xl font-extrabold ${
                        analysis.atsScore >= 80
                          ? "text-green-600"
                          : analysis.atsScore >= 60
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {analysis.atsScore}/100
                    </p>
                  </div>
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center ${
                      analysis.atsScore >= 80
                        ? "bg-green-100"
                        : analysis.atsScore >= 60
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    <CheckCircle
                      className={`h-8 w-8 ${
                        analysis.atsScore >= 80
                          ? "text-green-600"
                          : analysis.atsScore >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.sectionScores &&
                  Object.entries(analysis.sectionScores).map(
                    ([section, score]) => (
                      <div
                        key={section}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                      >
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                          {section}
                        </h3>
                        <p
                          className={`text-2xl font-bold ${
                            score === "High"
                              ? "text-green-600"
                              : score === "Medium"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {score}
                        </p>
                      </div>
                    )
                  )}
              </div>

              {/* Job Description Matching Section */}
              {analysis.jdMatch && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm p-8 border-2 border-purple-200">
                  <div className="flex items-center mb-6">
                    <FileText className="h-8 w-8 text-purple-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Job Description Match Analysis
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Similarity Score */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        Similarity Score
                      </h3>
                      <p className="text-3xl font-bold text-purple-600 mb-1">
                        {analysis.jdMatch.similarityScore}/100
                      </p>
                      <p className="text-xs text-gray-500">
                        How well your resume matches the job requirements
                      </p>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            analysis.jdMatch.similarityScore >= 80
                              ? "bg-green-500"
                              : analysis.jdMatch.similarityScore >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${analysis.jdMatch.similarityScore}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Qualification Score */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                        Qualification Score
                      </h3>
                      <p className="text-3xl font-bold text-indigo-600 mb-1">
                        {analysis.jdMatch.qualificationScore}/100
                      </p>
                      <p className="text-xs text-gray-500">
                        How qualified you appear for this specific role
                      </p>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            analysis.jdMatch.qualificationScore >= 80
                              ? "bg-green-500"
                              : analysis.jdMatch.qualificationScore >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${analysis.jdMatch.qualificationScore}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Improvement Suggestions */}
                  {analysis.jdMatch.improvementSuggestions &&
                    analysis.jdMatch.improvementSuggestions.length > 0 && (
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                          Improvement Suggestions for This Job
                        </h3>
                        <ul className="space-y-3">
                          {analysis.jdMatch.improvementSuggestions.map(
                            (suggestion, idx) => (
                              <li
                                key={idx}
                                className="flex items-start text-gray-700"
                              >
                                <span className="mr-3 mt-1.5 h-1.5 w-1.5 bg-purple-400 rounded-full shrink-0"></span>
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown>{suggestion}</ReactMarkdown>
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Improvements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Info */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-red-400">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Missing Information
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {analysis.missingInfo &&
                      analysis.missingInfo.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-gray-700"
                        >
                          <span className="mr-3 mt-1.5 h-1.5 w-1.5 bg-red-400 rounded-full shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Corrections */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-indigo-500">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-indigo-500 mr-2" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Corrections
                    </h3>
                  </div>
                  <div className="space-y-3 text-gray-700 text-sm">
                    {analysis.corrections &&
                      analysis.corrections.map((item, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="mr-3 mt-1.5 h-1.5 w-1.5 bg-indigo-400 rounded-full shrink-0"></span>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{item}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={resetAnalysis}
                  className="flex items-center px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors cursor-pointer shadow-lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Analyze Another Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
