import { useState } from "react";
import classes from "../styles/reset.module.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: request code, 2: verify and reset
  const [msg, setMsg] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://localhost:4001/api/users/request-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("קוד אימות נשלח למייל");
      setStep(2);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "http://localhost:4001/api/users/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email,
            code: verificationCode,
            newPassword
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("הסיסמה שונתה בהצלחה");
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className={classes.container}>
      <h2>איפוס סיסמה</h2>
      {step === 1 ? (
        <form onSubmit={handleRequestCode}>
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">שלח קוד אימות</button>
          {msg && <p>{msg}</p>}
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <input
            type="text"
            placeholder="קוד אימות"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">אפס סיסמה</button>
          {msg && <p>{msg}</p>}
        </form>
      )}
    </div>
  );
}
