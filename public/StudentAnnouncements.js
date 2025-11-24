import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("/api/announcements");
      setAnnouncements(res.data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h2>Latest Announcements</h2>
      {announcements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        announcements.map((a) => (
          <div key={a.id} className="announcement-card">
            <h3>{a.title}</h3>
            <p>{a.message}</p>
            <small>Posted on: {new Date(a.created_at).toLocaleString()}</small>
            <hr />
          </div>
        ))
      )}
    </div>
  );
}
