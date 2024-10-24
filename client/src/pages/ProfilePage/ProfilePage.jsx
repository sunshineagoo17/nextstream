import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { toast, ToastContainer, Slide } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faMapMarkerAlt, faBell } from '@fortawesome/free-solid-svg-icons';
import ToggleButton from '../../components/ToggleButton/ToggleButton';
import SubscriptionStatus from './sections/SubscriptionStatus/SubscriptionStatus';
import Loader from '../../components/Loaders/Loader/Loader';
import ProfileImg from './sections/ProfileImg/ProfileImg';
import 'react-toastify/dist/ReactToastify.css';
import './ProfilePage.scss';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const ProfilePage = () => {
  const { userId, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [receiveReminders, setReceiveReminders] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const [receivePushNotifications, setReceivePushNotifications] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Choose your area...');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationTime, setNotificationTime] = useState('30');
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [saveMessage, setSaveMessage] = useState({ text: '', className: '' });
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (userId) {
        try {
          const response = await api.get(`/api/profile/${userId}`);
          setUser(response.data);
          setReceiveReminders(response.data.receiveReminders);
          setReceiveNotifications(response.data.receiveNotifications);
          setReceivePushNotifications(!!response.data.receivePushNotifications);
          setNotificationTime(response.data.notificationTime || '30');
          setSelectedRegion(response.data.region);
          setIsSubscribed(response.data.isSubscribed);
          setIsActive(response.data.isActive);
        } catch (error) {
          setSaveMessage({ text: 'Error fetching profile. Please try again.', className: 'error' });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); 
      }
    };
  
    fetchProfile();
  }, [userId]);  

  const clearSaveMessage = () => {
    setSaveMessage({ text: '', className: '' });
  };

  const clearErrors = () => {
    setErrors({});
  };

  const truncateEmail = (email, maxLength = 20) => {
    if (email.length > maxLength) {
      return `${email.substring(0, maxLength)}...`;
    }
    return email;
  };  

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSave = async () => {
    const newErrors = {};

    // Validate fields
    if (!user.name) newErrors.name = 'Name is required';
    if (!user.username) newErrors.username = 'Username is required';
    if (!user.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(user.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (newPassword && newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    // Validate current password if provided
    if (currentPassword) {
      try {
        const passwordCheck = await api.post(`/api/profile/check-password`, { userId, currentPassword });
        if (!passwordCheck.data.valid) {
          newErrors.currentPassword = 'Current password is incorrect';
        }
      } catch (error) {
        newErrors.currentPassword = 'Error validating current password';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to the first error field
      const errorFields = [
        { ref: nameRef, error: newErrors.name },
        { ref: usernameRef, error: newErrors.username },
        { ref: emailRef, error: newErrors.email },
        { ref: currentPasswordRef, error: newErrors.currentPassword },
        { ref: newPasswordRef, error: newErrors.newPassword },
        { ref: confirmPasswordRef, error: newErrors.confirmPassword },
      ];
      const firstErrorField = errorFields.find(field => field.error);
      if (firstErrorField) {
        firstErrorField.ref.current.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const updatedUser = {
      name: user.name,
      username: user.username,
      email: user.email,
      receiveReminders,
      receiveNotifications,
      receivePushNotifications,
      notificationTime,
      customHours,
      customMinutes,
      region: selectedRegion,
      isSubscribed,
      isActive
    };

    try {
      if (currentPassword && newPassword) {
        // Updates user with new password
        updatedUser.password = newPassword;
      }

      // Updates user profile only if there are no validation errors
      await api.put(`/api/profile/${userId}`, updatedUser);
      setSaveMessage({ text: 'Profile updated successfully!', className: 'success' });

      // Clear password fields
      if (newPassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      // Set timeout to clear the message after 3000ms
      setTimeout(() => {
        clearSaveMessage();
      }, 3000);

    } catch (error) {
      if (error.response) {
        if (error.response.status === 409 && error.response.data.message === 'Email is already taken') {
          setErrors({ email: 'Email is already taken' });
          emailRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (error.response.status === 401 && error.response.data.message === 'Incorrect password') {
          setErrors({ currentPassword: 'Current password is incorrect' });
          currentPasswordRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
          setSaveMessage({ text: 'Error updating profile. Please try again.', className: 'error' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setSaveMessage({ text: 'Error updating profile. Please try again.', className: 'error' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleSubscriptionChange = (newStatus) => {
    setIsSubscribed(newStatus);
    setIsActive(newStatus);
    if (!newStatus) {
      setReceiveReminders(false);
      setReceiveNotifications(false);
      setReceivePushNotifications(false);
    }
    clearSaveMessage();
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete(`/api/profile/${userId}`);
      toast.success("Your account's been deleted successfully. Redirecting to homepage...", {
        className: 'frosted-toast-profile',
      });
      setTimeout(() => {
        logout();
        navigate('/');
      }, 3000);
    } catch (error) {
      setSaveMessage({ text: 'Error deleting account. Please try again.', className: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchLocation = async () => {
    try {
      const response = await api.get(`/api/profile/${userId}/location`);
      const region = response.data.region;
      setSelectedRegion(region);
      setUser(prevUser => ({ ...prevUser, region }));
      toast.success('Location updated based on your current location.', {
        className: 'frosted-toast-profile',
      });
    } catch (error) {
      toast.error('Error fetching location. Please try again.', {
        className: 'frosted-toast-profile',
      });
    }
  };

  const handleNotificationTimeChange = (value) => {
    setNotificationTime(value);
    if (value !== 'custom') {
      setCustomHours('');
      setCustomMinutes('');
    }
  };

  const handleCustomTimeChange = (type, value) => {
    if (type === 'hours') {
      setCustomHours(value);
    } else if (type === 'minutes') {
      setCustomMinutes(value);
    }
  };

  const regions = ['Canada', 'United States', 'United Kingdom'];

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      {isLoading && <Loader />}
      <div className="profile">
        <div className="profile__background">
          <div className="profile__background-top"></div>
          <div className="profile__background-bottom"></div>
        </div>
        <div className="profile__main">
          <h1 className="profile__title">{user.name}'s Profile</h1>
          <ProfileImg userId={userId} username={user.username} isActive={isActive} onStatusToggle={setIsActive} />

          <div className="profile__card">
            <div className="profile__content-details">
              <div className="profile__details-header">
                <div className="profile__container">
                  <div className="profile__text-wrapper">Profile Details</div>
                </div>
              </div>
              <div className="profile__details-content">
                <div className="profile__details-inputs">
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-name"
                      placeholder="Enter your name"
                      type="text"
                      value={user.name || ''}
                      ref={nameRef}
                      onChange={(e) => { setUser({ ...user, name: e.target.value }); clearSaveMessage(); clearErrors(); }}
                    />
                    <label className="profile__label" htmlFor="input-name">
                      Name
                    </label>
                    {errors.name && <p className="profile__error">{errors.name}</p>}
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-username"
                      placeholder="Enter your username"
                      type="text"
                      value={user.username || ''}
                      ref={usernameRef}
                      onChange={(e) => { setUser({ ...user, username: e.target.value }); clearSaveMessage(); clearErrors(); }}
                    />
                    <label className="profile__label" htmlFor="input-username">
                      Username
                    </label>
                    {errors.username && <p className="profile__error">{errors.username}</p>}
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-email"
                      placeholder="Enter your email address"
                      type="email"
                      value={truncateEmail(user.email || '')}
                      ref={emailRef}
                      onChange={(e) => { 
                        setUser({ ...user, email: e.target.value }); 
                        clearSaveMessage(); 
                        clearErrors(); 
                      }}
                    />
                    <label className="profile__label" htmlFor="input-email">
                      Email Address
                    </label>
                    {errors.email && <p className="profile__error">{errors.email}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile__content-password">
              <div className="profile__password-header">
                <div className="profile__container">
                  <div className="profile__text-wrapper">Manage Password</div>
                </div>
              </div>
              <div className="profile__password-content">
                <div className="profile__password-inputs">
                  <div className="profile__input-group profile__input-group--password">
                    <input
                      className="profile__input"
                      id="input-current-password"
                      placeholder="Enter current password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={currentPassword}
                      ref={currentPasswordRef}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        clearSaveMessage();
                        clearErrors();
                      }}
                    />
                    <label className="profile__label" htmlFor="input-current-password">
                      Current Password
                    </label>
                    {errors.currentPassword && <p className="profile__error">{errors.currentPassword}</p>}
                    <button
                      type="button"
                      className="profile__password-toggle"
                      onClick={togglePasswordVisibility}
                      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    >
                      <FontAwesomeIcon
                      icon={passwordVisible ? faEyeSlash : faEye}
                      className="profile__password-toggle-icon"
                    />
                    </button>
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-new-password"
                      placeholder="Choose a new password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={newPassword}
                      ref={newPasswordRef}
                      onChange={(e) => { setNewPassword(e.target.value); clearSaveMessage(); clearErrors(); }}
                    />
                    <label className="profile__label" htmlFor="input-new-password">
                      New Password
                    </label>
                    {errors.newPassword && <p className="profile__error">{errors.newPassword}</p>}
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-confirm-password"
                      placeholder="Re-enter new password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={confirmPassword}
                      ref={confirmPasswordRef}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearSaveMessage(); clearErrors(); }}
                    />
                    <label className="profile__label" htmlFor="input-confirm-password">
                      Confirm Password
                    </label>
                    {errors.confirmPassword && <p className="profile__error">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile__content-notifications">
              <div className="profile__notifications-header">
                <div className="profile__text-wrapper">Notifications</div>
              </div>
              <div className="profile__notifications-content">
                <div className="profile__notification-title-container">
                  <FontAwesomeIcon icon={faBell} className="profile__notifications-alerts-icon" />
                  <p className="profile__notification-text">Alert States</p>
                </div>
                <div className="profile__notification-item">
                  <ToggleButton
                    checked={receiveReminders}
                    onChange={(checked) => { setReceiveReminders(checked); clearSaveMessage(); clearErrors(); }}
                  />
                  <p className="profile__notification-text">Receive reminders for scheduled shows/movies</p>
                </div>
                <div className="profile__notification-item">
                  <ToggleButton
                    checked={receiveNotifications}
                    onChange={(checked) => { setReceiveNotifications(checked); clearSaveMessage(); clearErrors(); }}
                  />
                  <p className="profile__notification-text">Receive notifications for new recommendations</p>
                </div>
                <div className="profile__notification-push-item">
                  <ToggleButton
                    checked={receivePushNotifications}
                    onChange={(checked) => { setReceivePushNotifications(checked); clearSaveMessage(); clearErrors(); }}
                  />
                  <p className="profile__notification-text">Receive push notifications for scheduled media</p>
                </div>
                  <div className="profile__notification-custom-time">
                  {receivePushNotifications && (
                    <div className="profile__custom-time-container">
                      <select
                        id="notification-time"
                        value={notificationTime}
                        onChange={(e) => handleNotificationTimeChange(e.target.value)}
                        className="profile__dropdown"
                      >
                        <option value="5">5 minutes before</option>
                        <option value="15">15 minutes before</option>
                        <option value="30">30 minutes before</option>
                        <option value="60">1 hour before</option>
                        <option value="custom">Custom time</option>
                      </select>
                      {notificationTime === 'custom' && (
                        <div className="profile__notification-custom-time-labels">
                          <input
                            type="number"
                            id="custom-hours"
                            className="profile__custom-time-input"
                            placeholder="Hours"
                            min="0"
                            max="23"
                            value={customHours}
                            onChange={(e) => handleCustomTimeChange('hours', e.target.value)}
                          />
                          <p className="profile__custom-time-label">:</p>
                          <input
                            type="number"
                            id="custom-minutes"
                            className="profile__custom-time-input"
                            placeholder="Minutes"
                            min="0"
                            max="59"
                            value={customMinutes}
                            onChange={(e) => handleCustomTimeChange('minutes', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="profile__content-subscription-container">
              <div className="profile__subscription-header">
                <div className="profile__text-wrapper">Account Plan</div>
              </div>
              <div className="profile__subscription-status-wrapper">
                <div className="profile__content-subscription">
                  <SubscriptionStatus
                    isSubscribed={isSubscribed}
                    onSubscriptionChange={handleSubscriptionChange}
                    onDeleteAccount={handleDeleteAccount}
                  />
                </div>
              </div>
            </div>

            <div className="profile__content-region">
              <div className="profile__region-header">
                <div className="profile__text-wrapper">Region Settings</div>
              </div>
              <div className="profile__region-content">
                <div className="profile__select-your-region">
                  <div className="profile__region-heading">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="profile__location-icon"
                      onClick={fetchLocation}
                      data-tooltip-id="locationTooltip"
                      data-tooltip-content="Update location"
                    />
                    <Tooltip id="locationTooltip" place="top" className="location-tooltip" />
                    <div className="profile__region-title">Select Your Region</div>
                  </div>
                  <div className="profile__region-input">
                    <select
                      className="profile__dropdown"
                      value={selectedRegion}
                      onChange={(e) => { setSelectedRegion(e.target.value); clearSaveMessage(); clearErrors(); }}
                    >
                      <option disabled>Choose your area...</option>
                      {regions.map((region, index) => (
                        <option key={index} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile__btn-save-account-wrapper">
              <div className="profile__btn-save-account-bg"></div>
              <button className="profile__btn-save-account" onClick={handleSave}>
                <span className="profile__btn-save-account-txt">Save</span>
              </button>
            </div>
            {saveMessage.text && (
              <div className={`save-message ${saveMessage.className}`}>
                <p className="save-message__text">{saveMessage.text}</p>
                <button className="save-message__close" onClick={clearSaveMessage}>&times;</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;