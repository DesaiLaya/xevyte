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

  // Track which goal is currently being reviewed and feedback input
  const [reviewingGoalId, setReviewingGoalId] = useState(null);
  const [feedbackInput, setFeedbackInput] = useState('');

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

    fetchEmployeeGoals();
  }, [employeeId]);

  const fetchEmployeeGoals = async () => {
    setLoading(true);
    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found in localStorage. Please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }
      const token = `Bearer ${rawToken}`;

      const response = await fetch(`http://localhost:8082/api/goals/employee/${employeeId}`, {
        method: 'GET',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error fetching goals: ${response.status} - ${text}`);
      }

      const data = await response.json();
      setGoals(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update status and feedback on backend and then locally
  const handleFeedbackSubmit = async (goalId) => {
    if (!feedbackInput.trim()) {
      alert('Feedback is required.');
      return;
    }

    try {
      let rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error('No token found in localStorage. Please login.');
      if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
        rawToken = rawToken.slice(1, -1);
      }
      const token = `Bearer ${rawToken}`;

     const response = await fetch(`http://localhost:8082/api/goals/${goalId}/status`, {
  method: 'PUT',
  headers: {
    Authorization: token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'Reviewed',
    feedback: feedbackInput,
  }),
});


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update goal: ${response.status} - ${errorText}`);
      }

      // Update local state to remove reviewed goal from the pending list
      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.goalId === goalId
            ? { ...goal, status: 'Reviewed', feedback: feedbackInput.trim() }
            : goal
        )
      );

      setFeedbackInput('');
      setReviewingGoalId(null);
    } catch (err) {
      alert(`Error submitting feedback: ${err.message}`);
    }
  };

  const pendingGoals = goals.filter(goal => goal.status?.toLowerCase() === 'submitted');

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
              <th>Actions</th>
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
                <td>
                  {reviewingGoalId === goal.goalId ? (
                    <>
                      <textarea
                        rows={3}
                        cols={30}
                        placeholder="Enter your feedback here..."
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                      />
                      <br />
                      <button
                        onClick={() => handleFeedbackSubmit(goal.goalId)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginTop: '4px',
                        }}
                      >
                        Submit Feedback
                      </button>
                      <button
                        onClick={() => {
                          setReviewingGoalId(null);
                          setFeedbackInput('');
                        }}
                        style={{
                          marginLeft: '8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginTop: '4px',
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setReviewingGoalId(goal.goalId)}
                      style={{
                        backgroundColor: '#007bff',
                        color: '#fff',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Submit Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeeGoalDetails;
