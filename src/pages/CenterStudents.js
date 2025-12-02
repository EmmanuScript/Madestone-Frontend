import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

export default function CenterStudents({ token, userId, onBack }) {
  const [students, setStudents] = useState([]);
  const [centerName, setCenterName] = useState("");

  useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    let uid = userId;
    if (!uid && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        uid = payload.sub;
      } catch (e) {
        // ignore
      }
    }
    if (!uid) return;
    try {
      const ures = await fetch(`${API_BASE_URL}/users/${uid}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!ures.ok) throw new Error("Failed to load user");
      const user = await ures.json();
      const cid = user.center?.id;
      setCenterName(user.center?.name || "");
      if (!cid) return setStudents([]);

      const sres = await fetch(`${API_BASE_URL}/centers/${cid}/students`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!sres.ok) return setStudents([]);
      const all = await sres.json();
      setStudents(all);
    } catch (e) {
      console.error(e);
      setStudents([]);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <button style={{ float: "right" }} onClick={onBack}>
          Back
        </button>
        <h2>Center Students {centerName ? `- ${centerName}` : ""}</h2>
        <table className="students">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Category</th>
              <th>Paid</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.age}</td>
                <td>{s.category}</td>
                <td>{s.amountPaid}</td>
                <td>{s.amountDue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
