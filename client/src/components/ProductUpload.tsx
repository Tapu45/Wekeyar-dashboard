import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, AlertTriangle, FileSpreadsheet, Database, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import api, { API_ROUTES } from "../utils/api";

const ProductUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setErrors([]);
      setUploadStatus(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file to upload");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      setIsUploading(true);
      setUploadStatus("Uploading...");
      
      const response = await api.post(API_ROUTES.PRODUCT_UPLOAD, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Simulate longer processing time to show animation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setUploadStatus(response.data.message || "Upload successful!");
      setErrors(response.data.errors || []);
    } catch (error: any) {
      setUploadStatus("Upload failed");
      setErrors([error.response?.data?.error || "An unknown error occurred"]);
    } finally {
      setIsUploading(false);
    }
  };
  
  const dragVariants = {
    initial: { opacity: 0.6, scale: 0.95 },
    hover: { 
      opacity: 1, 
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" 
    }
  };
  
  const uploadAnimationVariants = {
    animate: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };
  
  const fileIconVariants = {
    initial: { x: -50, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };
  
  const robotIconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  
  
  const spinTransition = {
    loop: Infinity,
    ease: "linear",
    duration: 1
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Product Upload</h1>
      
      {/* File Upload Area */}
      <motion.div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer
          ${selectedFile ? 'border-green-400 bg-green-50' : 'border-blue-300 bg-blue-50'}`}
        variants={dragVariants}
        initial="initial"
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet size={48} className="text-green-500 mb-2" />
              <p className="text-lg font-medium text-green-600">{selectedFile.name}</p>
              <p className="text-sm text-green-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={48} className="text-blue-500 mb-2" />
              <p className="text-lg font-medium text-blue-600">
                Drag and drop your file here or click to browse
              </p>
              <p className="text-sm text-blue-500 mt-1">
                Only Excel files (.xlsx, .xls) are supported
              </p>
            </div>
          )}
        </label>
      </motion.div>
      
      {/* Warning Notes */}
      <div className="mb-6 space-y-3">
        <motion.div 
          className="flex items-start p-3 bg-amber-50 border border-amber-200 rounded-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0 mt-1" size={18} />
          <p className="text-amber-700 text-sm">
            <span className="font-semibold">Don't refresh the page</span> during file upload. This could lead to data corruption or incomplete uploads.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex items-start p-3 bg-amber-50 border border-amber-200 rounded-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0 mt-1" size={18} />
          <p className="text-amber-700 text-sm">
            <span className="font-semibold">Only Excel files</span> (.xlsx, .xls) are supported. Other file formats will be rejected.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex items-start p-3 bg-amber-50 border border-amber-200 rounded-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0 mt-1" size={18} />
          <p className="text-amber-700 text-sm">
            <span className="font-semibold">Follow template structure</span>. Ensure your file follows the required template structure to avoid errors during import.
          </p>
        </motion.div>
      </div>
      
      {/* Upload Button */}
      <motion.button
        onClick={handleUpload}
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition flex items-center justify-center font-medium text-lg"
        disabled={isUploading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isUploading ? (
          <span className="flex items-center">
            <motion.span
              animate={{ rotate: 360 }}
              transition={spinTransition}
              className="mr-2"
            >
              <RefreshCw size={20} />
            </motion.span>
            Processing...
          </span>
        ) : (
          <span className="flex items-center">
            <Upload size={20} className="mr-2" />
            Upload Products
          </span>
        )}
      </motion.button>
      
      {/* Animation during upload */}
      {isUploading && (
        <motion.div 
          className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100"
          initial="initial"
          animate="animate"
          variants={uploadAnimationVariants}
        >
          <h3 className="text-center font-semibold text-blue-700 mb-6">
             Processing Your Product Data
          </h3>
          
          <div className="flex justify-between items-center">
            <motion.div variants={fileIconVariants} className="text-center">
              <FileSpreadsheet size={36} className="mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-blue-600">Excel File</p>
            </motion.div>
            
            <motion.div 
              className="flex-1 mx-4 relative h-1 bg-blue-100 rounded"
            >
              <motion.div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
              />
            </motion.div>
            
            <motion.div variants={robotIconVariants} className="text-center">
              <motion.div
                animate={{ 
                  y: [0, -5, 0, -5, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              >
                <Database size={36} className="mx-auto text-blue-600 mb-2" />
              </motion.div>
              <p className="text-sm text-blue-600">Database</p>
            </motion.div>
          </div>
          
          <motion.p 
            className="text-center mt-6 text-blue-700 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
             extracting and validating your product data...
          </motion.p>
        </motion.div>
      )}
      
      {/* Status and Error Messages */}
      {uploadStatus && !isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`mt-6 p-4 rounded-md ${
            uploadStatus.includes("successful")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } flex items-start`}
        >
          {uploadStatus.includes("successful") ? (
            <CheckCircle size={20} className="mr-2 flex-shrink-0 mt-0.5 text-green-600" />
          ) : (
            <XCircle size={20} className="mr-2 flex-shrink-0 mt-0.5 text-red-600" />
          )}
          <span className="font-medium">{uploadStatus}</span>
        </motion.div>
      )}
      
      {errors.length > 0 && (
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-red-600 flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            Errors:
          </h2>
          <ul className="mt-2 space-y-1">
            {errors.map((error, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-red-600 flex items-start"
              >
                <span className="mr-2 text-red-500">•</span>
                {error}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ProductUploadPage;