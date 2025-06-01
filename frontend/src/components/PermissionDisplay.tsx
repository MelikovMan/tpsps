import { useUserPermissions } from '../api/auth';

export default function PermissionDisplay() {
  const { data } = useUserPermissions();
  
  return (
    <div>
      <h2>Your Role: {data?.role}</h2>
      <ul>
        <li>Can edit: {data?.can_edit ? 'Yes' : 'No'}</li>
        <li>Can delete: {data?.can_delete ? 'Yes' : 'No'}</li>
        <li>Can moderate: {data?.can_moderate ? 'Yes' : 'No'}</li>
      </ul>
    </div>
  );
}