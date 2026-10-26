import { useState, useEffect, useMemo } from 'react';

// API Base URL for the Express Backend Server
const API_BASE_URL = 'http://localhost:5000/api/orders';

export default function App() {
  // ============================================================================
  // 1. STATE MANAGEMENT
  // ============================================================================
  // Active Screen: 'form' | 'preview'
  const [currentScreen, setCurrentScreen] = useState('form');

  // Backend connection status
  const [serverOnline, setServerOnline] = useState(null);

  // Form State: Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    paymentMethod: 'Credit / Debit Card',
    address: '',
    city: '',
    notes: '',
  });

  // Form State: Purchased Items (Dynamic List)
  const [items, setItems] = useState([
    { id: 1, name: 'MacBook Air M3', price: '1099.00', quantity: 1 },
    { id: 2, name: 'Wireless Bluetooth Mouse', price: '29.99', quantity: 2 },
  ]);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { message, type: 'error' | 'success' }
  const [previewData, setPreviewData] = useState(null); // Data calculated by backend API
  const [confirmedOrder, setConfirmedOrder] = useState(null); // Modal state

  // ============================================================================
  // 2. CHECK SERVER CONNECTIVITY ON MOUNT
  // ============================================================================
  useEffect(() => {
    async function checkServer() {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (err) {
        setServerOnline(false);
      }
    }
    checkServer();
  }, []);

  // ============================================================================
  // 3. LIVE ESTIMATED TOTALS (Frontend Calculation)
  // ============================================================================
  const liveSummary = useMemo(() => {
    let totalQuantity = 0;
    let subtotal = 0;

    items.forEach((item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseInt(item.quantity, 10) || 0;
      totalQuantity += q;
      subtotal += p * q;
    });

    return {
      totalQuantity,
      subtotal: subtotal.toFixed(2),
    };
  }, [items]);

  // ============================================================================
  // 4. DYNAMIC ITEMS TABLE HANDLERS
  // ============================================================================
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), name: '', price: '', quantity: 1 },
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      showNotice('An order must contain at least one item.', 'error');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({ ...prev, [name]: value }));
  };

  const showNotice = (message, type = 'error') => {
    setNotification({ message, type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================================
  // 5. AUTOFILL DEMO DATA (For quick classroom demonstrations)
  // ============================================================================
  const handleAutofill = () => {
    setPersonalInfo({
      fullName: 'Abdul Rafay',
      email: 'rafay.student@university.edu',
      phone: '+92 300 9876543',
      paymentMethod: 'Credit / Debit Card',
      address: 'Apartment 4B, Blue Area Commercial Ave',
      city: 'Islamabad',
      notes: 'Please deliver after 2:00 PM.',
    });
    setItems([
      { id: 1, name: 'Mechanical RGB Keyboard', price: '79.99', quantity: 1 },
      { id: 2, name: 'Wireless Gaming Mouse', price: '34.50', quantity: 2 },
      { id: 3, name: 'USB-C Fast Charging Cable', price: '12.00', quantity: 3 },
    ]);
    showNotice('Demo sample data loaded! Click submit to test API preview.', 'success');
  };

  const handleResetForm = () => {
    setPersonalInfo({
      fullName: '',
      email: '',
      phone: '',
      paymentMethod: 'Credit / Debit Card',
      address: '',
      city: '',
      notes: '',
    });
    setItems([{ id: Date.now(), name: '', price: '', quantity: 1 }]);
    setNotification(null);
    setPreviewData(null);
  };

  // ============================================================================
  // 6. CORE CLIENT-SERVER COMMUNICATION FUNCTION (15% Course Marks)
  // ============================================================================
  const handleFormSubmit = async (e) => {
    // Step A: Prevent browser page reload
    e.preventDefault();
    setNotification(null);

    // Step B: Validate required personal details
    if (
      !personalInfo.fullName.trim() ||
      !personalInfo.email.trim() ||
      !personalInfo.phone.trim() ||
      !personalInfo.address.trim()
    ) {
      showNotice('Please fill in all required personal information fields.', 'error');
      return;
    }

    // Step C: Validate item rows
    const formattedItems = [];
    for (const item of items) {
      const name = item.name.trim();
      const price = parseFloat(item.price);
      const quantity = parseInt(item.quantity, 10);

      if (!name || isNaN(price) || isNaN(quantity) || price < 0 || quantity <= 0) {
        showNotice('Please ensure all items have a valid name, positive price, and quantity >= 1.', 'error');
        return;
      }
      formattedItems.push({ name, price, quantity });
    }

    // Step D: Construct the payload
    const payload = {
      personalInfo,
      items: formattedItems,
    };

    setIsLoading(true);

    try {
      // Step E: Send HTTP POST Request via fetch() to Express Backend
      const response = await fetch(`${API_BASE_URL}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Step F: Parse server JSON response
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Server returned an error calculating order.');
      }

      // Step G: Save calculated preview object and switch to Screen 2
      setPreviewData(result.data);
      setCurrentScreen('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showNotice(`API Error: ${err.message}. Is your backend server running on port 5000?`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // 7. CONFIRM ORDER API SUBMISSION
  // ============================================================================
  const handleConfirmFinalOrder = async () => {
    if (!previewData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to finalize order on server.');
      }

      // Display Confirmation Modal
      setConfirmedOrder(result.data);

    } catch (err) {
      showNotice(`Order confirmation failed: ${err.message}`, 'error');
    }
  };

  // ============================================================================
  // 8. RENDER VIEW
  // ============================================================================
  return (
    <div className="app-container">
      {/* Application Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-area">
            <div className="logo-badge">⚛️</div>
            <div>
              <h1>Order & Billing Portal (React)</h1>
              <p className="subtitle">Client (React + Vite) communicating with Express Server API</p>
            </div>
          </div>
          {serverOnline !== null && (
            <div
              className={`status-indicator ${serverOnline ? 'online' : 'offline'}`}
              title="Live Backend Connection Status"
            >
              <span className="status-dot"></span>
              <span>{serverOnline ? 'Server Online (Port 5000)' : 'Server Offline (Port 5000)'}</span>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* Notification Banner */}
        {notification && (
          <div className={`notification-banner ${notification.type}`}>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ==================================================================
            SCREEN 1: ORDER INPUT FORM
            ================================================================== */}
        {currentScreen === 'form' && (
          <section className="screen-card">
            <div className="screen-header">
              <div>
                <h2>Customer & Order Entry Form</h2>
                <p>Fill in your personal information and add purchased items below.</p>
              </div>
              <div className="header-actions">
                <button type="button" onClick={handleAutofill} className="btn btn-secondary btn-sm">
                  ✨ Autofill Sample Data
                </button>
                <button type="button" onClick={handleResetForm} className="btn btn-outline btn-sm">
                  ↺ Reset
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} noValidate>
              {/* Section 1: Personal Info */}
              <div className="form-section">
                <div className="section-title">
                  <span className="step-num">1</span>
                  <h3>Personal Information</h3>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      placeholder="e.g. Abdul Rafay"
                      value={personalInfo.fullName}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="e.g. rafay@example.com"
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="e.g. +92 300 1234567"
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="paymentMethod">Payment Method</label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={personalInfo.paymentMethod}
                      onChange={handlePersonalInfoChange}
                    >
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                  </div>

                  <div className="input-group full-width">
                    <label htmlFor="address">Delivery Street Address <span className="required">*</span></label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      placeholder="e.g. House #14, Street 9, Sector F-7/2"
                      value={personalInfo.address}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      placeholder="e.g. Islamabad"
                      value={personalInfo.city}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="notes">Order Notes (Optional)</label>
                    <input
                      type="text"
                      id="notes"
                      name="notes"
                      placeholder="e.g. Call before delivery"
                      value={personalInfo.notes}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Purchased Items */}
              <div className="form-section">
                <div className="section-title-between">
                  <div className="section-title">
                    <span className="step-num">2</span>
                    <h3>Purchased Items</h3>
                  </div>
                  <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                    ＋ Add Item
                  </button>
                </div>

                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45%' }}>Item Description / Name</th>
                        <th style={{ width: '20%' }}>Unit Price ($)</th>
                        <th style={{ width: '15%' }}>Quantity</th>
                        <th style={{ width: '15%' }}>Row Total ($)</th>
                        <th style={{ width: '5%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const p = parseFloat(item.price) || 0;
                        const q = parseInt(item.quantity, 10) || 0;
                        const rowTotal = (p * q).toFixed(2);

                        return (
                          <tr key={item.id}>
                            <td>
                              <input
                                type="text"
                                placeholder="Item name or description"
                                value={item.name}
                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                placeholder="1"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                required
                              />
                            </td>
                            <td className="row-total-cell">${rowTotal}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="btn-remove-row"
                                title="Delete item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Live Frontend Summary */}
                <div className="live-summary-bar">
                  <div className="summary-stat">
                    <span className="stat-label">Total Items:</span>
                    <span className="stat-val">{liveSummary.totalQuantity}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Estimated Subtotal:</span>
                    <span className="stat-val highlight">${liveSummary.subtotal}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg">
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Calculating with Server...</span>
                    </>
                  ) : (
                    <span>🚀 Send to Server & View Preview</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ==================================================================
            SCREEN 2: ORDER PREVIEW DETAIL WITH CALCULATED SUM
            ================================================================== */}
        {currentScreen === 'preview' && previewData && (
          <section className="screen-card">
            <div className="preview-hero">
              <div className="badge-success">✓ Server API Response Received</div>
              <h2>Order Summary & Billing Preview</h2>
              <p>Review your personal details and server-calculated order sum below.</p>
              <div className="order-meta-chips">
                <span className="chip">Reference ID: <strong>{previewData.previewId}</strong></span>
                <span className="chip">Date: <strong>{previewData.orderDate}</strong></span>
                <span className="chip">Server Status: <strong className="badge-pill">200 OK</strong></span>
              </div>
            </div>

            <div className="preview-grid">
              {/* Customer Info Card */}
              <div className="preview-card">
                <div className="card-header">
                  <div className="card-icon">👤</div>
                  <h3>Customer Information</h3>
                </div>
                <div className="info-list">
                  <div className="info-row">
                    <span className="label">Full Name:</span>
                    <span className="value">{previewData.personalInfo.fullName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email Address:</span>
                    <span className="value">{previewData.personalInfo.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone Number:</span>
                    <span className="value">{previewData.personalInfo.phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Delivery Address:</span>
                    <span className="value">{previewData.personalInfo.address}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">City:</span>
                    <span className="value">{previewData.personalInfo.city || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Payment Mode:</span>
                    <span className="value">{previewData.personalInfo.paymentMethod}</span>
                  </div>
                  {previewData.personalInfo.notes && (
                    <div className="info-row">
                      <span className="label">Notes:</span>
                      <span className="value">{previewData.personalInfo.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Detail & Calculated Sum Card */}
              <div className="preview-card">
                <div className="card-header">
                  <div className="card-icon">📦</div>
                  <h3>Purchased Items Detail</h3>
                </div>

                <div className="preview-items-list">
                  {previewData.items.map((item) => (
                    <div key={item.id} className="preview-item-row">
                      <div className="preview-item-left">
                        <span className="preview-item-name">{item.name}</span>
                        <span className="preview-item-calc">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="preview-item-total">${item.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Calculated Bill Breakdown */}
                <div className="bill-calculation-box">
                  <div className="bill-row">
                    <span>Items Subtotal:</span>
                    <span>${previewData.summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="bill-row">
                    <span>Sales Tax ({previewData.summary.taxRate}):</span>
                    <span>${previewData.summary.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="bill-row">
                    <span>Shipping Fee:</span>
                    <span>
                      {previewData.summary.shippingFee === 0
                        ? 'FREE ($0.00)'
                        : `$${previewData.summary.shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="bill-row total-row">
                    <span className="grand-label">Total Bill Amount (Sum):</span>
                    <span className="grand-amount">
                      ${previewData.summary.totalBillAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Action Buttons */}
            <div className="preview-actions">
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('form');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn btn-outline btn-md"
              >
                ← Edit Information
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-md"
              >
                🖨️ Print / Save Receipt
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalOrder}
                className="btn btn-success btn-md"
              >
                ✓ Confirm & Place Order
              </button>
            </div>
          </section>
        )}

        {/* ==================================================================
            CONFIRMATION MODAL POPUP
            ================================================================== */}
        {confirmedOrder && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-icon">🎉</div>
              <h3>Order Successfully Placed!</h3>
              <p>Your order has been officially registered with the backend server.</p>
              <div className="modal-details">
                <div><strong>Order ID:</strong> {confirmedOrder.orderId}</div>
                <div><strong>Customer:</strong> {confirmedOrder.customer}</div>
                <div><strong>Total Paid:</strong> ${confirmedOrder.totalPaid.toFixed(2)}</div>
                <div><strong>Time:</strong> {new Date(confirmedOrder.confirmedAt).toLocaleTimeString()}</div>
                <div><strong>Status:</strong> <span className="badge-pill">CONFIRMED</span></div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrder(null);
                    handleResetForm();
                    setCurrentScreen('form');
                  }}
                  className="btn btn-primary btn-md"
                >
                  Create Another Order
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
