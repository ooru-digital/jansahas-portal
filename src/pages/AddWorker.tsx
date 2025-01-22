import { useNavigate } from 'react-router-dom';
import AddWorkerComponent from '../components/AddWorker';

export default function AddWorker() {
  const navigate = useNavigate();
  
  return (
    <AddWorkerComponent 
      onBack={() => navigate('/workers')}
      onWorkerAdded={() => navigate('/workers')}
    />
  );
}