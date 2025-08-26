import React from 'react';
import { useFormData } from '../context/FormDataContext';
import '../styles/FormSubmissions.css';

const FormSubmissions = () => {
  const { getSortedSubmissions, sortSubmissions, sortConfig } = useFormData();
  const submissions = getSortedSubmissions();

  const handleSort = (key) => {
    sortSubmissions(key);
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  if (submissions.length === 0) {
    return <div className="no-submissions">אין נתונים להצגה</div>;
  }

  return (
    <div className="form-submissions">
      <h2>נרשמים</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('full_name')}>
                שם מלא {renderSortIcon('full_name')}
              </th>
              <th onClick={() => handleSort('username')}>
                שם משתמש {renderSortIcon('username')}
              </th>
              <th onClick={() => handleSort('email')}>
                אימייל {renderSortIcon('email')}
              </th>
              <th onClick={() => handleSort('phone_number')}>
                טלפון {renderSortIcon('phone_number')}
              </th>
              <th onClick={() => handleSort('timestamp')}>
                תאריך {renderSortIcon('timestamp')}
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.full_name}</td>
                <td>{submission.username}</td>
                <td>{submission.email}</td>
                <td>{submission.phone_number || '-'}</td>
                <td>{new Date(submission.timestamp).toLocaleString('he-IL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormSubmissions;
