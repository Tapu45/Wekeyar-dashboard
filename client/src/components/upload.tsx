import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Clock, Database } from "lucide-react";
import FileUpload from "./UploadPage";
import UploadStatusPage from "./UploadStatusPage";
import ProductUploadPage from "./ProductUpload";

const UploadManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "status" | "products">("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
      

        {/* Tab Navigation */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-xl p-2 shadow-md flex flex-wrap justify-center gap-2 border border-blue-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("upload")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "upload"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Upload size={18} />
              <span className="font-medium">Upload Files</span>
              {activeTab === "upload" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 -z-10"
                  initial={false}
                />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("products")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "products"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Database size={18} />
              <span className="font-medium">Product Upload</span>
              {activeTab === "products" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 -z-10"
                  initial={false}
                />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("status")}
              className={`relative px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                activeTab === "status"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Clock size={18} />
              <span className="font-medium">Upload Status</span>
              {activeTab === "status" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 -z-10"
                  initial={false}
                />
              )}
            </motion.button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FileUpload />
            </motion.div>
          ) : activeTab === "products" ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProductUploadPage />
            </motion.div>
          ) : (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <UploadStatusPage />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadManager;