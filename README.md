# Secure Password Manager Chrome Extension

A minimalist, black-themed Chrome extension to **generate, save, fill, and manage passwords securely** with AES-GCM encryption.

---

## **Features**

- Generate strong random passwords with configurable length (8–32 characters).  
- Copy generated password to clipboard.  
- Fill password automatically into any password field on the active page.  
- Save passwords securely with a **master password**.  
- Reveal or hide both generated and saved passwords with a toggle.  
- Delete saved passwords individually.  
- All saved passwords are encrypted using **AES-GCM** and stored in **Chrome local storage**.  

---

## **Installation**

1. Clone or download the repository.  
2. Open Chrome and navigate to `chrome://extensions/`.  
3. Enable **Developer mode** (top-right).  
4. Click **Load unpacked** and select the folder containing the extension.  
5. The extension icon will appear in the Chrome toolbar.  

---

## **Usage**

### **Generate a Password**
1. Enter desired length (default 12).  
2. Click **Generate**.  
3. Toggle visibility using the 👁️ icon if needed.  
4. Copy password using **Copy** or auto-fill into a password field using **Fill**.  

### **Save a Password**
1. Enter a **Label** for the password.  
2. Enter a **Master Password**.  
3. Click **Save**.  
4. Saved passwords can be accessed from the dropdown.  

### **Manage Saved Passwords**
- **Fill Saved**: Select a saved password, enter the master password, and click **Fill Saved** to fill it into a password field.  
- **Toggle Visibility**: Use the 👁️ icon to temporarily reveal the saved password.  
- **Delete**: Click the 🗑️ icon to remove the saved password securely.  

---

## **Security**

- Passwords are **encrypted before being saved** using AES-GCM with a key derived from your master password.  
- The **master password is never stored**.  
- Saved passwords remain encrypted in Chrome’s local storage.  
- Without the master password, decrypted passwords cannot be retrieved.  

**Storage Location (Windows):**  
C:\Users<YourUserName>\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings<extension-id>\
> Data is stored in LevelDB format and cannot be read directly without the master password.  

---

## **Technical Details**

- **Technologies:** HTML, CSS, JavaScript, Chrome Extension APIs.  
- **Encryption:** Web Crypto API, AES-GCM, PBKDF2 key derivation.  
- **Popup UI:** Minimalist black theme with intuitive buttons for all actions.  

---

## **Notes**

- Deleting the extension will remove all stored passwords.  
- Always remember your **master password**; without it, saved passwords cannot be decrypted.  
- This extension does **not sync passwords** to the cloud; it is fully local and offline.  
