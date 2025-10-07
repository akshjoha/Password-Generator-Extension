function checkStrength(password){
  let strength=0;
  if(password.length>=8) strength++;
  if(password.length>=12) strength++;
  if(/[A-Z]/.test(password)) strength++;
  if(/[a-z]/.test(password)) strength++;
  if(/[0-9]/.test(password)) strength++;
  if(/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}

function showMessage(input,message,color){
  let msg=input.nextElementSibling;
  if(!msg||!msg.classList.contains("pwd-strength-msg")){
    msg=document.createElement("div");
    msg.className="pwd-strength-msg";
    msg.style.fontSize="12px";
    msg.style.marginTop="2px";
    input.parentNode.insertBefore(msg,input.nextSibling);
  }
  msg.textContent=message;
  msg.style.color=color;
}

document.addEventListener("input",(e)=>{
  if(e.target.type==="password"){
    const password=e.target.value;
    const hasUpper=/[A-Z]/.test(password);
    const hasLower=/[a-z]/.test(password);
    const hasNumber=/[0-9]/.test(password);
    const hasSpecial=/[^A-Za-z0-9]/.test(password);
    const strength=checkStrength(password);
    if(!hasUpper||!hasLower||!hasNumber||!hasSpecial||strength<5) showMessage(e.target,"⚠️ Weak password! Must include uppercase, lowercase, number & symbol.","red");
    else if(strength<6) showMessage(e.target,"🟡 Medium password.","orange");
    else showMessage(e.target,"✅ Strong password!","green");
  }
});
