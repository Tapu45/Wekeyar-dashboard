import React from 'react';
import StoreDashboard from './Store';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Store Dashboard</h1>
      </header>
      <StoreDashboard />
    </div>
  );
};

export default App;