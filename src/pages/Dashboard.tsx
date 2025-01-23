import { useNavigate } from 'react-router-dom';
import DashboardComponent from '../components/Dashboard';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleNavigate = (view: 'dashboard' | 'workers' | 'approvals') => {
    navigate(`/${view}`);
  };

  return <DashboardComponent onNavigate={handleNavigate} />;
}