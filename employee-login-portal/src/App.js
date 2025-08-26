import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './pages/Dashboard';
import ResetLinkSent from './components/ResetLinkSent';
import PasswordReset from './components/PasswordReset';
import SessionTimeoutHandler from "./components/SessionTimeoutHandler";
import Home1 from "./pages/Home1";
import Favourites from './pages/Favourites';
import AttendancePage from './pages/AttendancePage';
import ClaimsPage from './pages/ClaimsPage';
import EmployeeDirectory from './pages/EmployeeDirectory';
import EmployeeHandBook from './pages/EmployeeHandBook';
import ExitManagement from './pages/ExitManagement';
import HelpDesk from './pages/HelpDesk';
import Holiday from './pages/Holiday';
import Leaves from './pages/Leaves';
import Notifications from './pages/Notifications';
import Payslips from './pages/Payslips';
import Performance from './pages/Performance';
import Training from './pages/Training';
import Travel from './pages/Travel';
import NewClaim from './pages/NewClaim';
import ClaimHistoryPage from './pages/ClaimHistoryPage';
import ClaimStatusPage from './pages/ClaimStatusPage';
import ManagerDashBoard from "./pages/ManagerDashBoard";
import FinanceDashboard from "./pages/FinanceDashboard";
import HRDashboard from "./pages/HRDashboard";
import MyTasks from "./pages/MyTasks";
import Saveddrafts from "./pages/Saveddrafts";

import Mygoals from './pages/Mygoals';
import Selfassessment from './pages/Selfassessment';
import Myteam from './pages/Myteam';
import Newgoal from './pages/Newgoal';
import Managergoals from './pages/Managergoals';
import Reviewer from './pages/Reviewer';
import Employeegoal from './pages/Employeegoal';
import InProgressgoals from './pages/InProgressgoals';
import Submittedgoals from './pages/Submittedgoals';
import Rejectedgoals from './pages/Rejectedgoals';
import Pendinggoals from './pages/Pendinggoals';
import Reviewergoals from './pages/Reviewergoals';
import Hrgoals from './pages/Hrgoals';
import Finalhrgoals from './pages/Finalhrgoals';
import Submitfeedback from './pages/Submitfeedback';
import Goalhistory from './pages/Goalhistory';

import Mytimesheets from './pages/Mytimesheets';
import ManagerTasks from './pages/ManagerTasks';
import HRTasks from './pages/HrTasks';
import LeavesDraft from './pages/LeavesDraft'; 
import LeaveHistory from './pages/LeaveHistory';
import Mngtimesheetrequest from './pages/Mngtimesheetrequest';
import Mngtimesheetds from './pages/Mngtimesheetds';
import Hrtimesheetds from './pages/Hrtimesheetds';
import HRTimesheet from './pages/HRTimesheet';


function App() {
  return (
    <Router>
    <SessionTimeoutHandler>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="reset-link-sent" element={<ResetLinkSent/>}/>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<Home1/>}/>
        <Route path="/hom" element={<Favourites/>}/>
        <Route path="/home0" element={<ClaimsPage/>}/>
        <Route path="/home1" element={<AttendancePage/>}/>
        <Route path="/home2" element={<EmployeeHandBook/>}/>
        <Route path="/home3" element={<EmployeeDirectory/>}/>
        <Route path="/home4" element={<ExitManagement/>}/>
        <Route path="/home5" element={<Holiday/>}/>
        <Route path="/home6" element={<HelpDesk/>}/>
        <Route path="/home7" element={<Leaves/>}/>
        <Route path="/home8" element={<Notifications/>}/>
        <Route path="/home9" element={<Payslips/>}/>
        <Route path="/home10" element={<Performance/>}/>
        <Route path="/home11" element={<Training/>}/>
        <Route path="/home12" element={<Travel/>}/>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password-reset-success" element={<PasswordReset/>}/>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claims/new" element={<NewClaim />} />
        <Route path="/claims/status" element={<ClaimStatusPage />} />
        <Route path="/claims/history" element={<ClaimHistoryPage />} />
        <Route path="/manager-dashboard" element={<ManagerDashBoard />} />
        <Route path="/finance-dashboard" element={<FinanceDashboard/>}/>
        <Route path="/finance" element={<HRDashboard/>}/>
        <Route path="/task" element={<MyTasks/>}/>
        <Route path="/drafts" element={<Saveddrafts/>}/>

          <Route path="/goals" element={<Mygoals />} />
                  <Route path="/selfassessment" element={<Selfassessment />}/>
                  <Route path="/myteam" element={<Myteam />}/>
                  <Route path="/myteam/newgoal" element={<Newgoal />}/>
                  <Route path="/managergoals" element={<Managergoals />}/>
                  <Route path="/reviewer" element={<Reviewer />}/>
                  <Route path="/employeegoal" element={<Employeegoal/>}/>
                  <Route path="/inprogressgoals" element={<InProgressgoals/>}/>
                  <Route path="/submittedgoals" element={<Submittedgoals/>}/>
                  <Route path="/rejectedgoals" element={<Rejectedgoals/>}/>
                  <Route path="/pendinggoals" element={<Pendinggoals/>}/>
                  <Route path="/reviewergoals" element={<Reviewergoals/>}/>
                  <Route path="/hrgoals" element={<Hrgoals/>}/>
                  <Route path="/finalhrgoals" element={<Finalhrgoals/>}/>
                  <Route path="/submitfeedback" element={<Submitfeedback/>}/>
                  <Route path="/goalhistory" element={<Goalhistory/>}/>


                  <Route path="/manager/tasks" element={<ManagerTasks />} />
                      <Route path="/hr/tasks" element={<HRTasks />} />
                       <Route path="/saved-drafts" element={<LeavesDraft />} />
                       <Route path="/leave-history" element={<LeaveHistory />} /> 
                      <Route path="/mngtime" element={<Mngtimesheetds/>} /> 
                      <Route path="/mngreq" element={<Mngtimesheetrequest/>} /> 
                        <Route path="/hrgreq" element={<Hrtimesheetds/>} /> 
                      <Route path="/timesheets" element={<HRTimesheet />} />
                      <Route path="/mytimesheets" element={< Mytimesheets/>} />
                  



 
      </Routes>
      </SessionTimeoutHandler>
    </Router>
  );
}

export default App;
