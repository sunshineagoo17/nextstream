import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import axios from "axios";
import AvatarImg from "../../../../assets/images/xander.png";
import ProfileUploadBtn from "../../../../assets/images/profile-upload.svg";
import "./ProfileImg.scss";

const ProfileImg = ({ userId, username, isActive, onStatusToggle }) => {
  const { token } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(AvatarImg);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data.avatar) {
          setImagePreview(`${process.env.REACT_APP_BASE_URL}/${response.data.avatar}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId, token]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!image) {
      console.error("No image selected");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", image);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response.data);
      setImagePreview(`${process.env.REACT_APP_BASE_URL}/${response.data.avatar}`);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageDelete = async () => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}/avatar`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response.data);
      setImagePreview(AvatarImg); // Reset to default image
    } catch (error) {
      console.error("Error deleting avatar:", error);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !isActive;
    try {
      await axios.post(`${process.env.REACT_APP_BASE_URL}/api/profile/${userId}/update-status`, { userId, isActive: newStatus }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      onStatusToggle(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="profile-img">
      <div className="profile-img__container">
        <div className="profile-img__card">
          <img
            src={imagePreview}
            alt="avatar"
            className="profile-img__avatar"
          />
          <div 
            className={`profile-img__ellipse-wrapper ${isActive ? 'profile-img__ellipse--active' : 'profile-img__ellipse--inactive'}`}
            onClick={toggleStatus}
          >
            <div className="profile-img__ellipse" />
          </div>
        </div>
        <div className="profile-img__content">
          <div className="profile-img__username">{username}</div>
          <div className="profile-img__status">{isActive ? 'Online' : 'Offline'}</div>
        </div>
        <input className="profile-img__input" type="file" accept="image/*" onChange={handleImageChange} />
        <button className="profile-img__button" onClick={handleImageUpload}>
          <img src={ProfileUploadBtn} alt="Upload" className="profile-img__button-icon" />
        </button>
        <button className="profile-img__button" onClick={handleImageDelete}>
          Delete Avatar
        </button>
      </div>
    </div>
  );
};

export default ProfileImg;