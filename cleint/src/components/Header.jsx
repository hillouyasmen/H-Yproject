import { NavLink, Link } from "react-router-dom";
import styles from "../styles/Header.module.css";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Header() {
  // اجعلها آمنة لو الـ context غير متاح لسبب ما
  const auth = useAuth() || {};
  const { user, logout } = auth;
  const isAdmin = user?.role === "admin";

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headWrap}>
          {/* Brand */}
          <div className={styles.brand}>
            <span aria-hidden>💖</span>
            <Link
              to={isAdmin ? "/admin" : "/"}
              className={styles.brandLink}
              aria-label="H&Y Moda"
            >
              H&Y Moda
            </Link>
          </div>

          {/* Nav */}
          <nav className={styles.nav}>
            {!isAdmin ? (
              <>
                <NavLink to="/" end>
                  Home
                </NavLink>
                <NavLink to="/store">Store</NavLink>
                <NavLink to="/bodyshape">Bodyshape</NavLink>
                <NavLink to="/categories">Categories</NavLink>
                <NavLink to="/club">Club</NavLink>
                <NavLink to="/contact">Contact</NavLink>
                <NavLink to="/about">About</NavLink>
              </>
            ) : (
              <NavLink to="/admin">Admin</NavLink>
            )}
          </nav>

          {/* CTAs */}
          <div className={styles.ctas}>
            {/* سلة للزبون فقط */}
            {user && !isAdmin && (
              <NavLink to="/cart" className={styles.cartBtn} title="Cart">
                <span className={styles.cartIcon}>🛒</span>
              </NavLink>
            )}

            {user ? (
              <>
                {!isAdmin && (
                  <NavLink to="/profile" className={styles.profileLink}>
                    Hi, {user.username}
                  </NavLink>
                )}
                <button className={styles.logoutBtn} onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={`${styles.authLink} ${styles.loginLink}`}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={`${styles.authLink} ${styles.registerLink}`}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
