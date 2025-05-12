import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_ROUTES } from "../utils/api";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";
    
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setIsLoading(true);

    try {
      const response = await api.post(API_ROUTES.LOGIN, { username, password });
      if (response.data.token) {
        // Handle "Remember Me" functionality
        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedUsername");
          localStorage.removeItem("rememberMe");
        }
        
        // Save the token in localStorage
        localStorage.setItem("token", response.data.token);
        // Redirect to home page after successful login
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white" style={{
      backgroundImage: "radial-gradient(circle at top left, #f0f7ff 10%, transparent 60%), radial-gradient(circle at bottom right, #e1edff 5%, transparent 60%), linear-gradient(to bottom right, rgba(240, 249, 255, 0.8) 0%, rgba(255, 255, 255, 1) 50%, rgba(226, 240, 253, 0.8) 100%)",
      backgroundSize: "cover"
    }}>
      <div className="max-w-md w-full mx-4 bg-white p-10 rounded-3xl shadow-md border border-gray-100">
        {/* Logo and Branding Section */}
        <div className="flex justify-center mb-8 transition-transform duration-500 hover:scale-105">
          <img
            src="/logo.png" // Replace with the actual path to your logo
            alt="WekeyarPlus"
            className="w-52 object-contain"
          />
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center text-gray-900">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-8">Login to access your dashboard</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-center text-sm rounded-xl border border-red-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full pl-12 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Remember Me checkbox */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition duration-300 transform hover:-translate-y-1 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer branding with subtle blue accent */}
        <div className="mt-10 text-center">
          <div className="inline-block px-6 py-2 rounded-full bg-blue-50">
            <p className="text-sm text-blue-600 font-medium">WekeyarPlus Dashboard &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
      
      {/* Add subtle decorative elements */}
      <div className="absolute top-20 left-20 w-24 h-24 rounded-full bg-blue-100 opacity-40 blur-2xl -z-10"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-blue-100 opacity-40 blur-2xl -z-10"></div>
    </div>
  );
};

export default Login;