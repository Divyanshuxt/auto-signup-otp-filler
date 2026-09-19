let mailData = {
  address: null,
  password: null,
  token: null,
  id: null
};

const MAIL_TM_BASE = "https://api.mail.tm";

async function getRandomMailDomain() {
  const res = await fetch(`${MAIL_TM_BASE}/domains`);
  const data = await res.json();
  return data["hydra:member"][0].domain; // Get a valid domain
}

function generateRandomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function createMailAccount() {
  const domain = await getRandomMailDomain();
  const username = generateRandomString();
  const email = `${username}@${domain}`;
  const password = generateRandomString(12);

  const res = await fetch(`${MAIL_TM_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password })
  });

  if (!res.ok) throw new Error("Failed to create Mail.tm account");

  mailData.address = email;
  mailData.password = password;

  return loginToMailTM();
}

async function loginToMailTM() {
  const res = await fetch(`${MAIL_TM_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: mailData.address, password: mailData.password })
  });

  if (!res.ok) throw new Error("Failed to login to Mail.tm");

  const data = await res.json();
  mailData.token = data.token;
  return getMailAccountId();
}

async function getMailAccountId() {
  const res = await fetch(`${MAIL_TM_BASE}/me`, {
    headers: { Authorization: `Bearer ${mailData.token}` }
  });
  const data = await res.json();
  mailData.id = data.id;
  return true;
}

async function waitForOtp() {
  const maxAttempts = 30;
  const delay = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    console.log("Checking for OTP...");

    const res = await fetch(`${MAIL_TM_BASE}/messages`, {
      headers: { Authorization: `Bearer ${mailData.token}` }
    });

    const data = await res.json();
    const messages = data["hydra:member"];

    if (messages.length > 0) {
      const messageId = messages[0].id;
      const messageRes = await fetch(`${MAIL_TM_BASE}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${mailData.token}` }
      });
      const messageData = await messageRes.json();

      const body = messageData.text || messageData.html || "";
      const otp = extractOtp(body);
      if (otp) return otp;
    }

    await new Promise(res => setTimeout(res, delay));
  }

  throw new Error("OTP not received in time.");
}

function extractOtp(text) {
  const match = text.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

// Message Listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "get-email") {
    if (mailData.address) {
      sendResponse({ email: mailData.address });
    } else {
      createMailAccount().then(() => {
        sendResponse({ email: mailData.address });
      }).catch(err => {
        console.error(err);
        sendResponse({ email: null });
      });
    }
    return true;
  }

  if (msg.type === "get-otp") {
    waitForOtp().then(code => {
      sendResponse({ code });
    }).catch(err => {
      console.error("OTP Fetch Error:", err);
      sendResponse({ code: null });
    });
    return true;
  }
});
