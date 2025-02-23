import React from 'react';
import logo from '../images/logo.png'; 
import '../styles/loading_page.css'; 

const LoadingPage = () => {
    return (
        <div className="loading-container">
            <img src={logo} alt="EventSync Logo" className="logo" />
            <p className="loading-text">Loading...</p>
        </div>
    );
};

export default LoadingPage;
