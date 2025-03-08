import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StoreCard from './StoreCard';
import './StoreDashboard.css';

interface Store {
  id: string;
  name: string;
  currentDate: string;
  dataUploaded: string;
  lastUpdated: string;
}

const StoreDashboard: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/stores/upload-status');
        if (Array.isArray(response.data)) {
          setStores(response.data);
        } else {
          setError('Unexpected response format');
        }
      } catch (err) {
        setError('Error fetching store data');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading store data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-title">Error</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Store Dashboard</h1>
        <p className="dashboard-subtitle">Monitor your stores' data upload status</p>
      </div>
      <div className="cards-grid">
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            id={store.id}
            name={store.name}
            currentDate={store.currentDate}
            dataUploaded={store.dataUploaded}
            lastUpdated={store.lastUpdated}
          />
        ))}
      </div>
      <div className="dashboard-footer">
        Updated as of {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default StoreDashboard;