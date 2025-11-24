import React, { useState } from "react";
import axios from "axios";

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/announcements/add", { title, message });
      alert("Announcement added successfully!");
      setTitle("");
      setMessage("");
    } catch (error) {
      alert("Error adding announcement");
    }
  };

  return (
    <div className="p-4">
      <h2>Add Announcement</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br /><br />
        <textarea
          placeholder="Enter Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Post Announcement</button>
      </form>
    </div>
  );
}
