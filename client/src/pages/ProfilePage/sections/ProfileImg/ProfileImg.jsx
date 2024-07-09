import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import axios from "axios";
import ProfileUploadBtn from "../../../../assets/images/profile-upload.svg";
import DeleteIcon from "../../../../assets/images/delete-icon.svg";
import DefaultAvatar from "../../../../assets/images/default-avatar.svg";
import Loader from "../../../../components/Loader/Loader"; 
import "./ProfileImg.scss";

const ProfileImg = ({ userId, username, isActive, onStatusToggle }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [imagePreview, setImagePreview] = useState(DefaultAvatar);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}`, {
          withCredentials: true
        });
        if (response.data.avatar) {
          setImagePreview(`${process.env.REACT_APP_BASE_URL}/${response.data.avatar}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (isAuthenticated && userId) {
      fetchUserData();
    }
  }, [isAuthenticated, userId]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No image selected");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        withCredentials: true
      });
      console.log(response.data);
      setImagePreview(`${process.env.REACT_APP_BASE_URL}/${response.data.avatar}`);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}/avatar`, {
        withCredentials: true
      });
      console.log(response.data);
      setImagePreview(DefaultAvatar); // Reset to default avatar
    } catch (error) {
      console.error("Error deleting avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !isActive;
    console.log(`Toggling status: ${newStatus}`);
    try {
      await axios.post(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}/update-status`, { isActive: newStatus }, {
        withCredentials: true
      });
      onStatusToggle(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="profile-img">
      {loading && <Loader />}
      <div className="profile-img__container">
        <div className="profile-img__wrapper">
          <div className="profile-img__card">
            <img
              src={imagePreview}
              alt="avatar"
              className="profile-img__avatar"
            />
            <div className="profile-img__ellipse-wrapper" onClick={toggleStatus}>
              <div className={`profile-img__ellipse ${isActive ? 'profile-img__ellipse--active' : 'profile-img__ellipse--inactive'}`} />
            </div>
          </div>
          <div className="profile-img__content">
            <div className="profile-img__username">{username}</div>
            <div className="profile-img__status">{isActive ? 'Online' : 'Offline'}</div>
          </div>
        </div>
        <div className="profile-img__button-wrapper">
          <input
            className="profile-img__input"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
            id="file-input"
          />
          <div className="profile-img__button-container">
            <button
              className="profile-img__button"
              onClick={() => document.getElementById("file-input").click()}
            >
              <img src={ProfileUploadBtn} alt="Upload" className="profile-img__upload-icon" />
            </button>
            <button className="profile-img__button profile-img__button--delete" onClick={handleImageDelete}>
              <img src={DeleteIcon} alt="Delete" className="profile-img__delete-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileImg;
