import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Database,
  FileText,
  BarChart,
  AlertTriangle,
  Cpu,
  BarChart3,
  ArrowDownUp,
  ActivitySquare,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { API_ROUTES } from "../utils/api";
import api from "../utils/api";

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recent" | "all">("recent");
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]); // State to store logs


  // Fetch upload history on component mount
  useEffect(() => {
    fetchUploadHistory();
  }, []);


  const fetchUploadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(API_ROUTES.UPLOAD_HISTORY);
      // Make sure we're setting an array
      setUploadHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error("Error fetching upload history:", err);
      setError("Failed to fetch upload history");
      // Ensure uploadHistory is still an array even on error
      setUploadHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = (uploadId: string) => {
    const eventSource = new EventSource(
      API_ROUTES.UPLOAD_LOGS.replace(":id", uploadId)
    );
  
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prevLogs) => [...prevLogs, data.log]); // Append new logs
    };
  
    eventSource.onerror = () => {
      console.error("Error connecting to log stream");
      eventSource.close();
    };
  
    return () => {
      eventSource.close();
    };
  };

  const handleDeleteHistory = async (id: string | null) => {
    try {
      if (id) {
        // Delete a specific record
        await api.delete(API_ROUTES.UPLOAD_HISTORY_DELETE.replace(":id?", id));
        console.log(`Deleted upload history record with ID: ${id}`);
      } else {
        // Delete all records
        await api.delete(API_ROUTES.UPLOAD_HISTORY_DELETE.replace(":id?", ""));
        console.log("Deleted all upload history records");
      }
      fetchUploadHistory(); // Refresh the upload history after deletion
    } catch (err: any) {
      console.error("Error deleting upload history:", err);
      setError("Failed to delete upload history");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

     // Validate file extension
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (fileExtension !== "xlsx") {
    setError("Invalid file format. Only .xlsx files are supported.");
    return;
  }

    const formData = new FormData();
    formData.append("excelFile", file);

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const response = await api.post(API_ROUTES.UPLOAD, formData, {
        // Use the `api` instance and `API_ROUTES.UPLOAD`
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadResult(response.data);
      fetchUploadHistory();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "An error occurred during upload");
    } finally {
      setTimeout(() => setIsUploading(false), 1000); // Add slight delay for animation
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle size={14} className="mr-1" />;
      case "processing":
        return <RefreshCw size={14} className="mr-1 animate-spin" />;
      case "failed":
        return <AlertCircle size={14} className="mr-1" />;
      default:
        return <Clock size={14} className="mr-1" />;
    }
  };

  const renderDataExtractionAnimation = () => {
    return (
      <div className="relative h-96 w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-xl mb-6">
        {/* Deep space background effect */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-15" />
        
        {/* Stars/data particles in background */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              width: Math.random() > 0.7 ? 2 : 1,
              height: Math.random() > 0.7 ? 2 : 1,
              backgroundColor: i % 5 === 0 ? "#a5b4fc" : i % 5 === 1 ? "#93c5fd" : i % 5 === 2 ? "#6366f1" : i % 5 === 3 ? "#38bdf8" : "#f0f9ff",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.4, 0.9, 0.4],
              scale: [1, Math.random() * 0.5 + 1, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
        
        {/* Core Neural Network Node */}
        <motion.div
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        >
          {/* Neural network nodes and connections */}
          <div className="relative w-64 h-64">
            {/* Central node */}
            <motion.div
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(56, 189, 248, 0.3)",
                  "0 0 20px 5px rgba(56, 189, 248, 0.6)",
                  "0 0 10px 2px rgba(56, 189, 248, 0.3)",
                ],
                scale: [1, 1.05, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
            >
              {/* Inner core */}
              <motion.div
                className="w-10 h-10 rounded-full bg-blue-100/10 backdrop-blur-sm flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <Cpu size={20} className="text-blue-50" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
            
            {/* Orbital nodes */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 90;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <React.Fragment key={`node-${i}`}>
                  {/* Connection line */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 origin-left h-0.5 bg-gradient-to-r from-sky-500/80 to-blue-500/5"
                    style={{
                      width: radius,
                      transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                    }}
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      delay: i * 0.2,
                    }}
                  />
                  
                  {/* Data pulse traveling along the connection */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300 shadow-sm shadow-sky-500/50"
                    animate={{
                      x: [0, x],
                      y: [0, y],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Orbital node */}
                  <motion.div
                    className="absolute w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: "translate(-50%, -50%)",
                      background: i % 2 === 0 ? "linear-gradient(to bottom right, rgb(56, 189, 248), rgb(99, 102, 241))" : 
                                              "linear-gradient(to bottom right, rgb(14, 165, 233), rgb(79, 70, 229))",
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        "0 0 3px rgba(56, 189, 248, 0.3)",
                        "0 0 8px rgba(56, 189, 248, 0.6)",
                        "0 0 3px rgba(56, 189, 248, 0.3)",
                      ],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2 + i * 0.3,
                      delay: i * 0.1,
                    }}
                  >
                    {i % 4 === 0 && <Database size={12} className="text-white" />}
                    {i % 4 === 1 && <FileSpreadsheet size={12} className="text-white" />}
                    {i % 4 === 2 && <BarChart3 size={12} className="text-white" />}
                    {i % 4 === 3 && <FileText size={12} className="text-white" />}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>
        
        {/* Data Source Zone - Left */}
        <motion.div
          className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center"
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {/* Source card */}
          <motion.div
            className="w-36 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-900/90 to-emerald-950/90 border border-emerald-700/30 shadow-lg backdrop-blur-sm flex flex-col"
            animate={{
              y: [0, -4, 0],
              boxShadow: [
                "0 8px 16px -8px rgba(16, 185, 129, 0.1)",
                "0 12px 24px -8px rgba(16, 185, 129, 0.2)",
                "0 8px 16px -8px rgba(16, 185, 129, 0.1)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            {/* Card Header */}
            <div className="p-2 border-b border-emerald-700/30 bg-emerald-800/20 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Source Data</span>
              </div>
              <div className="flex gap-1">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
            </div>
            
            {/* Data Grid */}
            <div className="flex-1 p-2 relative">
              {/* Table header */}
              <div className="grid grid-cols-3 gap-1 mb-1">
                {["ID", "Name", "Value"].map((header, i) => (
                  <div 
                    key={`header-${i}`}
                    className="h-4 rounded-sm bg-emerald-800/40 px-1.5 flex items-center"
                  >
                    <span className="text-[0.6rem] text-emerald-300 font-medium">{header}</span>
                  </div>
                ))}
              </div>
              
              {/* Table rows */}
              <div className="grid grid-cols-1 gap-1">
                {[...Array(6)].map((_, rowIndex) => (
                  <motion.div 
                    key={`row-${rowIndex}`}
                    className="grid grid-cols-3 gap-1"
                    animate={{
                      backgroundColor: rowIndex === 2 ? ["rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.25)", "rgba(16, 185, 129, 0.1)"] : "transparent",
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {[...Array(3)].map((_, cellIndex) => (
                      <div 
                        key={`cell-${rowIndex}-${cellIndex}`}
                        className="h-3 rounded-sm bg-emerald-800/20 overflow-hidden"
                      >
                        <motion.div 
                          className="h-full w-full bg-emerald-700/20"
                          style={{ width: (Math.random() * 70 + 30) + "%" }}
                        />
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
              
              {/* Selection overlay */}
              <motion.div
                className="absolute inset-x-2 h-3 rounded-sm bg-emerald-500/25 border border-emerald-400/30"
                style={{ top: "calc(25% + 13px)" }}
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(16, 185, 129, 0)",
                    "0 0 8px rgba(16, 185, 129, 0.4)",
                    "0 0 0px rgba(16, 185, 129, 0)",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              
              {/* Scan line */}
              <motion.div
                className="absolute inset-x-2 h-0.5 bg-emerald-400/70"
                animate={{ top: ["15%", "90%", "15%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            </div>
            
            {/* Status indicators */}
            <div className="h-6 px-2 bg-emerald-800/20 border-t border-emerald-700/30 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                >
                  <RefreshCw size={10} className="text-emerald-400" />
                </motion.div>
                <span className="text-[0.6rem] text-emerald-300">Scanning</span>
              </div>
              <div className="text-[0.6rem] text-emerald-400 font-medium">6 records</div>
            </div>
          </motion.div>
          
          {/* Emission points */}
          <motion.div
            className="absolute right-0 top-1/3 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0px rgba(16, 185, 129, 0)",
                "0 0 10px rgba(16, 185, 129, 0.7)",
                "0 0 0px rgba(16, 185, 129, 0)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          
          <motion.div
            className="absolute right-0 top-2/3 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0px rgba(16, 185, 129, 0)",
                "0 0 10px rgba(16, 185, 129, 0.7)",
                "0 0 0px rgba(16, 185, 129, 0)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          />
        </motion.div>
        
        {/* Target Database - Right */}
        <motion.div
          className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {/* Target Card */}
          <motion.div
            className="w-36 h-40 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-900/90 to-indigo-950/90 border border-indigo-700/30 shadow-lg backdrop-blur-sm flex flex-col"
            animate={{
              y: [0, -4, 0],
              boxShadow: [
                "0 8px 16px -8px rgba(99, 102, 241, 0.1)",
                "0 12px 24px -8px rgba(99, 102, 241, 0.2)",
                "0 8px 16px -8px rgba(99, 102, 241, 0.1)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            {/* Card Header */}
            <div className="p-2 border-b border-indigo-700/30 bg-indigo-800/20 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Database size={14} className="text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300">Target DB</span>
              </div>
              <div className="flex gap-1">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <motion.div 
                  className="w-2 h-2 rounded-full bg-indigo-500"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                />
              </div>
            </div>
            
            {/* Database Visualization */}
            <div className="flex-1 p-2 relative">
              {/* Database tables */}
              <div className="space-y-2">
                {[...Array(3)].map((_, tableIndex) => (
                  <div key={`table-${tableIndex}`} className="space-y-0.5">
                    <div className="h-4 rounded-t-sm bg-indigo-800/40 px-1.5 flex items-center justify-between">
                      <span className="text-[0.6rem] text-indigo-300 font-medium">Table_{tableIndex + 1}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/70" />
                    </div>
                    <div className="h-1.5 bg-indigo-800/20 rounded-b-sm" />
                  </div>
                ))}
              </div>
              
              {/* Active area */}
              <motion.div
                className="absolute bottom-2 inset-x-2 h-10 rounded-sm bg-indigo-500/10 border border-indigo-500/30 p-1"
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(99, 102, 241, 0)",
                    "0 0 8px rgba(99, 102, 241, 0.4)",
                    "0 0 0px rgba(99, 102, 241, 0)",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {/* Table with incoming data */}
                <div className="h-full overflow-hidden">
                  <div className="grid grid-cols-3 gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={`header-active-${i}`} className="h-1.5 bg-indigo-700/40 rounded-sm" />
                    ))}
                  </div>
                  
                  <div className="mt-0.5 space-y-0.5">
                    {[...Array(3)].map((_, rowIndex) => (
                      <motion.div 
                        key={`active-row-${rowIndex}`}
                        className={`grid grid-cols-3 gap-0.5 ${rowIndex === 0 ? "opacity-100" : rowIndex === 1 ? "opacity-70" : "opacity-40"}`}
                        animate={rowIndex === 0 ? {
                          backgroundColor: ["rgba(99, 102, 241, 0)", "rgba(99, 102, 241, 0.2)", "rgba(99, 102, 241, 0)"],
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        {[...Array(3)].map((_, cellIndex) => (
                          <motion.div 
                            key={`active-cell-${rowIndex}-${cellIndex}`}
                            className="h-1.5 bg-indigo-700/30 rounded-sm overflow-hidden"
                            animate={rowIndex === 0 ? {
                              width: ["70%", "100%", "100%"],
                            } : {}}
                            transition={rowIndex === 0 ? {
                              repeat: Infinity, 
                              repeatDelay: 3,
                              duration: 0.5,
                              delay: cellIndex * 0.2,
                            } : {}}
                          />
                        ))}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Processing indicators */}
              <motion.div
                className="absolute right-1 top-1 w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                >
                  <ArrowDownUp size={8} className="text-indigo-400" />
                </motion.div>
              </motion.div>
            </div>
            
            {/* Status indicators */}
            <div className="h-6 px-2 bg-indigo-800/20 border-t border-indigo-700/30 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <motion.div
                  className="relative w-2 h-2"
                >
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-indigo-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }} 
                  />
                </motion.div>
                <span className="text-[0.6rem] text-indigo-300">Receiving</span>
              </div>
              <motion.div 
                className="text-[0.6rem] text-indigo-400 font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                4/6 records
              </motion.div>
            </div>
          </motion.div>
          
          {/* Receiving points */}
          <motion.div
            className="absolute left-0 top-1/3 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0px rgba(99, 102, 241, 0)",
                "0 0 10px rgba(99, 102, 241, 0.7)",
                "0 0 0px rgba(99, 102, 241, 0)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          
          <motion.div
            className="absolute left-0 top-2/3 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0px rgba(99, 102, 241, 0)",
                "0 0 10px rgba(99, 102, 241, 0.7)",
                "0 0 0px rgba(99, 102, 241, 0)",
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          />
        </motion.div>
        
        {/* Data streams - Multiple pathways */}
        {/* Stream 1 - Direct path */}
        {[...Array(8)].map((_, i) => {
          const isAlternate = i % 2 === 0;
          return (
            <motion.div
              key={`direct-stream-${i}`}
              className="absolute rounded-full"
              style={{
                width: isAlternate ? 3 : 2,
                height: isAlternate ? 3 : 2,
                backgroundColor: isAlternate ? "rgba(56, 189, 248, 0.9)" : "rgba(165, 180, 252, 0.9)",
              }}
              initial={{
                x: "28%",
                y: "33%",
                opacity: 0,
              }}
              animate={{
                x: "72%",
                y: "33%",
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut",
              }}
            />
          );
        })}
        
        {/* Stream 2 - Through neural network */}
        {[...Array(8)].map((_, i) => {
          const isAlternate = i % 2 === 0;
          return (
            <motion.div
              key={`neural-stream-${i}`}
              className="absolute rounded-full"
              style={{
                width: isAlternate ? 3 : 2,
                height: isAlternate ? 3 : 2,
                backgroundColor: isAlternate ? "rgba(16, 185, 129, 0.9)" : "rgba(14, 165, 233, 0.9)",
              }}
              initial={{
                x: "28%",
                y: "66%",
                opacity: 0,
              }}
              animate={{
                x: ["28%", "50%", "72%"],
                y: ["66%", "50%", "66%"],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }}
            />
          );
        })}
        
       
        
        {/* Analytics overlay elements */}
        <motion.div
          className="absolute left-0 top-0 mt-4 ml-4 flex items-center gap-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <motion.div
            className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 flex items-center gap-2"
            animate={{ backgroundColor: ["rgba(15, 23, 42, 0.6)", "rgba(15, 23, 42, 0.7)", "rgba(15, 23, 42, 0.6)"] }}
          transition={{ repeat: Infinity, duration: 3 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            >
              <ActivitySquare size={14} className="text-blue-400" />
            </motion.div>
            <span className="text-xs text-blue-300 font-medium">Data Flow: Active</span>
          </motion.div>
          
          <motion.div
            className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 flex items-center gap-2"
            animate={{ backgroundColor: ["rgba(15, 23, 42, 0.6)", "rgba(15, 23, 42, 0.7)", "rgba(15, 23, 42, 0.6)"] }}
            transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap size={14} className="text-amber-400" />
            </motion.div>
            <span className="text-xs text-amber-300 font-medium">Performance: Optimal</span>
          </motion.div>
        </motion.div>
        
        {/* Analytics overlay - right side */}
        <motion.div
          className="absolute right-0 top-0 mt-4 mr-4 flex items-center gap-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
        >
          <motion.div
            className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 flex items-center gap-2"
            animate={{ backgroundColor: ["rgba(15, 23, 42, 0.6)", "rgba(15, 23, 42, 0.7)", "rgba(15, 23, 42, 0.6)"] }}
            transition={{ repeat: Infinity, duration: 3, delay: 0.2 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ShieldCheck size={14} className="text-emerald-400" />
            </motion.div>
            <span className="text-xs text-emerald-300 font-medium">Security: Encrypted</span>
          </motion.div>
          
          <motion.div
            className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 flex items-center gap-2"
            animate={{ backgroundColor: ["rgba(15, 23, 42, 0.6)", "rgba(15, 23, 42, 0.7)", "rgba(15, 23, 42, 0.6)"] }}
            transition={{ repeat: Infinity, duration: 3, delay: 0.7 }}
          >
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            >
              <Clock size={14} className="text-purple-400" />
            </motion.div>
            <span className="text-xs text-purple-300 font-medium">Time: Optimized</span>
          </motion.div>
        </motion.div>
      </div>
    );
  };
  
  

  const toggleFileDetails = (id: string | number) => {
    const uploadId = id.toString(); // Ensure the ID is a string
    if (expandedFileId === uploadId) {
      setExpandedFileId(null);
      setLogs([]); // Clear logs when collapsing
    } else {
      setExpandedFileId(uploadId);
      setLogs([]); // Clear previous logs
      fetchLogs(uploadId); // Fetch logs for the selected file
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header with glowing effect */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative inline-block"
          >
            <motion.div
              className="absolute inset-0 bg-blue-300 rounded-full filter blur-xl opacity-20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
              Excel Upload
            </h1>
          </motion.div>
          <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
            Upload your spreadsheets and let our AI transform your data into
            actionable insights
          </p>
        </div>

        {/* New layout - File Upload on top */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                <Upload size={24} className="mr-3 text-blue-600" />
                File Processor
              </h2>
              <p className="text-gray-500 text-base mb-8">
                Upload Excel files for intelligent data extraction and
                processing
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Upload Area - Larger */}
                <div className="lg:col-span-3">
                  <label
                    htmlFor="file-upload"
                    className={`relative flex flex-col items-center justify-center h-56 border-3 border-dashed rounded-xl cursor-pointer transition-all
                      ${
                        file
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }
                    `}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="sr-only"
                      disabled={isUploading}
                    />

                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div
                        className={`mb-4 p-4 rounded-full ${
                          file ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <FileSpreadsheet
                          size={48}
                          className={`${
                            file ? "text-blue-600" : "text-gray-400"
                          }`}
                        />
                      </div>

                      <span
                        className={`text-lg font-medium ${
                          file ? "text-blue-700" : "text-gray-600"
                        }`}
                      >
                        {file
                          ? file.name
                          : "Drag and drop or click to select Excel file"}
                      </span>

                      {file ? (
                        <span className="text-sm text-gray-500 mt-2">
                          {formatFileSize(file.size)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 mt-2">
                          Supports only .xlsx and files
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Warning Message */}
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start"
                    >
                      <AlertTriangle
                        className="text-amber-500 mr-3 mt-0.5 flex-shrink-0"
                        size={20}
                      />
                      <div>
                        <p className="font-medium text-amber-700">
                          Do not refresh the page!
                        </p>
                        <p className="text-amber-600 text-sm mt-1">
                          Refreshing during extraction may interrupt the process
                          and cause data loss.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Status Area */}
                <div className="lg:col-span-2">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start"
                    >
                      <AlertCircle
                        className="mr-3 mt-0.5 flex-shrink-0"
                        size={20}
                      />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {uploadResult && !isUploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-lg"
                    >
                      <div className="flex items-center mb-3">
                        <CheckCircle className="mr-3" size={20} />
                        <p className="font-medium text-lg">
                          File processed successfully!
                        </p>
                      </div>
                      <div className="pl-8 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Records processed:</span>
                          <span className="font-medium">
                            {uploadResult.stats?.billsCreated || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Items created:</span>
                          <span className="font-medium">
                            {uploadResult.stats?.itemsCreated || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className={`w-full py-4 px-6 rounded-xl text-white font-medium text-lg flex items-center justify-center transition-all
                      ${
                        !file || isUploading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={20} className="mr-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="mr-3" />
                        Upload and Process
                      </>
                    )}
                  </button>

                  {/* Processing requirements */}
                  {!isUploading && !uploadResult && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">
                        Processing Requirements:
                      </h4>
                      <ul className="text-xs text-blue-600 space-y-1.5">
                        <li className="flex items-start">
                          <CheckCircle
                            size={12}
                            className="mr-2 mt-0.5 flex-shrink-0"
                          />
                          <span>
                            Excel files must have proper column headers
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle
                            size={12}
                            className="mr-2 mt-0.5 flex-shrink-0"
                          />
                          <span>Maximum file size: 10MB</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle
                            size={12}
                            className="mr-2 mt-0.5 flex-shrink-0"
                          />
                          <span>Processing time varies based on data size</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Animation Section */}
            {isUploading && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {renderDataExtractionAnimation()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* History Section - Full width below */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Clock size={24} className="mr-3 text-blue-600" />
                  Upload History
                </h2>
                <p className="text-gray-500 mt-1">
                  View and manage your previously processed files
                </p>
              </div>
              <div className="flex space-x-3 items-center">
                <button
                  onClick={fetchUploadHistory}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Refresh history"
                >
                  <RefreshCw size={16} />
                </button>
                <div className="flex overflow-hidden bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("recent")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "recent"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === "all"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    All Files
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <RefreshCw
                    size={32}
                    className="text-blue-600 animate-spin mx-auto mb-4"
                  />
                  <p className="text-gray-500">Loading history...</p>
                </div>
              </div>
            ) : uploadHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-gray-50 rounded-xl">
                <FileText size={64} className="text-gray-300 mb-4" />
                <p className="mb-2 text-lg font-medium">
                  No upload history found
                </p>
                <p className="text-sm">
                  Upload your first Excel file to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto max-h-[550px] pr-2 custom-scrollbar">
                {uploadHistory.map((history) => (
                  <motion.div
                    key={history.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gray-200 hover:border-blue-200 overflow-hidden transition-all hover:shadow-md"
                  >
                    <div
                      className="p-4 cursor-pointer bg-gradient-to-r from-white to-gray-50"
                      onClick={() => toggleFileDetails(history.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4 flex-shrink-0">
                            <FileSpreadsheet size={28} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800 text-lg">
                              {history.fileName}
                            </h3>
                            <div className="flex items-center mt-1">
                              <Clock size={12} className="text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">
                                {new Date(history.uploadDate).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                              history.status
                            )} flex items-center`}
                          >
                            {getStatusIcon(history.status)}
                            {history.status}
                          </span>
                          {history.fileUrl && (
                            <a
                              href={history.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Download File"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"></button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details section */}
                    <AnimatePresence>
                      {expandedFileId === history.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="p-4 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="p-4 bg-white rounded-lg border border-gray-100">
                                <div className="flex items-center text-gray-500 mb-1 text-xs">
                                  <Database size={12} className="mr-1" />
                                  <span>Records Processed</span>
                                </div>
                                <div className="text-lg font-semibold text-gray-800">
                                  {history.recordsProcessed || 0}
                                </div>
                              </div>
                              <div className="p-4 bg-white rounded-lg border border-gray-100">
                                <div className="flex items-center text-gray-500 mb-1 text-xs">
                                  <BarChart size={12} className="mr-1" />
                                  <span>Items Created</span>
                                </div>
                                <div className="text-lg font-semibold text-gray-800">
                                  {history.itemsCreated || 0}
                                </div>
                              </div>
                            </div>
                             {/* Logs Section */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Logs</h4>
          <div className="bg-white rounded-lg border border-gray-100 p-4 max-h-40 overflow-y-auto custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs available yet...</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="text-sm text-gray-700">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleDeleteHistory(history.id)} // Pass the history ID to delete a specific record
                                className="flex items-center text-xs text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 size={12} className="mr-1" />
                                Delete Record
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
