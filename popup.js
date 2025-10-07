// ---- Password generator ----
function generatePassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`-=";
  const all = upper + lower + numbers + symbols;

  if (length < 8) length = 8;

  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
}

// ---- WebCrypto helpers ----
async function deriveKey(password, salt, iterations = 200000, keyLen = 256) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: keyLen },
    false,
    ["encrypt", "decrypt"]
  );
}

function randomBytes(len = 16) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

async function encryptPassword(plain, masterPass) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(masterPass, salt);
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  return { ciphertext: bufToBase64(ct), iv: bufToBase64(iv), salt: bufToBase64(salt) };
}

async function decryptPassword({ ciphertext, iv, salt }, masterPass) {
  const key = await deriveKey(masterPass, base64ToBuf(salt));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBuf(iv) }, key, base64ToBuf(ciphertext));
  return new TextDecoder().decode(pt);
}

// ---- Storage helpers ----
function saveEncrypted(name, blob) {
  const store = {};
  store[name] = blob;
  return new Promise((resolve) => chrome.storage.local.set(store, resolve));
}

function getEncrypted(name) {
  return new Promise((resolve) => chrome.storage.local.get([name], (res) => resolve(res[name])));
}

function deleteEncrypted(name) {
  return new Promise((resolve) => chrome.storage.local.remove([name], resolve));
}

// ---- DOM & Events ----
document.getElementById("generate").addEventListener("click", () => {
  const length = parseInt(document.getElementById("length").value) || 12;
  const pwd = generatePassword(length);
  const pwdInput = document.getElementById("password");
  pwdInput.type = "password";
  pwdInput.value = pwd;
});

document.getElementById("copy").addEventListener("click", async () => {
  const pwd = document.getElementById("password").value;
  try {
    await navigator.clipboard.writeText(pwd);
    const note = document.getElementById("note");
    if (note) { note.textContent = "Copied!"; setTimeout(() => (note.textContent = ""), 1500); }
  } catch (e) { alert("Clipboard failed: " + e.message); }
});

document.getElementById("fill").addEventListener("click", async () => {
  const pwd = document.getElementById("password").value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (password) => {
      const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
      function setValue(input, value) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, value);
        ["input", "change", "blur", "focus"].forEach((ev) => input.dispatchEvent(new Event(ev, { bubbles: true })));
      }
      inputs.forEach((input) => setValue(input, password));
    },
    args: [pwd],
  });
});

// Toggle generated password
document.getElementById("togglePwd").addEventListener("click", () => {
  const pwdInput = document.getElementById("password");
  pwdInput.type = pwdInput.type === "password" ? "text" : "password";
});

// Save password
document.getElementById("saveBtn").addEventListener("click", async () => {
  const name = document.getElementById("saveName").value;
  const pwd = document.getElementById("password").value;
  const masterPass = document.getElementById("saveMasterPass").value;
  if (!name || !pwd || !masterPass) return alert("Enter label, password, and master pass");

  const enc = await encryptPassword(pwd, masterPass);
  await saveEncrypted(name, enc);
  const note = document.getElementById("note");
  if (note) { note.textContent = "Saved encrypted."; setTimeout(() => (note.textContent = ""), 2000); }

  loadSavedDropdown();
});

// Load saved passwords dropdown
function loadSavedDropdown() {
  chrome.storage.local.get(null, (items) => {
    const select = document.getElementById("savedPasswords");
    select.innerHTML = '<option value="">--Select saved password--</option>';
    Object.keys(items).forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key;
      select.appendChild(opt);
    });
  });
}
document.addEventListener("DOMContentLoaded", loadSavedDropdown);

// Fill saved password
document.getElementById("fillSaved").addEventListener("click", async () => {
  const label = document.getElementById("savedPasswords").value;
  const masterPass = document.getElementById("masterPass").value;
  if (!label || !masterPass) return alert("Select saved password and enter master pass");

  const stored = await getEncrypted(label);
  if (!stored) return alert("Saved password not found");

  let pwd;
  try { pwd = await decryptPassword(stored, masterPass); } 
  catch (e) { return alert("Failed to decrypt. Wrong master pass?"); }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (password) => {
      const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
      function setValue(input, value) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, value);
        ["input", "change", "blur", "focus"].forEach((ev) => input.dispatchEvent(new Event(ev, { bubbles: true })));
      }
      inputs.forEach((input) => setValue(input, password));
    },
    args: [pwd],
  });
});

// Toggle saved password reveal
document.getElementById("toggleSavedPwd").addEventListener("click", async () => {
  const display = document.getElementById("savedPasswordDisplay");

  if (display.type === "text") {
    display.type = "password";
    display.value = "";
    return;
  }

  const label = document.getElementById("savedPasswords").value;
  const masterPass = document.getElementById("masterPass").value;
  if (!label || !masterPass) return alert("Select saved password and enter master pass");

  const stored = await getEncrypted(label);
  if (!stored) return alert("Saved password not found");

  try {
    display.value = await decryptPassword(stored, masterPass);
    display.type = "text"; 
  } catch (e) {
    alert("Failed to decrypt. Wrong master pass?");
  }
});

// Delete saved password
document.getElementById("deleteSaved").addEventListener("click", async () => {
  const label = document.getElementById("savedPasswords").value;
  if (!label) return alert("Select a saved password to delete");

  if (confirm(`Delete saved password "${label}"?`)) {
    await deleteEncrypted(label);
    loadSavedDropdown();
    document.getElementById("savedPasswordDisplay").value = "";
    document.getElementById("note").textContent = "Deleted";
    setTimeout(() => (document.getElementById("note").textContent = ""), 2000);
  }
});
