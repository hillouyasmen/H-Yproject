import styles from "../styles/About.module.css";

export default function About() {
  return (
    <section className={styles.about}>
      <div className={styles.card}>
        <h2 className={styles.title}>About H&Y Moda</h2>
        <p className={styles.description}>
          <strong>H&Y Moda</strong> was founded with love and passion by two
          young dreamers from Galilee.
        </p>

        <div className={styles.founders}>
          <div className={styles.founder}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmwVQt4wVlLtz0DQcOc1APvdTYV28Of7bjO_fN01nrDNjKPsYerQC76zmU05xOC-jEMZ0&usqp=CAU"
              alt="Hazem Habrat"
            />
            <h3>Hazem Habrat</h3>
            <p>
              24 years old, from Cana of Galilee. A visionary in fashion &
              technology, bringing creativity and structure into the boutique.
            </p>
          </div>
          <div className={styles.founder}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFVjbuSjnaf5LYBsmY8kOQKOxYZIn6j7UG7Izb0PY0ZB9Oi8G7p6KoKoWpztOMOUH_6Dw&usqp=CAU"
              alt="Yasmen Hilou"
            />
            <h3>Yasmen Hilou</h3>
            <p>
              22 years old, from Arraba. The heart of the project, with a modern
              feminine touch and elegant design sense.
            </p>
          </div>
        </div>

        <p className={styles.closing}>
          Together, Hazem & Yasmen created a{" "}
          <span>feminine, modern boutique</span> focused on
          <span> body-shape friendly fashion</span>, pink vibes, elegant UI, and
          a seamless shopping experience.
        </p>
      </div>
    </section>
  );
}
