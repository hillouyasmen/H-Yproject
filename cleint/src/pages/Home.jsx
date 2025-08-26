import { Link } from "react-router-dom";
import styles from "../styles/Home.module.css";

export default function Home() {
  const categories = [
    {
      key: "dresses",
      title: "Elegant Dresses",
      img: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRuyXPuqr-oZ40Sy183OT4ARls8y32TE0RCDrU_nnFXHkVosjLx9TWDte1_lvz0ozXEDY66v7AK3Arklgba9RiARqsIq00C4ZIXOTecBukP9qzb9B0WHrknwzo5lZArT0Q2ZxuMuQ&usqp=CAc",
    },
    {
      key: "pajamas",
      title: "Cozy Pajamas",
      img: "https://cdn.shopify.com/s/files/1/2233/8277/files/BONNIE-NUIT-PAJAMA-WHITE-NAVY-3118.jpg?v=1697553533&width=400&height=537&crop=center",
    },
    {
      key: "tshirts",
      title: "Cute T-Shirts",
      img: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTdXhEhqn1F5OW5Rw_mrapEMGOXw0Aga6jq2Ka3WxlWdupSurw8VDtnctxOVuJH-QeBTiNJOCHRFcfZCuhiisXFwxp1jTxur-qsGDm3vZIlHFJ6Koahrwdb",
    },
    {
      key: "lingerie",
      title: "Lingerie",
      img: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS_KDRZRITKc3WrAKbEeDEdIXOXBpqpuWjGO5Q_xeGPesCG0qTVZ0xm9eIjiI4bdyOSfYUSsva_BZQU9VA_JpEnFlX6jmeLxN7qp1m_TsDB&usqp=CAc",
    },
  ];

  const picks = [
    {
      id: 1,
      name: "Satin Slip Dress",
      price: 79,
      img: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDZ8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 2,
      name: "Pastel Lounge Set",
      price: 49,
      img: "https://images.unsplash.com/photo-1612215327100-60fc5c4d7938?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTR8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 3,
      name: "Floral Tee",
      price: 29,
      img: "https://plus.unsplash.com/premium_photo-1675186049563-000f7ac02c44?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 4,
      name: "Silk Pajama",
      price: 59,
      img: "https://images.unsplash.com/photo-1559127452-56b800eb2f23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzZ8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    },
    {
      id: 5,
      name: "Ruffle Dress",
      price: 89,
      img: "https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    },
  ];

  const arrivals = [
    "https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1571513800374-df1bbe650e56?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1608748010899-18f300247112?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fGZhc2hpb258ZW58MHx8MHx8fDA%3D",
  ];

  return (
    <div className={styles.page}>
      {/* Background FX layers */}
      <div className={styles.aurora} aria-hidden />
      <div className={styles.grain} aria-hidden />

      {/* HERO */}
      <section className={styles.hero}>
        {/* decorative orbs */}
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

      {/* FEATURED CATEGORIES */}
      <section className={styles.strip}>
        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Featured categories</h2>
          <Link to="/store" className={styles.linkMore}>
            See all →
          </Link>
        </div>
        <div className={styles.catGrid}>
          {categories.map((c, i) => (
            <Link
              to={`/store?cat=${c.key}`}
              key={c.key}
              className={`${styles.catCard} ${styles.glass} ${styles.luxBorder}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={styles.media}
                style={{ backgroundImage: `url(${c.img})` }}
              />
              <div className={styles.catName}>{c.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* PICKS */}
      <section className={styles.strip}>
        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Picks for you</h2>
          <div className={styles.hint}>Curated softness & shine</div>
        </div>
        <div className={styles.snapWrap}>
          <div className={styles.edgeFade} aria-hidden />
          <div className={`${styles.snapRow} ${styles.scrollbarHidden}`}>
            {picks.map((p, i) => (
              <Link
                to={`/store?pick=${p.id}`}
                key={p.id}
                className={`${styles.card} ${styles.glass} ${styles.luxBorder}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className={styles.cardMedia}>
                  <img src={p.img} alt={p.name} loading="lazy" />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{p.name}</div>
                  <div className={styles.cardPrice}>${p.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
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
    </div>
  );
}
