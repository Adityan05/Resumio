import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, User, LogOut, History, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PROGRESS_STEPS = [
    { key: 'upload', label: 'Uploading PDF', target: 15 },
    { key: 'parse', label: 'Parsing PDF', target: 35 },
    { key: 'ocr', label: 'Sending PDF to OCR backend', target: 60 },
    { key: 'ai', label: 'AI analysis', target: 80 },
    { key: 'score', label: 'Generating score', target: 95 },
];

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [activeStep, setActiveStep] = useState(null);
    const [dotTick, setDotTick] = useState(0);
    const navigate = useNavigate();
    const progressTimers = useRef([]);
    const loadingRef = useRef(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
            fetchHistory();
        }
    }, [navigate]);

    useEffect(() => {
        if (!loading) {
            setDotTick(0);
            return;
        }
        const interval = setInterval(() => setDotTick(prev => prev + 1), 500);
        return () => clearInterval(interval);
    }, [loading]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/user/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const clearProgressTimers = () => {
        progressTimers.current.forEach(timer => clearTimeout(timer));
        progressTimers.current = [];
    };

    const startProgressTimeline = () => {
        loadingRef.current = true;
        clearProgressTimers();
        PROGRESS_STEPS.forEach((step, index) => {
            const timer = setTimeout(() => {
                if (!loadingRef.current) return;
                setActiveStep(step.key);
                setProgressPercent(prev => Math.max(prev, step.target));
            }, index === 0 ? 0 : index * 1200);
            progressTimers.current.push(timer);
        });
    };

    const finishProgress = () => {
        loadingRef.current = false;
        clearProgressTimers();
        setActiveStep('done');
        setProgressPercent(100);
        setTimeout(() => {
            setProgressPercent(0);
            setActiveStep(null);
        }, 1500);
    };

    const abortProgress = () => {
        loadingRef.current = false;
        clearProgressTimers();
        setProgressPercent(0);
        setActiveStep(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setAnalysis(null);
        startProgressTimeline();

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (event) => {
                    if (!event.total) return;
                    const uploadStep = PROGRESS_STEPS[0];
                    const ratio = event.loaded / event.total;
                    const dynamicValue = Math.min(uploadStep.target, Math.round(uploadStep.target * ratio));
                    setProgressPercent(prev => Math.max(prev, dynamicValue));
                }
            });
            setAnalysis(res.data);
            fetchHistory(); // Refresh history
            finishProgress();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to analyze resume. Please try again.');
            abortProgress();
        } finally {
            setLoading(false);
        }
    };

    const resetAnalysis = () => {
        setFile(null);
        setAnalysis(null);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600">ResumeAI</h1>
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
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">Close</button>
                        </div>
                        <div className="overflow-hidden">
                            {history.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {history.map((item) => {
                                        const numericScore = typeof item.score === 'number' ? item.score : null;
                                        const badgeClass = numericScore !== null
                                            ? numericScore >= 80
                                                ? 'bg-green-100 text-green-800'
                                                : numericScore >= 60
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800';
                                        return (
                                            <li key={item.id} className="py-3 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.fileName}</p>
                                                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                                                    Score: {numericScore !== null ? numericScore : 'N/A'}
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
                            <p className="text-gray-500 mb-8">Get instant AI feedback to improve your ATS score.</p>

                            <div className="max-w-xl mx-auto">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 hover:border-indigo-500 transition-colors bg-gray-50">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                                        <Upload className="h-16 w-16 text-indigo-500 mb-4" />
                                        <span className="text-lg font-medium text-gray-700">Click to upload PDF</span>
                                        <span className="text-sm text-gray-500 mt-1">Max 2 pages</span>
                                        {file && <span className="mt-4 inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">{file.name}</span>}
                                    </label>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className={`relative mt-6 w-full overflow-hidden rounded-xl text-white font-bold text-lg shadow-md transition-all transform ${!file && !loading ? 'hover:scale-[1.02]' : ''} ${(!file && !loading) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900'} ${loading ? 'cursor-wait' : ''}`}
                                >
                                    <span
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
                                        style={{
                                            width: loading ? `${Math.min(progressPercent, 100)}%` : '0%',
                                            opacity: loading ? 0.35 : 0
                                        }}
                                    />
                                    <span className="relative flex items-center justify-center gap-2 py-4 px-6">
                                        {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                        {loading
                                            ? (PROGRESS_STEPS.find(step => step.key === activeStep)?.label || 'Analyzing')
                                            : 'Analyze Resume'}
                                    </span>
                                </button>
                                {loading && (
                                    <div className="mt-4 rounded-lg bg-white/70 p-4 shadow-inner">
                                        <div className="space-y-2">
                                            {PROGRESS_STEPS.map((step, index) => {
                                                const activeIndex = PROGRESS_STEPS.findIndex(s => s.key === activeStep);
                                                const isActive = activeStep === step.key;
                                                const isCompleted = activeIndex > index || activeStep === 'done';
                                                const indicatorClass = isCompleted
                                                    ? 'bg-green-500'
                                                    : isActive
                                                        ? 'bg-indigo-500 animate-pulse'
                                                        : 'bg-gray-300';
                                                const textClass = isActive
                                                    ? 'text-indigo-700 font-semibold'
                                                    : isCompleted
                                                        ? 'text-gray-600 line-through'
                                                        : 'text-gray-500';
                                                const suffix = isActive ? '.'.repeat((dotTick % 3) + 1) : '';
                                                return (
                                                    <div key={step.key} className="flex items-center text-sm">
                                                        <span className={`mr-3 h-2.5 w-2.5 rounded-full ${indicatorClass}`} />
                                                        <span className={textClass}>{step.label}{suffix}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center"><AlertCircle className="h-5 w-5 mr-2" />{error}</div>}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {analysis && (
                        <div className="space-y-6 animate-fade-in">

                            {/* Score Header */}
                            <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col md:flex-row items-center justify-between border-l-8 border-indigo-600">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Analysis Results</h2>
                                    <p className="text-gray-500 mt-1">Here is how your resume performs.</p>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center">
                                    <div className="text-right mr-4">
                                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">ATS Score</p>
                                        <p className={`text-5xl font-extrabold ${analysis.atsScore >= 80 ? 'text-green-600' : analysis.atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                            {analysis.atsScore}/100
                                        </p>
                                    </div>
                                    <div className={`h-16 w-16 rounded-full flex items-center justify-center ${analysis.atsScore >= 80 ? 'bg-green-100' : analysis.atsScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                        <CheckCircle className={`h-8 w-8 ${analysis.atsScore >= 80 ? 'text-green-600' : analysis.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Section Scores */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {analysis.sectionScores && Object.entries(analysis.sectionScores).map(([section, score]) => (
                                    <div key={section} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{section}</h3>
                                        <p className={`text-2xl font-bold ${score === 'High' ? 'text-green-600' : score === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>{score}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Improvements Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Missing Info */}
                                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-red-400">
                                    <div className="flex items-center mb-4">
                                        <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                                        <h3 className="text-xl font-bold text-gray-900">Missing Information</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {analysis.missingInfo && analysis.missingInfo.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-gray-700">
                                                <span className="mr-3 mt-1.5 h-1.5 w-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Corrections */}
                                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-indigo-500">
                                    <div className="flex items-center mb-4">
                                        <CheckCircle className="h-6 w-6 text-indigo-500 mr-2" />
                                        <h3 className="text-xl font-bold text-gray-900">Corrections</h3>
                                    </div>
                                    <div className="space-y-3 text-gray-700 text-sm">
                                        {analysis.corrections && analysis.corrections.map((item, idx) => (
                                            <div key={idx} className="flex items-start">
                                                <span className="mr-3 mt-1.5 h-1.5 w-1.5 bg-indigo-400 rounded-full flex-shrink-0"></span>
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
                                    className="flex items-center px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
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
