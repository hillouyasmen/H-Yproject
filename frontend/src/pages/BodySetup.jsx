// pages/BodySetup.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const bodyTypes = ["Hourglass", "Pear", "Apple", "Rectangle"];

export default function BodySetup() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [image, setImage] = useState("");

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    await axios.put("http://localhost:5000/api/users/profile", {
      user_id: user.user_id,
      body_type: selectedType,
      profile_image: image,
    });

    user.body_type = selectedType;
    user.profile_image = image;
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/user");
  };

  return (
    <div className="setup-page">
      <h2>Select Your Body Type</h2>
      <div className="types">
        {bodyTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={selectedType === type ? "selected" : ""}
          >
            {type}
          </button>
        ))}
      </div>
      <h3>Upload Profile Image (URL)</h3>
      <input
        type="text"
        value={image}
        placeholder="Enter image URL"
        onChange={(e) => setImage(e.target.value)}
      />
      <button onClick={handleSubmit}>Save</button>
    </div>
  );
}
