import React, { useEffect, useState } from "react";
import StudentProfile from "./StudentProfile";
import SearchableList from "../components/SearchableList";
import "../components/SearchableList.css";
import "../components/StudentCard.css";

export default function AllStudents({ token }) {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: 8,
    category: "U10",
    centerId: "",
    school: "",
    parentPhoneNumber: "",
    parentEmail: "",
    file: null,
  });
  const [selected, setSelected] = useState(null);
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchCenters();
  }, []);

  async function fetchStudents() {
    const res = await fetch("http://localhost:5000/students", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setStudents([]);
    setStudents(await res.json());
  }

  async function fetchCenters() {
    const res = await fetch("http://localhost:5000/centers", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCenters([]);
    setCenters(await res.json());
  }

  async function createStudent(e) {
    e.preventDefault();

    // create base student
    const res = await fetch("http://localhost:5000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        name: form.name,
        age: Number(form.age),
        category: form.category,
        school: form.school || undefined,
        parentPhoneNumber: form.parentPhoneNumber || undefined,
        parentEmail: form.parentEmail || undefined,
        center: form.centerId ? { id: Number(form.centerId) } : undefined,
      }),
    });

    if (!res.ok) {
      alert("Failed to create student");
      return;
    }

    const created = await res.json();

    // if an image file was selected, upload it
    if (form.file) {
      // Validate file size (200KB max)
      const maxFileSize = 200 * 1024; // 200KB
      if (form.file.size > maxFileSize) {
        console.warn(
          `Image file too large (${(form.file.size / 1024).toFixed(
            2
          )}KB). Maximum is 200KB`
        );
      } else {
        try {
          const fd = new FormData();
          fd.append("file", form.file, form.file.name);

          const upl = await fetch(
            `http://localhost:5000/upload/student/${created.id}/image`,
            {
              method: "POST",
              headers: {
                Authorization: "Bearer " + token,
              },
              body: fd,
            }
          );

          if (!upl.ok) {
            console.warn("Image upload failed for student", created.id);
          }
        } catch (err) {
          console.warn("Image upload error", err);
        }
      }
    }

    // reset form and refresh list
    setForm({
      name: "",
      age: 8,
      category: "U10",
      centerId: "",
      school: "",
      parentPhoneNumber: "",
      parentEmail: "",
      file: null,
    });
    setShowForm(false);
    fetchStudents();
  }

  if (selected)
    return (
      <div className="page">
        <StudentProfile
          id={selected}
          token={token}
          onBack={() => setSelected(null)}
          embed={true}
        />
      </div>
    );

  const renderStudent = (student) => (
    <div
      key={student.id}
      className="student-card clickable"
      onClick={() => setSelected(student.id)}
    >
      <div className="profile-header">
        <div className="profile-avatar small">
          {student.imageViewUrl ||
          student.imageUrl ||
          (student.image
            ? `http://localhost:5000/uploads/${student.image}`
            : null) ? (
            <img
              src={
                student.imageViewUrl ||
                student.imageUrl ||
                `http://localhost:5000/uploads/${student.image}`
              }
              alt={student.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            student.name.charAt(0)
          )}
        </div>
        <h3>{student.name}</h3>
      </div>
      <div className="profile-info">
        <span>Age: {student.age}</span>
        <span>Category: {student.category}</span>
        <span>Center: {student.center?.name || "-"}</span>
      </div>
    </div>
  );

  return (
    <div>
      <h2>All Students</h2>
      <button
        onClick={() => setShowForm((s) => !s)}
        style={{ marginBottom: 10 }}
        className="action-button"
      >
        {showForm ? "Cancel" : "Add Student"}
      </button>
      {showForm && (
        <form onSubmit={createStudent} className="add-form">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            placeholder="Age"
            type="number"
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
          />
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
          >
            <option value="U6">U6</option>
            <option value="U10">U10</option>
            <option value="U15">U15</option>
          </select>
          <select
            value={form.centerId}
            onChange={(e) =>
              setForm((f) => ({ ...f, centerId: e.target.value }))
            }
          >
            <option value="">Select Center</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            placeholder="School"
            value={form.school}
            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
          />

          <input
            placeholder="Parent Phone Number"
            value={form.parentPhoneNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, parentPhoneNumber: e.target.value }))
            }
          />

          <input
            placeholder="Parent Email"
            type="email"
            value={form.parentEmail}
            onChange={(e) =>
              setForm((f) => ({ ...f, parentEmail: e.target.value }))
            }
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm((f) => ({ ...f, file: e.target.files[0] || null }))
            }
          />

          <button type="submit">Create</button>
        </form>
      )}

      <SearchableList
        items={students}
        onSelect={(student) => setSelected(student.id)}
        renderItem={renderStudent}
        searchFields={["name", "category", "center.name"]}
        itemsPerPage={8}
        className="students-list"
      />
    </div>
  );
}
