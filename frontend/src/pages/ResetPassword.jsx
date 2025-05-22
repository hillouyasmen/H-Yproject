import { useState } from "react";
import classes from "../styles/reset.module.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://localhost:5000/api/users/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone_number: phone }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("נשלחה הודעה לאיפוס סיסמה");
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className={classes.container}>
      <h2>איפוס סיסמה</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="אימייל"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input placeholder="טלפון" onChange={(e) => setPhone(e.target.value)} />
        <button type="submit">איפוס</button>
        {msg && <p>{msg}</p>}
      </form>
    </div>
  );
}
