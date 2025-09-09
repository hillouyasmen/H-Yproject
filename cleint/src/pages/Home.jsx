// src/pages/Home.jsx
import { Link } from "react-router-dom";
import styles from "../styles/Home.module.css";

export default function Home() {
  const arrivals = [
    "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    "https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  ];

  return (
    <div className={styles.page}>
      {/* Background FX layers */}
      <div className={styles.aurora} aria-hidden />
      <div className={styles.grain} aria-hidden />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={`${styles.orb} ${styles.orb1}`} aria-hidden />
        <div className={`${styles.orb} ${styles.orb2}`} aria-hidden />
        <div className={`${styles.orb} ${styles.orb3}`} aria-hidden />

        <div className={styles.heroLeft}>
          <div className={`${styles.brand} ${styles.brandFx}`}>
            H&Y <span>Moda</span>
          </div>
          <h1 className={`${styles.h1} ${styles.gradTitle}`}>
            Luxury & feminine fashion for your bodyshape
          </h1>
          <p className={styles.lead}>
            Curated silhouettes, soft palettes, and pieces that flatter—always.
          </p>
          <div className={styles.ctaRow}>
            <Link
              className={`${styles.primaryBtn} ${styles.shine} ${styles.luxBorder}`}
              to="/bodyshape"
            >
              Find my body shape
            </Link>
            <Link
              className={`${styles.ghostBtn} ${styles.luxOutline}`}
              to="/store"
            >
              Shop now
            </Link>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={`${styles.tileTall} ${styles.float}`} />
          <div className={`${styles.tileSquare} ${styles.tilt}`} />
          <div className={`${styles.tileSquare} ${styles.tiltReverse}`} />
        </div>
      </section>

      {/* 🔥 CLUB  (eatured categories & Picks) */}
      <section className={styles.contactCta}>
        <div className={styles.contactBox}>
          <div className={styles.contactLeft}>
            <div className={styles.contactKicker}>H&Y Moda Club</div>
            <h3 className={styles.contactTitle}>Join the club & glow ✨</h3>
            <p className={styles.contactText}>
              Personalized picks for your bodyshape, early access to drops,
              members-only pricing, and monthly style tips—crafted softly for
              you.
            </p>

            <ul style={{ margin: "10px 0 18px 18px", lineHeight: 1.8 }}>
              <li>7-day free trial for new members</li>
              <li>Exclusive discounts & early releases</li>
              <li>Curated outfits that flatter your shape</li>
            </ul>

            <div className={styles.contactActions}>
              <Link
                className={`${styles.primaryBtn} ${styles.shine}`}
                to="/club"
              >
                Start free trial
              </Link>
              <Link className={styles.linkMore} to="/club">
                See monthly & yearly plans →
              </Link>
            </div>
          </div>

          <div className={styles.contactRight} aria-hidden>
            <div
              className={styles.contactImage}
              style={{
                backgroundImage:
                  "url(https://i.pinimg.com/1200x/4d/5e/fe/4d5efee616acb83bbe620a31080075fe.jpg)",
              }}
            />
            <div className={styles.contactGlow} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS – Bodyshape */}
      <section className={styles.how}>
        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Find your perfect fit</h2>
        </div>

        <div className={styles.howGrid}>
          <div
            className={`${styles.step} ${styles.glass} ${styles.luxBorderSoft}`}
          >
            <div className={styles.stepIcon}>🧭</div>
            <div className={styles.stepTitle}>Tell us your shape</div>
            <div className={styles.stepText}>
              Simple guided quiz to pick your bodyshape within a minute.
            </div>
          </div>

          <div
            className={`${styles.step} ${styles.glass} ${styles.luxBorderSoft}`}
          >
            <div className={styles.stepIcon}>🎯</div>
            <div className={styles.stepTitle}>Curated matches</div>
            <div className={styles.stepText}>
              We highlight silhouettes & fabrics that flatter your shape.
            </div>
          </div>

          <div
            className={`${styles.step} ${styles.glass} ${styles.luxBorderSoft}`}
          >
            <div className={styles.stepIcon}>✨</div>
            <div className={styles.stepTitle}>Shop confidently</div>
            <div className={styles.stepText}>
              Browse categories tailored to you—no more guesswork.
            </div>
          </div>
        </div>

        <div className={styles.howCtaRow}>
          <Link
            className={`${styles.primaryBtn} ${styles.shine}`}
            to="/bodyshape"
          >
            Find my bodyshape
          </Link>
          <Link className={styles.ghostBtn} to="/about">
            How it works
          </Link>
        </div>
      </section>

      {/* JUST ARRIVED */}
      <section className={styles.strip}>
        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Just arrived</h2>
          <span className={styles.hint}>Fresh pinks & dreamy textures</span>
        </div>
        <div className={styles.arrivalsGrid}>
          {arrivals.map((src, i) => (
            <div
              className={`${styles.arrival} ${styles.luxBorderSoft}`}
              key={i}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img src={src} alt={`arrival-${i}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT US */}
      <section className={styles.contactCta}>
        <div className={styles.contactBox}>
          <div className={styles.contactLeft}>
            <div className={styles.contactKicker}>Need a second opinion?</div>
            <h3 className={styles.contactTitle}>We’d love to help 💌</h3>
            <p className={styles.contactText}>
              Styling questions, sizing doubts, or special requests—drop us a
              message and our team will get back with a gentle touch.
            </p>
            <div className={styles.contactActions}>
              <Link
                className={`${styles.primaryBtn} ${styles.shine}`}
                to="/contact"
              >
                Contact us
              </Link>
              <Link className={styles.linkMore} to="/about">
                Meet H&Y Moda →
              </Link>
            </div>
          </div>
          <div className={styles.contactRight} aria-hidden>
            <div className={styles.contactImage} />
            <div className={styles.contactGlow} />
          </div>
        </div>
      </section>
    </div>
  );
}
