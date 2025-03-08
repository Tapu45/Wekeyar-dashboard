import React from 'react';
import './StoreCard.css';

interface StoreCardProps {
  id: string;
  name: string;
  currentDate: string;
  dataUploaded: string;
  lastUpdated: string;
}

const StoreCard: React.FC<StoreCardProps> = ({ name, currentDate, dataUploaded, lastUpdated }) => {
  // Determine if data is uploaded based on the value
  const isDataUploaded = dataUploaded.toLowerCase() === 'yes' || 
                         dataUploaded.toLowerCase() === 'uploaded';
  
  return (
    <div className={`store-card ${isDataUploaded ? 'store-card-uploaded' : 'store-card-not-uploaded'}`}>
      <h3>{name}</h3>
      <div className="store-card-content">
        <div className="store-card-field">
          <span className="store-card-label">Current Date:</span>
          <span className="store-card-value">{currentDate}</span>
        </div>
        <div className="store-card-field">
          <span className="store-card-label">Data Uploaded:</span>
          <span className={`status-indicator ${isDataUploaded ? 'status-uploaded' : 'status-not-uploaded'}`}>
            {isDataUploaded ? 'Uploaded' : 'Not Uploaded'}
          </span>
        </div>
        <div className="store-card-field">
          <span className="store-card-label">Last Updated:</span>
          <span className="store-card-value">{lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;