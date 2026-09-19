// --- UTILITIES ---
function simulateEvents(element) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("click", { bubbles: true }));
}

function waitForElement(selector, callback, timeout = 15000) {
  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), timeout);
}

function randomDigits(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function generateIndianName() {
  const names = ["Amit", "Rahul", "Abhinav", "Khushi", "Div", "Ankit", "Pooja"];
  const surnames = ["Sharma", "Verma", "Thakur", "Singh", "Tiwari", "Dixit"];
  const name = names[Math.floor(Math.random() * names.length)];
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  return {
    firstName: name,
    fullName: `${name} ${surname}`,
    username: `${name.toLowerCase()}${surname.toLowerCase()}${randomDigits(2)}`
  };
}

function generatePassword() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "@#$%&*!";

  const getRandom = (set) => set[Math.floor(Math.random() * set.length)];
  const length = Math.floor(Math.random() * (14 - 6 + 1)) + 6;

  let password = [getRandom(letters), getRandom(numbers), getRandom(symbols)];
  const allChars = letters + numbers + symbols;
  while (password.length < length) password.push(getRandom(allChars));

  return password.sort(() => Math.random() - 0.5).join("");
}

function generatePhone() {
  return "86" + randomDigits(8);
}

const generatedData = {
  ...generateIndianName(),
  password: generatePassword(),
  phone: generatePhone()
};

// --- SITE CONFIG ---
function getSiteConfig() {
  const host = window.location.hostname;
  const config = {
    selectors: {
      fullName: "input[name*='name'], input[id*='name'], input[placeholder*='name']",
      username: "input[name*='user'], input[id*='user'], input[placeholder*='user'], input[name*='login']",
      email: "input[type='email'], input[name*='email'], input[id*='email']",
      password: "input[type='password'], input[name*='pass'], input[id*='pass']",
      confirmPassword: "input[name*='confirm'], input[id*='confirm'], input[placeholder*='confirm']",
      phone: "input[type='tel'], input[name*='phone'], input[id*='phone'], input[placeholder*='phone']",
      terms: "input[id='agree'], label[for*='agree'], input[id$='_conditions']",
      robot: "input[name*='robot'], input[id*='robot'], label[for*='robot']"
    },
    otp: {
      inputSelectors: [
        "input[name*='otp']",
        "input[placeholder*='otp']",
        "input[name*='code']",
        "input[placeholder*='code']",
        "input[inputmode='numeric']"
      ]
    }
  };

  if (host.includes("shiksha.com")) {
    config.selectors.fullName = "input[id='uName'], input[name='name'], input[placeholder*='Full name']";
    config.selectors.phone = "input[id='uMobile'], input[name='phone'], input[placeholder*='Mobile']";
    config.selectors.terms = "input[id='agree'], input[id$='_conditions'], label[for*='agree']";
  }

  if (host.includes("worldsmmpanel.com")) {
    config.selectors.terms = "input[id*='terms'], label[for*='terms']";
  }

  return config;
}

// --- FILLERS ---
function autofillField(selector, value, desc = "") {
  const field = document.querySelector(selector);
  if (field) {
    field.focus();
    field.value = value;
    simulateEvents(field);
    console.log(`Filled ${desc || selector} with "${value}"`);
  }
}

function handleCheckboxes(config) {
  const site = window.location.hostname;

  if (site.includes("worldsmmpanel.com")) {
    const label = document.querySelector("label[for='terms']");
    const checkbox = document.querySelector("#terms");
    if (label) label.click();
    if (checkbox) {
      checkbox.checked = true;
      simulateEvents(checkbox);
    }
    return;
  }

  if (site.includes("shiksha.com")) {
    waitForElement("input[id$='_conditions'], input[id*='agree']", (checkbox) => {
      const label = document.querySelector(`label[for='${checkbox.id}']`);
      if (label) label.click();
      checkbox.checked = true;
      simulateEvents(checkbox);
    });
    return;
  }

  const label = Array.from(document.querySelectorAll("label")).find(l =>
    /agree|terms|condition/i.test(l.innerText)
  );
  if (label) {
    const checkbox = document.getElementById(label.getAttribute("for")) ||
                     label.querySelector("input[type='checkbox']");
    if (checkbox) {
      checkbox.checked = true;
      simulateEvents(checkbox);
      label.click();
    }
  }

  // Special case for Fotor
  const fotorCheckbox = document.querySelector(".checkBoxSignUp_inner");
  if (fotorCheckbox) {
    fotorCheckbox.click();
    console.log("☑️ Fotor checkbox clicked!");
  }
}

function autofillForm() {
  chrome.storage.sync.get("enabled", ({ enabled }) => {
    if (!enabled) return;

    const { fullName, username, password, phone } = generatedData;
    const config = getSiteConfig();

    chrome.runtime.sendMessage({ type: "get-email" }, (response) => {
        const { email } = response;  // Destructure the email directly from the response
        if (!email) {
            console.warn("Email not received from background script");
            return;
        }
   

      document.querySelectorAll("input").forEach(input => {
        if (input.readOnly || input.disabled) return;

        const hint = (input.name + input.id + input.placeholder).toLowerCase();
        if (hint.includes("name") && !hint.includes("user") && !input.value) input.value = fullName;
        else if (hint.includes("user") && !input.value) input.value = username;
        else if (hint.includes("email") && !input.value) input.value = email;
        else if (hint.includes("pass") && !hint.includes("confirm") && !input.value) input.value = password;
        else if (hint.includes("confirm") && !input.value) input.value = password;
        else if ((hint.includes("phone") || hint.includes("mobile") || hint.includes("whatsapp")) && !input.value) input.value = phone;

        simulateEvents(input);
      });

      autofillField(config.selectors.fullName, fullName, "Full Name");
      autofillField(config.selectors.username, username, "Username");
      autofillField(config.selectors.email, email, "Email");
      autofillField(config.selectors.password, password, "Password");
      autofillField(config.selectors.confirmPassword, password, "Confirm Password");
      autofillField(config.selectors.phone, phone, "Phone");

      // Special case for Fotor.com terms checkbox
      if (window.location.hostname.includes("fotor.com")) {
        setTimeout(() => {
        // 1. Fill the password field
        const fotorPasswordField = document.querySelector("#emailWayStepInputPassword");
        if (fotorPasswordField && !fotorPasswordField.value) {
          fotorPasswordField.value = password;
          simulateEvents(fotorPasswordField);
          console.log("✅ Filled Fotor Password!");
        } else {
          console.warn("❌ Fotor Password field not found");
        }
      
        // 2. Click the agreement checkbox
        const fotorCheckbox = document.querySelector(".checkBoxSignUp_inner");
        if (fotorCheckbox) {
          fotorCheckbox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          fotorCheckbox.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          fotorCheckbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          console.log("✅ Fotor terms checkbox clicked!");
        } else {
          console.warn("❌ Fotor agreement checkbox not found");
        }
      }, 500);
    }
      

      handleCheckboxes(config);

      const robotEl = document.querySelector(config.selectors.robot);
      if (robotEl) {
        robotEl.click();
        simulateEvents(robotEl);
      }

      chrome.runtime.sendMessage({ type: "get-otp" }, ({ code }) => {
        if (code) {
          config.otp.inputSelectors.forEach(sel => autofillField(sel, code, "OTP"));
          console.log("OTP filled:", code);
        }
      });
    });
  });
}
        

// --- SHIKSHA SPECIAL FLOW ---
function waitForOtpModalAndBypass() {
  if (!window.location.hostname.includes("shiksha.com")) return;

  console.log("👀 Waiting for OTP modal (Shiksha)...");

  const checkModal = setInterval(() => {
    const otpModalText = document.querySelector('div.verify-mobile-layer, div.verifyMobile-layer, div.reverificationAlignClass');

    if (otpModalText && otpModalText.textContent.toLowerCase().includes('one time password')) {
      console.log("✅ OTP Modal detected!");

      const closeBtn = document.querySelector('.cross-x');
      if (closeBtn) {
        console.log("❌ Clicking Cross button...");
        closeBtn.click();
      } else {
        console.log("⚠️ Cross button not found yet. Will retry...");
      }

      const waitForSkip = setInterval(() => {
        const skipBtn = Array.from(document.querySelectorAll('strong')).find(el => el.textContent.trim().toLowerCase() === 'skip');

        if (skipBtn) {
          console.log("➡️ Skip button detected! Clicking Skip...");
          skipBtn.click();
          clearInterval(waitForSkip);
        } else {
          console.log("🔄 Waiting for Skip button...");
        }
      }, 500);

      clearInterval(checkModal);
    } else {
      console.log("🔎 Still waiting for OTP text...");
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(checkModal);
  }, 20000);
}

// --- INIT EVERYTHING ---
window.addEventListener("load", () => {
  console.log("🌟 Page Loaded, starting...");

  setTimeout(() => {
    autofillForm();
    waitForOtpModalAndBypass();
  }, 2000);
});
