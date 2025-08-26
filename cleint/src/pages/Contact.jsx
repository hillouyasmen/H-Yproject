import { useState, useEffect } from "react";
import styles from "../styles/Contact.module.css";
import api from "../api";
import { useAuth } from "../contexts/AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";

export default function Contact() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentId, setSentId] = useState(null);

  useEffect(() => {
    if (user) {
      setName((user.username || "").trim());
      setEmail((user.email || "").trim());
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      notify.error("Please fill all fields");
      return;
    }
    try {
      setBusy(true);
      const { data } = await api.post("/contact", {
        user_id: user?.user_id,
        name,
        email,
        subject,
        message,
      });
      if (data?.ok) {
        setSentId(data.id);
        notify.success("Message sent. We'll get back to you soon 💖");
        setSubject("");
        setMessage("");
      } else {
        notify.error("Failed to send your message");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.h1}>Contact us</h1>
          <p className={styles.lead}>
            Have a question, feedback, or collab idea? Drop us a line!
          </p>
        </div>
      </div>

      <div className={styles.wrap}>
        <section className={`card ${styles.formCard}`}>
          <h2 className={styles.title}>Send a message</h2>
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.row2}>
              <div className={styles.col}>
                <label className={styles.label}>Your name</label>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className={styles.col}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <label className={styles.label}>Subject</label>
            <input
              className={styles.input}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
            />

            <label className={styles.label}>Message</label>
            <textarea
              className={styles.textarea}
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
            />

            <button className={styles.sendBtn} disabled={busy}>
              {busy ? "Sending…" : "Send message"}
            </button>

            {sentId && (
              <div className={styles.note}>
                Ticket #{sentId} created — check your inbox for replies.
              </div>
            )}
          </form>
        </section>

        <aside className={`card ${styles.infoCard}`}>
          <h3 className={styles.title}>Get in touch</h3>
          <ul className={styles.infoList}>
            <li>
              <span>📧</span> support@hy-moda.com
            </li>
            <li>
              <span>📍</span>Haifa , Israel
            </li>
            <li>
              <span>⏰</span> Mon–Fri · 9:00–18:00
            </li>
          </ul>

          <div className={styles.helpBox}>
            <b>Tips</b>
            <ul>
              <li>Mention your order # if you have one.</li>
              <li>Attach details like color/size when asking product Qs.</li>
              <li>We reply within 24–48h on business days.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
