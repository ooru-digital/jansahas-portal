import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkHistoryView from '../components/WorkHistoryView';

export default function WorkerDetails() {
  const { workerId } = useParams();
  const navigate = useNavigate();

  if (!workerId) {
    return null;
  }

  return (
    <WorkHistoryView 
      workerId={parseInt(workerId, 10)} 
      onBack={() => navigate('/workers')} 
    />
  );
}