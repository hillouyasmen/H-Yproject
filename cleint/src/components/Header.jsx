// src/components/Header.jsx  (أو نفس مسارك الحالي)
import { NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "../styles/Header.module.css";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import NotificationsBell from "./NotificationsBell.jsx";
export default function Header() {
  const auth = useAuth() || {};
  const { user, logout } = auth;
  const isAdmin = user?.role === "admin";

  // عدّاد السلة + نبضة أنيميشن عند الزيادة
  const { itemCount } = useCart() || { itemCount: 0 };
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (itemCount > 0) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [itemCount]);

  const displayCount = itemCount > 99 ? "99+" : itemCount;

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headWrap}>
          {/* Brand */}
          <div className={styles.brand}>
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
            {/* ✅ جرس إشعارات الأدمن */}
            {isAdmin && <NotificationsBell />}

            {/* سلة للزبون فقط */}
            {user && !isAdmin && (
              <NavLink
                to="/cart"
                className={styles.cartBtn}
                title="Cart"
                aria-label="Cart"
              >
                <span className={styles.cartIcon} aria-hidden>
                  🛒
                </span>
                {itemCount > 0 && (
                  <span
                    className={`${styles.cartBadge} ${bump ? styles.bump : ""}`}
                    aria-label={`${itemCount} items in cart`}
                  >
                    {displayCount}
                  </span>
                )}
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
