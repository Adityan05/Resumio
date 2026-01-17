import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  X,
  FileCheck,
  Sparkles,
  TrendingUp,
  Shield,
} from "lucide-react";
import { API_URL } from "../config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Login failed. Please check your credentials and try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding and Info */}
        <div className="hidden lg:block space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
            <FileCheck className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-indigo-600">Resumio</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            AI-Powered Resume Analysis
          </h2>
          <p className="text-lg text-gray-600">
            Get instant feedback to improve your ATS score and land your dream
            job.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-start space-x-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <Sparkles className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  AI-Powered Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Get detailed insights powered by advanced AI technology
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <TrendingUp className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Improve ATS Score
                </h3>
                <p className="text-sm text-gray-600">
                  Optimize your resume to pass Applicant Tracking Systems
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Job Description Matching
                </h3>
                <p className="text-sm text-gray-600">
                  See how well your resume matches specific job requirements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full space-y-8 p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl">
          {/* Mobile Branding */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-6">
            <FileCheck className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-indigo-600">Resumio</h1>
          </div>

          <div className="text-center">
            <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                create a new account
              </Link>
            </p>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`rounded-lg p-4 flex items-start ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex-shrink-0">
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    message.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {message.text}
                </p>
              </div>
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className={`ml-4 flex-shrink-0 ${
                  message.type === "success"
                    ? "text-green-600 hover:text-green-800"
                    : "text-red-600 hover:text-red-800"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
