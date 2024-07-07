import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import api from '../../services/api';
import LocationIcon from '../../assets/images/profile-location.svg';
import ShowIcon from '../../assets/images/register-visible-icon.svg';
import HideIcon from '../../assets/images/register-invisible-icon.svg';
import ToggleButton from '../../components/ToggleButton/ToggleButton';
import SubscriptionStatus from './sections/SubscriptionStatus/SubscriptionStatus';
import Loader from '../../components/Loader/Loader';
import './ProfilePage.scss';

export const ProfilePage = () => {
  const { userId } = useContext(AuthContext); 
  const [user, setUser] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [receiveReminders, setReceiveReminders] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Choose your area...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ProfilePage userId:', userId); 
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`);
        setUser(response.data);
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
                    onChange={setReceiveReminders}
                  />
                  <p className="profile__notification-text">Receive reminders for scheduled shows/movies</p>
                </div>
                <div className="profile__notification-item">
                  <ToggleButton
                    checked={receiveNotifications}
                    onChange={setReceiveNotifications}
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
                          <SubscriptionStatus />
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
                  <div className="profile__btn-save-account">
                    <span className="profile__btn-save-account-txt">Save</span>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;