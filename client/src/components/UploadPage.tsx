import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileCheck,
  Cpu
} from 'lucide-react';
import  { API_ROUTES,} from '../utils/api';
import api from '../utils/api';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

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
      console.error('Error fetching upload history:', err);
      setError('Failed to fetch upload history');
      // Ensure uploadHistory is still an array even on error
      setUploadHistory([]);
    } finally {
      setIsLoading(false);
    }
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
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const response = await api.post(API_ROUTES.UPLOAD, formData, { // Use the `api` instance and `API_ROUTES.UPLOAD`
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult(response.data);
      fetchUploadHistory();

      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'An error occurred during upload');
    } finally {
      setTimeout(() => setIsUploading(false), 1000); // Add slight delay for animation
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={14} className="mr-1" />;
      case 'processing':
        return <RefreshCw size={14} className="mr-1 animate-spin" />;
      case 'failed':
        return <AlertCircle size={14} className="mr-1" />;
      default:
        return <Clock size={14} className="mr-1" />;
    }
  };

  const renderDataExtractionAnimation = () => {
    return (
      <div className="relative h-96 w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-800 shadow-lg mb-6">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        {/* Floating particles in background */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-blue-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
  
        {/* Advanced AI Data Processor */}
        <motion.div 
          className="absolute left-10 top-1/2 transform -translate-y-1/2 flex flex-col items-center"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* AI Core */}
          <div className="relative">
            <motion.div
              className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg relative overflow-hidden"
              animate={{ 
                boxShadow: [
                  "0 0 10px 2px rgba(99, 102, 241, 0.3)", 
                  "0 0 20px 5px rgba(99, 102, 241, 0.6)", 
                  "0 0 10px 2px rgba(99, 102, 241, 0.3)"
                ]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
              }}
            >
              {/* CPU Glow Effect */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Cpu size={48} className="text-white" strokeWidth={1} />
              </motion.div>
              
              {/* Scanning Effect - Horizontal */}
              <motion.div
                className="absolute inset-x-0 h-1 bg-blue-300 opacity-60"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              />
              
              {/* Scanning Effect - Vertical */}
              <motion.div
                className="absolute inset-y-0 w-1 bg-blue-300 opacity-60"
                animate={{ left: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 0.5 }}
              />
              
              {/* Pulsing Core */}
              <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-indigo-500"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              
              {/* Digital Circuits */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`circuit-${i}`}
                  className="absolute h-0.5 bg-blue-300"
                  style={{
                    width: 40 + Math.random() * 20,
                    top: `${(i * 12) + 10}%`,
                    left: i % 2 === 0 ? "10%" : "50%",
                    opacity: 0.6,
                  }}
                  animate={{ 
                    opacity: [0.3, 0.8, 0.3],
                    width: [(40 + Math.random() * 20), (60 + Math.random() * 20), (40 + Math.random() * 20)],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2 + Math.random(),
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            className="text-white text-center mt-4 font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Quantum Data Processor</div>
            <div className="text-sm">AI-Enhanced Extraction Engine</div>
          </motion.div>
        </motion.div>
  
        {/* Central Data Flow Pipeline */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2/5 h-12">
          {/* Pipeline */}
          <motion.div
            className="absolute inset-0 h-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full overflow-hidden border border-blue-400/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {/* Pulse flowing through pipeline */}
            <motion.div
              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
              animate={{ left: ["-100px", "100%"] }}
              transition={{ 
                repeat: Infinity,
                duration: 1.8,
                ease: "linear",
                delay: 1
              }}
            />
          </motion.div>
          
          {/* Connection points */}
          <motion.div
            className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-400"
            animate={{ 
              boxShadow: [
                "0 0 0px rgba(96, 165, 250, 0.5)", 
                "0 0 10px rgba(96, 165, 250, 0.8)", 
                "0 0 0px rgba(96, 165, 250, 0.5)"
              ] 
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          
          <motion.div
            className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-400"
            animate={{ 
              boxShadow: [
                "0 0 0px rgba(129, 140, 248, 0.5)", 
                "0 0 10px rgba(129, 140, 248, 0.8)", 
                "0 0 0px rgba(129, 140, 248, 0.5)"
              ] 
            }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
          />
        </div>
  
        {/* Excel File Source */}
        <motion.div 
          className="absolute left-[20%] top-1/2 transform -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <motion.div
            className="relative w-24 h-28 bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-lg overflow-hidden flex flex-col"
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, 1, 0, -1, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          >
            {/* File Header */}
            <div className="h-6 bg-green-800 flex items-center justify-center">
              <FileSpreadsheet size={14} className="text-white" />
            </div>
            
            {/* File Body with glowing rows */}
            <div className="flex-1 p-1 relative">
              {/* Static grid background */}
              <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-1">
                {[...Array(5)].map((_, i) => (
                  <React.Fragment key={`grid-row-${i}`}>
                    {[...Array(3)].map((_, j) => (
                      <div 
                        key={`grid-cell-${i}-${j}`}
                        className="h-4 bg-green-800/30 rounded-sm"
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Animated scan lines */}
              <motion.div
                className="absolute inset-x-1 h-4 bg-green-300/30 rounded-sm"
                animate={{ 
                  top: ["4%", "90%", "4%"],
                  opacity: [0.3, 0.6, 0.3], 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2.5,
                  ease: "easeInOut",
                }}
              />
              
              {/* Selection Animation */}
              <motion.div
                className="absolute inset-x-1 top-[30%] h-4 bg-green-400/40 rounded-sm border border-green-300/40"
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  boxShadow: [
                    "0 0 0px rgba(74, 222, 128, 0)", 
                    "0 0 4px rgba(74, 222, 128, 0.5)", 
                    "0 0 0px rgba(74, 222, 128, 0)"
                  ]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="text-emerald-400 text-center mt-3 font-medium text-sm"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Source Data
          </motion.div>
        </motion.div>
  
        {/* Database Target */}
        <motion.div 
          className="absolute right-[20%] top-1/2 transform -translate-y-1/2 translate-x-1/2 flex flex-col items-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          {/* Database with glow effect */}
          <motion.div
            className="relative"
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, -1, 0, 1, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          >
            <motion.div
              className="text-indigo-400"
              animate={{ 
                filter: [
                  "drop-shadow(0 0 2px rgba(129, 140, 248, 0.5))",
                  "drop-shadow(0 0 8px rgba(129, 140, 248, 0.8))",
                  "drop-shadow(0 0 2px rgba(129, 140, 248, 0.5))"
                ]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Database size={48} strokeWidth={1.5} />
            </motion.div>
            
            {/* Processing indicators */}
            <motion.div
              className="absolute -right-2 -top-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs"
              animate={{ 
                backgroundColor: ["#6366f1", "#818cf8", "#6366f1"],
                scale: [1, 1.1, 1],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <FileCheck size={12} />
            </motion.div>
          </motion.div>
          
          {/* Data stream entry point */}
          <motion.div
            className="absolute -left-10 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full"
            animate={{ 
              boxShadow: [
                "0 0 0px rgba(99, 102, 241, 0)", 
                "0 0 10px 5px rgba(99, 102, 241, 0.6)", 
                "0 0 0px rgba(99, 102, 241, 0)"
              ] 
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          
          <motion.div 
            className="text-indigo-400 text-center mt-3 font-medium text-sm"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Target Database
          </motion.div>
        </motion.div>
  
        {/* Data streams */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`data-stream-${i}`}
            className="absolute rounded-full"
            style={{
              background: i % 3 === 0 
                ? "rgba(165, 180, 252, 0.8)" 
                : i % 3 === 1 
                  ? "rgba(129, 140, 248, 0.8)" 
                  : "rgba(99, 102, 241, 0.8)",
              width: 2 + (i % 3) * 2,
              height: 2 + (i % 3) * 2,
            }}
            initial={{ 
              x: "25%", 
              y: "50%",
              scale: 0,
              opacity: 0,
            }}
            animate={{ 
              x: "75%",
              y: ["48%", "52%", "48%"],
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{ 
              repeat: Infinity,
              duration: 1.2 + (i % 3) * 0.4,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
  
        {/* Status indicator */}
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center">
          <motion.div 
            className="text-blue-100 text-sm font-medium flex items-center mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mr-2"
            >
              <RefreshCw size={14} className="text-blue-300" />
            </motion.div>
            <span>Processing Data Extraction</span>
          </motion.div>
  
          {/* Progress bar */}
          <motion.div
            className="w-64 h-1.5 bg-blue-900/50 rounded-full overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500"
              animate={{ width: ["5%", "95%"], left: 0 }}
              transition={{ 
                duration: 3.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                times: [0, 1]
              }}
            />
          </motion.div>
  
          {/* Processing stats */}
          <motion.div 
            className="flex space-x-8 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {[
              { label: "Files", value: "8/12" },
              { label: "Records", value: "1,548" },
              { label: "Speed", value: "253/s" }
            ].map((stat, i) => (
              <div key={`stat-${i}`} className="text-center">
                <motion.div 
                  className="text-xs text-blue-300 font-medium"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                >
                  {stat.label}
                </motion.div>
                <motion.div 
                  className="text-sm text-blue-100"
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                >
                  {stat.value}
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  };

  const toggleFileDetails = (id: string) => {
    if (expandedFileId === id) {
      setExpandedFileId(null);
    } else {
      setExpandedFileId(id);
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
            Upload your spreadsheets and let our AI transform your data into actionable insights
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
              <p className="text-gray-500 text-base mb-8">Upload Excel files for intelligent data extraction and processing</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Upload Area - Larger */}
                <div className="lg:col-span-3">
                  <label 
                    htmlFor="file-upload" 
                    className={`relative flex flex-col items-center justify-center h-56 border-3 border-dashed rounded-xl cursor-pointer transition-all
                      ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
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
                      <div className={`mb-4 p-4 rounded-full ${file ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <FileSpreadsheet
                          size={48}
                          className={`${file ? 'text-blue-600' : 'text-gray-400'}`}
                        />
                      </div>
                      
                      <span className={`text-lg font-medium ${file ? 'text-blue-700' : 'text-gray-600'}`}>
                        {file ? file.name : 'Drag and drop or click to select Excel file'}
                      </span>
                      
                      {file ? (
                        <span className="text-sm text-gray-500 mt-2">
                          {formatFileSize(file.size)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 mt-2">
                          Supports .xlsx and .xls files
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
                      <AlertTriangle className="text-amber-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
                      <div>
                        <p className="font-medium text-amber-700">Do not refresh the page!</p>
                        <p className="text-amber-600 text-sm mt-1">
                          Refreshing during extraction may interrupt the process and cause data loss.
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
                      <AlertCircle className="mr-3 mt-0.5 flex-shrink-0" size={20} />
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
                        <p className="font-medium text-lg">File processed successfully!</p>
                      </div>
                      <div className="pl-8 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Records processed:</span>
                          <span className="font-medium">{uploadResult.stats?.billsCreated || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Items created:</span>
                          <span className="font-medium">{uploadResult.stats?.itemsCreated || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className={`w-full py-4 px-6 rounded-xl text-white font-medium text-lg flex items-center justify-center transition-all
                      ${!file || isUploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
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
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Processing Requirements:</h4>
                      <ul className="text-xs text-blue-600 space-y-1.5">
                        <li className="flex items-start">
                          <CheckCircle size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span>Excel files must have proper column headers</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span>Maximum file size: 10MB</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span>Processing time varies based on data complexity</span>
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
                  animate={{ opacity: 1, height: 'auto' }}
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
                <p className="text-gray-500 mt-1">View and manage your previously processed files</p>
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
                    onClick={() => setActiveTab('recent')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'recent' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'all' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
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
                  <RefreshCw size={32} className="text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading history...</p>
                </div>
              </div>
            ) : uploadHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-gray-50 rounded-xl">
                <FileText size={64} className="text-gray-300 mb-4" />
                <p className="mb-2 text-lg font-medium">No upload history found</p>
                <p className="text-sm">Upload your first Excel file to get started</p>
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
                            <h3 className="font-medium text-gray-800 text-lg">{history.fileName}</h3>
                            <div className="flex items-center mt-1">
                              <Clock size={12} className="text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">
                                {new Date(history.uploadDate).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(history.status)} flex items-center`}>
                            {getStatusIcon(history.status)}
                            {history.status}
                          </span>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded details section */}
                    <AnimatePresence>
                      {expandedFileId === history.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
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
                            <div className="flex justify-end mt-2">
                              <button onClick={() => handleDeleteHistory(history.id)} // Pass the history ID to delete a specific record
                              className="flex items-center text-xs text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors">
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