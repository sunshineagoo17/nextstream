import { useState, useEffect, useContext } from "react";
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import api from "../../../../services/api"; 
import ProfileUploadBtn from "../../../../assets/images/profile-upload.svg";
import DeleteIcon from "../../../../assets/images/delete-icon.svg";
import DefaultAvatar from "../../../../assets/images/default-avatar.svg";
import Loader from "../../../../components/Loaders/Loader/Loader";
import CustomAlerts from "../../../../components/CustomAlerts/CustomAlerts";
import './ProfileImg.scss';

const ProfileImg = ({ userId, username, isActive, onStatusToggle }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [imagePreview, setImagePreview] = useState(DefaultAvatar);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`, {
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

    // Check file type
    if (!file.type.match("image/jpeg") && !file.type.match("image/png") && !file.type.match("image/jpg") && !file.type.match("image/gif") && !file.type.match("image/svg") && !file.type.match("image/webp") && !file.type.match("image/bmp") && !file.type.match("image/tiff")) {
      setAlert({ show: true, message: "Please upload a valid image (jpg, jpeg, png, gif, svg, webp, bmp, tiff).", type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
 
    setLoading(true);
    try {
      const response = await api.post(`/api/profile/${userId}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        withCredentials: true
      });
      setImagePreview(`${process.env.REACT_APP_BASE_URL}/${response.data.avatar}`);
      setAlert({ show: true, message: "Image uploaded successfully.", type: 'success' });
    } catch (error) {
      console.error("Error uploading image:", error);
      setAlert({ show: true, message: "Error uploading image.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/api/profile/${userId}/avatar`, {
        withCredentials: true
      });
      setImagePreview(DefaultAvatar);
      setAlert({ show: true, message: "Image deleted successfully. For now, you can use our default avatar.", type: 'success' });
    } catch (error) {
      console.error("Error deleting avatar:", error);
      setAlert({ show: true, message: "Error deleting avatar.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = !isActive;
    try {
      await api.post(`/api/profile/${userId}/update-status`, { isActive: newStatus }, {
        withCredentials: true
      });
      onStatusToggle(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const closeAlert = () => {
    setAlert({ show: false, message: '', type: '' });
  };

  return (
    <div className="profile-img">
      {loading && <Loader />}
      {alert.show && <CustomAlerts message={alert.message} type={alert.type} onClose={closeAlert} />}
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
              data-tooltip="Upload new Avatar"
            >
              <img src={ProfileUploadBtn} alt="Upload" className="profile-img__upload-icon" />
            </button>
            <button className="profile-img__button profile-img__button--delete" onClick={handleImageDelete} data-tooltip="Delete Avatar">
              <img src={DeleteIcon} alt="Delete" className="profile-img__delete-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileImg;