import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, UserPlus, List, Grid } from 'lucide-react';
import AddCustomerPage from './NewCustomerModal';
import NewTelecallingCustomersPage from './NewCuList';

const TelecallingCustomersPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Function to determine active tab from URL
  const getActiveTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab === 'add' ? 'add' : 'list';
  };
  
  const [activeTab, setActiveTab] = useState<'list' | 'add'>(getActiveTabFromUrl());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Listen for URL changes to update the active tab
  useEffect(() => {
    const currentTab = getActiveTabFromUrl();
    setActiveTab(currentTab);
  }, [location.search]);

  const handleTabChange = (tab: 'list' | 'add') => {
    setActiveTab(tab);
    
    // Update URL without page reload, and prevent default navigation
    const newUrl = `/telecalling/customers?tab=${tab}`;
    navigate(newUrl, { replace: true });
  };

  // Debug information
  console.log("Current active tab:", activeTab);
  console.log("Current URL search:", location.search);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Telecalling Customers</h1>
          <p className="text-gray-600 mt-1">Manage customers for telecalling activities</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex flex-wrap -mb-px">
            <button
              type="button" // Explicitly set button type
              onClick={(e) => {
                e.preventDefault(); // Prevent default navigation
                handleTabChange('list');
              }}
              className={`inline-flex items-center px-4 py-3 mr-4 text-sm font-medium border-b-2 ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="mr-2 h-5 w-5" />
              New Customers List
            </button>
            <button
              type="button" // Explicitly set button type
              onClick={(e) => {
                e.preventDefault(); // Prevent default navigation
                handleTabChange('add');
              }}
              className={`inline-flex items-center px-4 py-3 mr-4 text-sm font-medium border-b-2 ${
                activeTab === 'add'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Add New Customers
            </button>

            {/* View mode toggle (shown only in list tab) */}
            {activeTab === 'list' && (
              <div className="ml-auto flex items-center space-x-2">
                <span className="text-sm text-gray-500">View:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'list' ? (
            <div className="transition-opacity duration-200 ease-in-out">
              <NewTelecallingCustomersPage viewMode={viewMode} />
            </div>
          ) : (
            <div className="transition-opacity duration-200 ease-in-out">
              <AddCustomerPage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelecallingCustomersPage;