// backend/utils/userCard.js

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => (p ? p[0].toUpperCase() : "")).join("") || "HM";
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    m === "&"
      ? "&amp;"
      : m === "<"
      ? "&lt;"
      : m === ">"
      ? "&gt;"
      : m === '"'
      ? "&quot;"
      : "&#39;"
  );
}

export function buildMemberCardSVG(user) {
  const stamp = new Date().toISOString().slice(0, 10);
  const shortId = String(user.user_id).padStart(6, "0");
  const init = initials(user.username);
  const shape = user.bodyshape_id ? `#${user.bodyshape_id}` : "—";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#FF6FAE"/>
      <stop offset="1" stop-color="#F6C8A5"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity=".18"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" rx="26" fill="white"/>
  <rect x="12" y="12" width="616" height="336" rx="22" fill="url(#g)" opacity=".14"/>
  <rect x="20" y="20" width="600" height="320" rx="20" fill="#fff" filter="url(#s)"/>

  <text x="40" y="80" fill="#d63384" font-family="Inter,Arial" font-size="22" font-weight="900">H&amp;Y Moda • Member Card</text>

  <circle cx="520" cy="110" r="36" fill="url(#g)"/>
  <text x="520" y="119" text-anchor="middle" fill="#fff" font-family="Inter,Arial" font-size="22" font-weight="900">${init}</text>

  <text x="40" y="128" fill="#241b25" font-family="Inter,Arial" font-size="28" font-weight="900">${escapeXml(
    user.username
  )}</text>
  <text x="40" y="160" fill="#7b7280" font-family="Inter,Arial" font-size="14" font-weight="700">${escapeXml(
    user.email
  )}</text>

  <g font-family="Inter,Arial" font-size="14" font-weight="800" fill="#241b25">
    <text x="40" y="210">User ID:</text>         <text x="140" y="210">#${shortId}</text>
    <text x="40" y="238">Role:</text>            <text x="140" y="238">${escapeXml(
      user.role || "customer"
    )}</text>
    <text x="40" y="266">Bodyshape:</text>       <text x="140" y="266">${shape}</text>
    <text x="40" y="294">Issued:</text>          <text x="140" y="294">${stamp}</text>
  </g>

  <rect x="410" y="260" width="190" height="40" rx="12" fill="url(#g)"/>
  <text x="505" y="286" text-anchor="middle" fill="#fff" font-family="Inter,Arial" font-size="16" font-weight="900">H&amp;Y Moda Club</text>
</svg>`;
}

export function buildMemberCardHTML(user) {
  return `
  <div style="font-family:Inter,Arial;padding:16px">
    <h2 style="margin:0 0 6px;color:#d63384">Your H&Y Moda Member Card</h2>
    <p style="margin:0 0 12px;color:#444">Hi <b>${escapeXml(
      user.username
    )}</b>, here is your member card. It’s attached and shown below:</p>
    <img src="https://media.silhouettedesignstore.com/media/catalog/product/cache/a05e733b55beec0e7e3c81551533e22c/w/e/welcome_to_our_world.jpg" alt="Member card" style="max-width:100%;border-radius:14px;border:1px solid #f3cfe0"/>
    <p style="margin:14px 0 0;color:#777;font-size:13px">User #${
      user.user_id
    } • ${escapeXml(user.email)}</p>
  </div>`;
}
