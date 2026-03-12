import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';

function App() {
  // Helper function to determine period for a given date
  const getPeriodForDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    let startDate, endDate;

    if (day >= 15) {
      startDate = new Date(date.getFullYear(), date.getMonth(), 15);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 15);
    } else {
      startDate = new Date(date.getFullYear(), date.getMonth() - 1, 15);
      endDate = new Date(date.getFullYear(), date.getMonth(), 15);
    }

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Initialize entries from localStorage if available
  const loadEntriesFromStorage = () => {
    try {
      const savedEntries = localStorage.getItem('vigitime-entries');
      if (savedEntries) {
        const entries = JSON.parse(savedEntries);
        // Migrate old entries that don't have a period field
        const migratedEntries = entries.map(entry => {
          if (!entry.period && entry.date) {
            return { ...entry, period: getPeriodForDate(entry.date) };
          }
          return entry;
        });
        // Save migrated entries back if migration occurred
        if (migratedEntries.some((entry, index) => entry.period !== entries[index]?.period)) {
          localStorage.setItem('vigitime-entries', JSON.stringify(migratedEntries));
        }
        return migratedEntries;
      }
    } catch (e) {
      console.error('Error loading entries from storage:', e);
    }
    return [];
  };

  const [entries, setEntries] = useState(loadEntriesFromStorage);
  const [selectedViewPeriod, setSelectedViewPeriod] = useState('');
  const isInitialMount = useRef(true);
  
  // Load todos from localStorage
  const loadTodosFromStorage = () => {
    try {
      const savedTodos = localStorage.getItem('vigitime-todos');
      if (savedTodos) {
        return JSON.parse(savedTodos);
      }
    } catch (e) {
      console.error('Error loading todos from storage:', e);
    }
    return [];
  };

  const [todos, setTodos] = useState(loadTodosFromStorage);
  const [newTodo, setNewTodo] = useState('');
  const isInitialMountTodos = useRef(true);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    description: '',
    period: ''
  });

  // Generate available periods (15th to 15th cycles)
  const generateAvailablePeriods = () => {
    const periods = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Generate periods for current year and previous year
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 15);
        const endDate = new Date(year, month + 1, 15);
        
        const formatDate = (date) => {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };
        
        const periodStr = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        periods.push({
          value: periodStr,
          label: periodStr,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
      }
    }
    
    return periods.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  };

  const availablePeriods = generateAvailablePeriods();

  // Calculate current period (15th to 15th) and set as default
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

    const currentPeriod = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    
    // Load saved view period preference, default to empty (show all)
    const savedViewPeriod = localStorage.getItem('vigitime-view-period');
    setSelectedViewPeriod(savedViewPeriod || '');
    
    // Set default period in form
    const savedFormPeriod = localStorage.getItem('vigitime-form-period');
    setFormData(prev => ({
      ...prev,
      period: savedFormPeriod || currentPeriod
    }));
  }, []);

  // Save entries to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Always save entries to localStorage when they change
    localStorage.setItem('vigitime-entries', JSON.stringify(entries));
  }, [entries]);

  // Save todos to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (isInitialMountTodos.current) {
      isInitialMountTodos.current = false;
      return;
    }
    localStorage.setItem('vigitime-todos', JSON.stringify(todos));
  }, [todos]);

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (end < start) {
      // Handle overnight work (end time is next day)
      end.setDate(end.getDate() + 1);
    }
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 2) / 2; // Round to nearest 0.5
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.startTime || !formData.endTime || !formData.description.trim() || !formData.period) {
      alert('Please fill in all fields including the period');
      return;
    }

    const hours = calculateHours(formData.startTime, formData.endTime);
    if (hours <= 0) {
      alert('End time must be after start time');
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      hours: hours,
      description: formData.description.trim(),
      period: formData.period
    };

    setEntries(prev => [...prev, newEntry].sort((a, b) => {
      // Sort by date (newest first), then by start time
      if (a.date !== b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return b.startTime.localeCompare(a.startTime);
    }));

    // Save selected period preference
    localStorage.setItem('vigitime-form-period', formData.period);

    // Reset form (keep period)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      description: '',
      period: formData.period
    });
  };

  const deleteEntry = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Todo list functions
  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todo = {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos(prev => [...prev, todo]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // Get entries filtered by selected period
  const getFilteredEntries = () => {
    if (!selectedViewPeriod) return entries;
    return entries.filter(entry => entry.period === selectedViewPeriod);
  };

  const filteredEntries = getFilteredEntries();

  const getTotalHours = () => {
    return filteredEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const generatePDF = (extended = true) => {
    const doc = new jsPDF();
    let yPos = 20;
    
    doc.setFontSize(18);
    doc.text(extended ? 'Working Hours Report (Extended)' : 'Working Hours Report (Summary)', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Period: ${selectedViewPeriod}`, 20, yPos);
    yPos += 10;
    doc.text(`Total Hours: ${getTotalHours()}`, 20, yPos);
    yPos += 15;

    if (filteredEntries.length === 0) {
      doc.text('No entries recorded for this period', 20, yPos);
    } else {
      if (extended) {
        // Extended version with all details
        doc.setFontSize(10);
        filteredEntries.forEach((entry, index) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(10);
          doc.text(`${index + 1}. ${formatDateDisplay(entry.date)}`, 20, yPos);
          yPos += 6;
          doc.text(`   Time: ${entry.startTime} - ${entry.endTime} (${entry.hours} hrs)`, 20, yPos);
          yPos += 6;
          // Handle long descriptions by wrapping text
          const descriptionLines = doc.splitTextToSize(`   Description: ${entry.description}`, 170);
          doc.text(descriptionLines, 20, yPos);
          yPos += (descriptionLines.length * 6) + 2;
        });
      } else {
        // Summary version - just dates and times in a table format
        doc.setFontSize(10);
        // Table header
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Date', 20, yPos);
        doc.text('Start Time', 60, yPos);
        doc.text('End Time', 100, yPos);
        doc.text('Hours', 140, yPos);
        yPos += 8;
        
        // Draw line under header
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos - 2, 190, yPos - 2);
        yPos += 3;
        
        doc.setFont(undefined, 'normal');
        filteredEntries.forEach((entry) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
            // Redraw header on new page
            doc.setFont(undefined, 'bold');
            doc.text('Date', 20, yPos);
            doc.text('Start Time', 60, yPos);
            doc.text('End Time', 100, yPos);
            doc.text('Hours', 140, yPos);
            yPos += 8;
            doc.line(20, yPos - 2, 190, yPos - 2);
            yPos += 3;
            doc.setFont(undefined, 'normal');
          }
          const dateStr = formatDateDisplay(entry.date);
          doc.text(dateStr, 20, yPos);
          doc.text(entry.startTime, 60, yPos);
          doc.text(entry.endTime, 100, yPos);
          doc.text(`${entry.hours} hrs`, 140, yPos);
          yPos += 7;
        });
      }
    }

    const filename = extended 
      ? `vigitime-report-extended-${selectedViewPeriod.replace(/\s/g, '-')}.pdf`
      : `vigitime-report-summary-${selectedViewPeriod.replace(/\s/g, '-')}.pdf`;
    doc.save(filename);
  };

  const completedTodos = todos.filter(todo => todo.completed).length;
  const activeTodos = todos.filter(todo => !todo.completed);

  return (
    <div className="app">
      <h1>VigiTime</h1>
      <div className="main-layout">
        <div className="main-content">
          <div className="container">
            <div className="period">
              <div className="period-selector-group">
                <label htmlFor="viewPeriod">View Period:</label>
                <select
                  id="viewPeriod"
                  value={selectedViewPeriod}
                  onChange={(e) => {
                    const newPeriod = e.target.value;
                    setSelectedViewPeriod(newPeriod);
                    localStorage.setItem('vigitime-view-period', newPeriod);
                  }}
                  className="period-select"
                >
                  <option value="">All Periods</option>
                  {availablePeriods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              <p>Selected Period: <strong>{selectedViewPeriod || 'All Periods'}</strong></p>
              <p>Total Hours: <strong>{getTotalHours()}</strong></p>
            </div>

        <form onSubmit={handleSubmit} className="entry-form">
          <h2>Add Work Entry</h2>
          <div className="form-group">
            <label htmlFor="period">Period:</label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleInputChange}
              required
              className="period-select"
            >
              <option value="">Select a period</option>
              {availablePeriods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time:</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time:</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="What did you work on?"
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Entry
          </button>
        </form>

        <div className="entries-section">
          <h2>Work Entries ({filteredEntries.length}{selectedViewPeriod ? ` of ${entries.length} total` : ''})</h2>
          {filteredEntries.length === 0 ? (
            <p className="no-entries">
              {entries.length === 0 
                ? 'No entries yet. Add your first work entry above!'
                : `No entries found for ${selectedViewPeriod || 'selected period'}. Try selecting a different period or add entries for this period.`}
            </p>
          ) : (
            <div className="entries-list">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-header">
                    <div>
                      <strong>{formatDateDisplay(entry.date)}</strong>
                      <span className="entry-time">
                        {entry.startTime} - {entry.endTime} ({entry.hours} hrs)
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteEntry(entry.id)} 
                      className="delete-button"
                      aria-label="Delete entry"
                    >
                      ×
                    </button>
                  </div>
                  <p className="entry-description">{entry.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredEntries.length > 0 && (
          <div className="pdf-buttons">
            <button onClick={() => generatePDF(true)} className="pdf-button pdf-button-extended">
              Generate Extended PDF
            </button>
            <button onClick={() => generatePDF(false)} className="pdf-button pdf-button-summary">
              Generate Summary PDF
            </button>
          </div>
        )}
          </div>
        </div>

        <div className="todo-sidebar">
          <div className="todo-section">
            <h2>Todo List</h2>
            <form onSubmit={addTodo} className="todo-form">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
                className="todo-input"
              />
              <button type="submit" className="todo-add-button">Add</button>
            </form>
            
            <div className="todo-stats">
              <span>{activeTodos.length} active</span>
              {completedTodos > 0 && <span>{completedTodos} completed</span>}
            </div>

            <div className="todos-list">
              {todos.length === 0 ? (
                <p className="no-todos">No tasks yet. Add one above!</p>
              ) : (
                <>
                  {activeTodos.map(todo => (
                    <div key={todo.id} className="todo-item">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className="todo-checkbox"
                      />
                      <span className="todo-text">{todo.text}</span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="todo-delete-button"
                        aria-label="Delete todo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {completedTodos > 0 && (
                    <div className="completed-section">
                      <h3 className="completed-header">Completed</h3>
                      {todos.filter(todo => todo.completed).map(todo => (
                        <div key={todo.id} className="todo-item completed">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                            className="todo-checkbox"
                          />
                          <span className="todo-text">{todo.text}</span>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="todo-delete-button"
                            aria-label="Delete todo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
