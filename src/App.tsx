import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Converter from './pages/Converter';
import ApiDocs from './pages/ApiDocs';
import PrivacyPolicy from './pages/PrivacyPolicy';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Converter />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
    </Routes>
  );
}
