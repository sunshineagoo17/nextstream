import React from "react";
import LocationIcon from "../../assets/images/location-icon.svg";
import "./ProfilePage.scss";

export const ProfilePage = () => {
  return (
    <div className="profile">
      <div className="profile__hero">
        <h1 className="profile__title">Your Profile</h1>
      </div>
      <div className="profile__main">
        <div className="profile__content">
          <div className="profile__content-details">
            <div className="profile__details-header">
              <div className="profile__container">
                <div className="profile__text-wrapper">Profile Details</div>
              </div>
            </div>
            <div className="profile__details-content">
              <div className="profile__details-inputs">
                <div className="profile__input-group">
                  <div className="profile__input-wrapper">
                    <input className="profile__input" id="input-1" placeholder="Enter your name" type="text" />
                  </div>
                  <label className="profile__label" htmlFor="input-1">Name</label>
                </div>
                <div className="profile__input-group">
                  <div className="profile__input-wrapper">
                    <input className="profile__input" id="input-2" placeholder="Enter your username" type="text" />
                  </div>
                  <label className="profile__label" htmlFor="input-2">Username</label>
                </div>
                <div className="profile__input-group">
                  <div className="profile__input-wrapper">
                    <input className="profile__input" id="input-3" placeholder="Enter your email address" type="email" />
                  </div>
                  <label className="profile__label" htmlFor="input-3">Email</label>
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
                <div className="profile__input-group">
                  <div className="profile__input-wrapper">
                    <div className="profile__input-frame">
                      <div className="profile__input-placeholder">Enter current password</div>
                    </div>
                  </div>
                  <div className="profile__label">Current Password</div>
                </div>
                <div className="profile__input-group">
                  <div className="profile__input-wrapper">
                    <div className="profile__input-frame">
                      <div className="profile__input-placeholder">Choose a new password</div>
                    </div>
                  </div>
                  <div className="profile__label">New Password</div>
                </div>
                <div className="profile__input-group">
                  <div className="profile__input-wrapper">
                    <div className="profile__input-frame">
                      <div className="profile__input-placeholder">Re-enter new password</div>
                    </div>
                  </div>
                  <div className="profile__label">Confirm New Password</div>
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
                <p className="profile__notification-text">Receive reminders for scheduled shows/movies</p>
                <div className="profile__toggle-on">
                  <div className="profile__toggle-indicator" />
                </div>
              </div>
              <div className="profile__notification-item">
                <p className="profile__notification-text">Receive notifications for new recommendations</p>
                <div className="profile__toggle-on">
                  <div className="profile__toggle-indicator" />
                </div>
              </div>
            </div>
          </div>
          <div className="profile__content-subscription">
            <div className="profile__subscription-header">
              <div className="profile__text-wrapper">Account Plan</div>
            </div>
            <div className="profile__subscription-status-wrapper">
              <div className="profile__subscription-status">
                <div className="profile__subscription-group">
                  <div className="profile__subscription-title">Subscription Status</div>
                  <div className="profile__subscription-active">
                    <div className="profile__checkbox-wrapper">
                      <div className="profile__checkbox">
                        <img className="profile__vector" alt="Vector" src="vector.svg" />
                      </div>
                    </div>
                    <div className="profile__status-wrapper">
                      <div className="profile__status-text">Active</div>
                    </div>
                  </div>
                </div>
                <div className="profile__delete-account">
                  <div className="profile__delete-account-text">Delete Account</div>
                </div>
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
                  <div className="profile__text-input">Choose your area...</div>
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