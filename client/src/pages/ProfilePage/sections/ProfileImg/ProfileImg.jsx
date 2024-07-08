import { useState } from "react";
import axios from "axios";
import AvatarImg from "../../../../assets/images/xander.png";
import ProfileUploadBtn from "../../../../assets/images/profile-upload.svg";
import "./ProfileImg.scss";

const ProfileImg = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(AvatarImg);

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
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/profile/upload-avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error("Error uploading image:", error);
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
        <div className="profile-img__ellipse-wrapper">
            <div className="profile-img__ellipse" />
        </div>
        </div>
        <div className="profile-img__content">
          <div className="profile-img__username">Username</div>
          <div className="profile-img__status">Online</div>
        </div>
        <input className="profile-img__input" type="file" accept="image/*" onChange={handleImageChange} />
        <button className="profile-img__button" onClick={handleImageUpload}>
            <img src={ProfileUploadBtn} alt="Upload" className="profile-img__button-icon" />
        </button>
      </div>
    </div>
  );
};

export default ProfileImg;
