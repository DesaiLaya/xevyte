import React, { useState } from 'react';
import './Home1.css';
import {Link} from 'react-router-dom';

import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.jpg';
import image4 from '../assets/image4.jpg';
import image5 from '../assets/image5.jpg';
import image6 from '../assets/image6.jpg';

function Home1() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
    
  
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
  

  const images = [
    { src: image1, name: 'City' },
    { src: image2, name: 'Mountain' },
    { src: image3, name: 'City' },
    { src: image4, name: 'City' },
     { src: image5, name: 'City' },
      { src: image6, name: 'City' },
  ];

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed ? (
          <>
      
      
      <img
          src={require("../assets/c6647346d2917cff706243bfdeacb83b413c72d1.png")}
          alt="office"
          className="office-vng"
        />
        <img
              src={require("../assets/gg_move-left.png")}
              alt="collapse"
              className="toggle-btn"
              onClick={toggleSidebar}
              style={{ width: '35px', height: '35px',top:'76px',marginLeft:"200px"}}
            />
       <h3>
        <Link to="/home" className="side" style={{ textDecoration: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Home
            <img
              src={require("../assets/home02.png")}
              alt="office"
              style={{ width: '22px', height: '22px' }}
            />
          </span>
        </Link>
      </h3>
      
        <h3><Link to="/home0" className="hom" style={{textDecoration:'none'}}>Claims</Link></h3>
        <h3><Link to="/home1" className="side" style={{textDecoration:'none'}}>Attendance</Link></h3>
        <h3><Link to="/home2" className="side" style={{textDecoration:'none'}}>Employee Handbook</Link></h3>
        <h3><Link to="/home3" className="side" style={{textDecoration:'none'}}>Employee Directory</Link></h3>
        <h3><Link to="/home4" className="side" style={{textDecoration:'none'}}>Exit Management</Link></h3>
        <h3><Link to="/home5" className="side" style={{textDecoration:'none'}}>Holiday Calendar</Link></h3>
        <h3><Link to="/home6" className="side" style={{textDecoration:'none'}}>Helpdesk</Link></h3>
        <h3><Link to="/home7" className="side" style={{textDecoration:'none'}}>Leaves</Link></h3>
        <h3><Link to="/home8" className="side" style={{textDecoration:'none'}}>Notifications</Link></h3>
        <h3><Link to="/home9" className="side" style={{textDecoration:'none'}}>Pay slips</Link></h3>
        <h3><Link to="/home10" className="side" style={{textDecoration:'none'}}>Performance</Link></h3>
        <h3><Link to="/home11" className="side" style={{textDecoration:'none'}}>Training</Link></h3>
        <h3><Link to="/home12" className="side" style={{textDecoration:'none'}}>Travel</Link></h3>
       

        </>
        ) : (
          <div className="collapsed-wrapper">
            <img
              src={require("../assets/Group.png")} // replace with your actual right-arrow image
              alt="expand"
              className="collapsed-toggle"
              onClick={toggleSidebar}
             />
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
<div className="divider"></div>
        <div className="image-grid">
          {filteredImages.map((img, idx) => (
            <img key={idx} src={img.src} alt={img.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home1;