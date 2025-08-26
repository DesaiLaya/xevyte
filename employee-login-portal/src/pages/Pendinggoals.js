import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


const EmployeeGoalDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmployeeId = location.state?.employeeId || localStorage.getItem('selectedEmployeeId');
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.employeeId && location.state.employeeId !== employeeId) {
      setEmployeeId(location.state.employeeId);
    }
  }, [location.state?.employeeId, employeeId]);

  useEffect(() => {
    if (employeeId) {
      localStorage.setItem('selectedEmployeeId', employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) {
      setError('Selected employee ID not found.');
      setLoading(false);
      return;
    }

    const fetchEmployeeGoals = async () => {
      try {
        let rawToken = localStorage.getItem('token');

        if (!rawToken) {
          throw new Error('No token found in localStorage. Please login.');
        }

        // Remove quotes if token has them
        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          rawToken = rawToken.slice(1, -1);
        }

        const token = `Bearer ${rawToken}`;
        console.log('Using token:', token);

        const response = await fetch(`http://localhost:8082/api/goals/employee/${employeeId}`, {
          method: 'GET',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error fetching goals: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log('Goals data:', data);
        setGoals(data);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeGoals();
  }, [employeeId]);

  // Filter goals to show only pending ones
  const pendingGoals = goals.filter(goal => goal.status?.toLowerCase() === 'pending');

  return (
    <div className="employee-goal-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h2>
        Goals for Employee ID: <span style={{ backgroundColor: 'yellow' }}>{employeeId}</span>
      </h2>

      {loading && <p>Loading goals...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && pendingGoals.length === 0 && (
        <p>No pending goals found for this employee.</p>
      )}

      {!loading && !error && pendingGoals.length > 0 && (
        <table className="goal-table">
          <thead>
            <tr>
              <th>Goal ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Target Date</th>
              <th>Quarter</th>
            </tr>
          </thead>
          <tbody>
            {pendingGoals.map(goal => (
              <tr key={goal.goalId}>
                <td>{goal.goalId}</td>
                <td>{goal.goalTitle}</td>
                <td>{goal.goalDescription}</td>
                <td>{goal.status}</td>
                <td>{goal.startDate}</td>
                <td>{goal.endDate}</td>
                <td>{goal.targetDate}</td>
                <td>{goal.quarter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeeGoalDetails;
