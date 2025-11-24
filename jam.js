import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Admin Dashboard</h2>
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/students">Student Management</Link></li>
        <li><Link to="/announcements">Announcements</Link></li>
        <li><Link to="/notices">Notices</Link></li>
        <li><Link to="/admission">Admission Form</Link></li>
        <li><Link to="/leave">Leave Application</Link></li>
        <li><Link to="/complaints">Complaints</Link></li>
        <li><Link to="/finance">Finance & Billing</Link></li>
        <li><Link to="/scholarship">Scholarship</Link></li>
        <li><Link to="/rooms">Room Management</Link></li>
        <li><Link to="/reports">Reports</Link></li>
        <li><Link to="/about">About Us</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
