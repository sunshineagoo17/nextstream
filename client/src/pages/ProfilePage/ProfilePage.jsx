import React, { useState } from "react";
import LocationIcon from "../../assets/images/profile-location.svg";
import ShowIcon from "../../assets/images/register-visible-icon.svg";
import HideIcon from "../../assets/images/register-invisible-icon.svg";
import ToggleButton from "../../components/ToggleButton/ToggleButton";
import SubscriptionStatus from "./sections/SubscriptionStatus/SubscriptionStatus";
import "./ProfilePage.scss";

export const ProfilePage = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [receiveReminders, setReceiveReminders] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Choose your area...');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const regions = ['Canada', 'United States', 'United Kingdom'];

  return (
    <div className="profile">
      <div className="profile__background">
        <div className="profile__background-top"></div>
        <div className="profile__background-bottom"></div>
      </div>
      <div className="profile__main">
        <h1 className="profile__title">Your Profile</h1>
        
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    type={passwordVisible ? "text" : "password"}
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
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    <img src={passwordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="profile__password-toggle-icon" />
                  </button>
                </div>
                <div className="profile__input-group">
                  <input
                    className="profile__input"
                    id="input-new-password"
                    placeholder="Choose a new password"
                    type={passwordVisible ? "text" : "password"}
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
                    type={passwordVisible ? "text" : "password"}
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
                    <div className="profile__region-title">Select Your Region</div>
                    <div className="profile__region-input">
                    <img src={LocationIcon} className="profile__location-icon" alt="Location Icon" />
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

          <button className="profile__btn-save">
            <div className="profile__btn-overlap">
              <div className="profile__btn-bg" />
              <div className="profile__btn-wrapper">
                <div className="profile__btn-text">Save</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
