import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

function App() {
  const [hours, setHours] = useState(0);
  const [period, setPeriod] = useState('');

  // Calculate current period (15th to 15th)
  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    let startDate, endDate;

    if (day >= 15) {
      startDate = new Date(today.getFullYear(), today.getMonth(), 15);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      endDate = new Date(today.getFullYear(), today.getMonth(), 15);
    }

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    setPeriod(`${formatDate(startDate)} - ${formatDate(endDate)}`);

    // Load saved hours from localStorage
    const savedHours = localStorage.getItem('vigitime-hours');
    if (savedHours) {
      setHours(parseFloat(savedHours));
    }
  }, []);

  const handleHoursChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setHours(value);
    localStorage.setItem('vigitime-hours', value.toString());
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Working Hours Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${period}`, 20, 35);
    doc.text(`Total Hours: ${hours}`, 20, 45);
    doc.save(`vigitime-report-${period.replace(/\s/g, '-')}.pdf`);
  };

  return (
    <div className="app">
      <h1>VigiTime</h1>
      <div className="container">
        <div className="period">
          <p>Current Period: <strong>{period}</strong></p>
        </div>
        <div className="hours-input">
          <label htmlFor="hours">Working Hours:</label>
          <input
            type="number"
            id="hours"
            value={hours}
            onChange={handleHoursChange}
            min="0"
            step="0.5"
          />
        </div>
        <button onClick={generatePDF} className="pdf-button">
          Generate PDF
        </button>
      </div>
    </div>
  );
}

export default App;
