import { useNavigate } from 'react-router-dom';
import BulkUploadComponent from '../components/BulkUpload';

export default function BulkUpload() {
  const navigate = useNavigate();
  
  return (
    <BulkUploadComponent 
      onBack={() => navigate('/workers')}
    />
  );
}