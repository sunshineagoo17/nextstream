import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LocationIcon from '../../assets/images/profile-location.svg';
import ShowIcon from '../../assets/images/register-visible-icon.svg';
import HideIcon from '../../assets/images/register-invisible-icon.svg';
import ToggleButton from '../../components/ToggleButton/ToggleButton';
import SubscriptionStatus from './sections/SubscriptionStatus/SubscriptionStatus';
import Loader from '../../components/Loader/Loader';
import './ProfilePage.scss';

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
  const [selectedRegion, setSelectedRegion] = useState('Choose your area...');
  const [isSubscribed, setIsSubscribed] = useState(true); 
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`);
        setUser(response.data);
        setReceiveReminders(response.data.receiveReminders);
        setReceiveNotifications(response.data.receiveNotifications);
        setSelectedRegion(response.data.region);
        setIsSubscribed(response.data.isSubscribed); 
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!user.name) newErrors.name = 'Name is required';
    if (!user.username) newErrors.username = 'Username is required';
    if (!user.email) newErrors.email = 'Email is required';
    if (newPassword && newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const updatedUser = {
      name: user.name,
      username: user.username,
      email: user.email,
      receiveReminders,
      receiveNotifications,
      region: selectedRegion,
      isSubscribed
    };

    if (newPassword) {
      updatedUser.password = newPassword;
    }

    try {
      await api.put(`/api/profile/${userId}`, updatedUser);
      setSaveMessage('Profile updated successfully!');

      if (newPassword) {
        setCurrentPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Error updating profile. Please try again.');
    }
  };

  const handleSubscriptionChange = (newStatus) => {
    setIsSubscribed(newStatus);
    if (!newStatus) {
      setReceiveReminders(false);
      setReceiveNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete(`/api/profile/${userId}`);
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setSaveMessage('Error deleting account. Please try again.');
    }
  };

  const regions = ['Canada', 'United States', 'United Kingdom'];

  return (
    <>
      {isLoading && <Loader />}
      <div className="profile">
        <div className="profile__background">
          <div className="profile__background-top"></div>
          <div className="profile__background-bottom"></div>
        </div>
        <div className="profile__main">
          <h1 className="profile__title">{user.name}'s Profile</h1>
          
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
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                    />
                    <label className="profile__label" htmlFor="input-name">
                      Name
                    </label>
                    {errors.name && <p className="error">{errors.name}</p>}
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-username"
                      placeholder="Enter your username"
                      type="text"
                      value={user.username || ''}
                      onChange={(e) => setUser({ ...user, username: e.target.value })}
                    />
                    <label className="profile__label" htmlFor="input-username">
                      Username
                    </label>
                    {errors.username && <p className="error">{errors.username}</p>}
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-email"
                      placeholder="Enter your email address"
                      type="email"
                      value={user.email || ''}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                    />
                    <label className="profile__label" htmlFor="input-email">
                      Email Address
                    </label>
                    {errors.email && <p className="error">{errors.email}</p>}
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
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <label className="profile__label" htmlFor="input-current-password">
                      Current Password
                    </label>
                    <button
                      type="button"
                      className="profile__password-toggle"
                      onClick={togglePasswordVisibility}
                      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    >
                      <img src={passwordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="profile__password-toggle-icon" />
                    </button>
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-new-password"
                      placeholder="Choose a new password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <label className="profile__label" htmlFor="input-new-password">
                      New Password
                    </label>
                    {errors.newPassword && <p className="error">{errors.newPassword}</p>}
                  </div>
                  <div className="profile__input-group">
                    <input
                      className="profile__input"
                      id="input-confirm-password"
                      placeholder="Re-enter new password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <label className="profile__label" htmlFor="input-confirm-password">
                      Confirm Password
                    </label>
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile__content-notifications">
              <div className="profile__notifications-header">
                <div className="profile__text-wrapper">Notifications</div>
              </div>
              <div className="profile__notifications-content">
                <div className="profile__notification-item">
                  <ToggleButton
                    checked={receiveReminders}
                    onChange={(checked) => setReceiveReminders(checked)}
                  />
                  <p className="profile__notification-text">Receive reminders for scheduled shows/movies</p>
                </div>
                <div className="profile__notification-item">
                  <ToggleButton
                    checked={receiveNotifications}
                    onChange={(checked) => setReceiveNotifications(checked)}
                  />
                  <p className="profile__notification-text">Receive notifications for new recommendations</p>
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
                  <div className="profile__container">
                      <div className="profile__text-wrapper">Region Settings</div>
                  </div>
                  </div>
                  <div className="profile__region-content">
                  <div className="profile__select-your-region">
                      <div className="profile__region-heading">
                          <img src={LocationIcon} className="profile__location-icon" alt="Location Icon" />
                          <div className="profile__region-title">Select Your Region</div>
                      </div>
                      <div className="profile__region-input">
                      <select
                          className="profile__dropdown"
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
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
              {saveMessage && <p className="profile__save-message">{saveMessage}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;