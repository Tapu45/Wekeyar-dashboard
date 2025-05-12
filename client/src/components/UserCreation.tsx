import React, { useState } from "react";
import api, { API_ROUTES } from "../utils/api";
import { User, Mail, Lock, UserPlus, CheckCircle, AlertCircle } from "lucide-react";

const UserCreationPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tellecaller"); // Default role
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ type: null, message: "" });

    try {
      const response = await api.post(API_ROUTES.CREATE_USER, {
        username,
        email,
        password,
        role,
      });

      if (response.status === 201) {
        setNotification({
          type: "success",
          message: "User created successfully!",
        });
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("tellecaller"); // Reset to default role
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.status === 409) {
        setNotification({
          type: "error",
          message: "Username or email already exists.",
        });
      } else {
        setNotification({
          type: "error",
          message: "Failed to create user. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelClasses = "block text-blue-800 font-medium mb-2";

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold animate-fadeIn">Create User</h1>
        <p className="text-blue-100 mt-2">Add new telecallers to the system</p>
      </header>

      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-100 animate-fadeInUp mt-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <div className="flex items-center">
              <UserPlus className="mr-2" size={20} />
              <h2 className="text-xl font-semibold">New User Information</h2>
            </div>
          </div>

          {notification.type && (
            <div 
              className={`p-4 m-4 rounded-lg flex items-center ${
                notification.type === "success" 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle size={20} className="mr-2" />
              ) : (
                <AlertCircle size={20} className="mr-2" />
              )}
              {notification.message}
            </div>
          )}

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="transition-all duration-300 transform hover:translate-x-1">
                <label className={labelClasses}>
                  Username:
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-blue-500">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={`${inputClasses} pl-10`}
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div className="transition-all duration-300 transform hover:translate-x-1">
                <label className={labelClasses}>
                  Email:
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-blue-500">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`${inputClasses} pl-10`}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="transition-all duration-300 transform hover:translate-x-1">
                <label className={labelClasses}>
                  Password:
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-blue-500">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${inputClasses} pl-10`}
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="transition-all duration-300 transform hover:translate-x-1">
                <label className={labelClasses}>
                  Role:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className={inputClasses}
                >
                  <option value="tellecaller">Tellecaller</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium transition-all duration-300 
                  ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 transform hover:scale-105"}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating User...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus size={20} className="mr-2" />
                    Create User
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these global styles to your CSS if not already added
/*
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}

.animate-fadeInUp {
  animation: fadeInUp 0.7s ease-out;
}
*/

export default UserCreationPage;