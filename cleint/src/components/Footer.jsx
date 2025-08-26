import styles from '../styles/Footer.module.css'

export default function Footer(){
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerInner}>
          <div>
            <div style={{color:'var(--pink-strong)',fontWeight:800,fontSize:'1.1rem'}}>H&Y Moda</div>
            <div className={styles.copy}>© 2025 H&Y Moda. All rights reserved.</div>
          </div>
          <div className={styles.cols}>
            <div>
              <div className="badge">Shop</div>
              <ul>
                <li>Dresses</li><li>Jeans</li><li>Shoes</li>
              </ul>
            </div>
            <div>
              <div className="badge">Support</div>
              <ul>
                <li>Contact</li><li>Returns</li><li>Shipping</li>
              </ul>
            </div>
            <div>
              <div className="badge">Follow</div>
              <ul>
                <li>Instagram</li><li>TikTok</li><li>Pinterest</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
