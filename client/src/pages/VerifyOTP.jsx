import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VerifyOTP = () => {
  const { setUser, applyTheme } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state
  const { email, purpose } = location.state || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // Redirect if no email/purpose found in state
  useEffect(() => {
    if (!email || !purpose) {
      navigate('/login');
    }
  }, [email, purpose, navigate]);

  // Resend Timer Logic
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    
    if (fullOtp.length !== 6) {
      return setError('Please enter the full 6-digit code.');
    }

    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/api/auth/verify-otp', {
        email,
        otp: fullOtp,
        purpose
      });

      // Verification Success!
      // Server returns JWT and User data
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      
      // Load user settings to apply theme
      api.get('/api/settings').then(setRes => {
        if (applyTheme) applyTheme(setRes.data?.appearance?.theme);
      }).catch(() => {});

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError('');
    setResendLoading(true);
    try {
      await api.post('/api/auth/resend-otp', { email, purpose });
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card otp-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">✓</span>
            <span className="logo-text">TaskMaster</span>
          </div>
          <h1>Verify your email</h1>
          <p>We've sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
                className="otp-digit-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || otp.some(d => !d)}>
            {loading ? <span className="btn-spinner"></span> : 'Verify Code'}
          </button>
        </form>

        <div className="otp-footer">
          <p>
            Didn't receive the code?{' '}
            <button 
              className={`resend-btn ${!canResend ? 'disabled' : ''}`}
              onClick={handleResend}
              disabled={!canResend || resendLoading}
            >
              {resendLoading ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${timer}s`}
            </button>
          </p>
          <div className="mt-4">
            <Link to="/login" className="text-sm">Back to Login</Link>
          </div>
        </div>
      </div>

      <style>{`
        .otp-card {
           max-width: 440px;
        }
        .otp-input-container {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin: 30px 0;
        }
        .otp-digit-input {
          width: 50px;
          height: 60px;
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          border-radius: 12px;
          border: 2px solid var(--border);
          background: var(--bg-hover);
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .otp-digit-input:focus {
          border-color: var(--accent);
          background: var(--bg-card);
          box-shadow: 0 0 0 4px var(--accent-glow);
          outline: none;
        }
        .otp-footer {
          text-align: center;
          margin-top: 24px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        .resend-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
          font-family: inherit;
        }
        .resend-btn.disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }
        .resend-btn:hover:not(.disabled) {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default VerifyOTP;
