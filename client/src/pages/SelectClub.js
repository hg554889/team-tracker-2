import React, { useEffect, useState } from "react";
import { listClubs } from "../api/clubs";
import { updateMe } from "../api/users";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SelectClub() {
  const [clubs, setClubs] = useState([]);
  const [clubId, setClubId] = useState("");
  const nav = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    (async () => {
      const { data } = await listClubs();
      setClubs(data);
    })();
  }, []);
  async function submit(e) {
    e.preventDefault();
    const { data: updated } = await updateMe({ clubId });
    setUser(updated);
    nav("/");
  }

  return (
    <div className="container" style={{ maxWidth: 540 }}>
      <h1>동아리 선택</h1>
      <form
        onSubmit={submit}
        className="card"
        style={{ display: "grid", gap: 12 }}
      >
        <select
          className="input"
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
        >
          <option value="">선택하세요</option>
          {clubs.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn primary" disabled={!clubId}>
          확인
        </button>
      </form>
    </div>
  );
}
