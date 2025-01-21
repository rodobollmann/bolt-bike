import React from 'react';
    import { Routes, Route } from 'react-router-dom';
    import MaintenanceForm from './MaintenanceForm';
    import ClientList from './ClientList';

    function App() {
      return (
        <Routes>
          <Route path="/" element={<ClientList />} />
          <Route path="/edit/:clientId" element={<MaintenanceForm />} />
          <Route path="/new" element={<MaintenanceForm />} />
        </Routes>
      );
    }

    export default App;
