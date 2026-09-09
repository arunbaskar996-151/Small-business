// Small Business Financial Management & Profit Analysis System
// Auth UI controller

(function(){
  "use strict";
  const $ = (id) => document.getElementById(id);

  let mode = "login"; // "login" | "signup" | "reset"

  async function initAuthFlow(){
    if (!isSupabaseConfigured()){
      showConfigNeeded();
      return;
    }

    initSupabase();
    setupAuthFormHandlers();

    // onAuthStateChange fires immediately with the current session state
    // (on page load, on login, on logout, on token refresh) — so this
    // single listener is sufficient; no separate getSession() call needed.
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && session.user){
        currentUser = session.user;
        showApp();
      } else {
        currentUser = null;
        showAuthScreen();
      }
    });
  }

  function showConfigNeeded(){
    $("authLoading").classList.add("hidden");
    $("configNeededScreen").classList.remove("hidden");
  }

  function showAuthScreen(){
    $("appShellWrap").classList.add("hidden");
    $("authScreen").classList.remove("hidden");
    $("authLoading").classList.add("hidden");
    $("authForm").classList.remove("hidden");
  }

  function showApp(){
    $("authScreen").classList.add("hidden");
    $("appShellWrap").classList.remove("hidden");
    const name = currentUser.user_metadata && currentUser.user_metadata.business_name
      ? currentUser.user_metadata.business_name
      : currentUser.email;
    document.querySelectorAll(".biz-name").forEach(el => el.textContent = name);
    document.querySelectorAll(".user-email-display").forEach(el => el.textContent = currentUser.email);
    window.FMS_APP.start();
  }

  function setMode(newMode){
    mode = newMode;
    $("authError").classList.add("hidden");
    $("authTitle").textContent = mode === "login" ? "Log In" : mode === "signup" ? "Create Account" : "Reset Password";
    $("authSubtitle").textContent = mode === "login"
      ? "Log in to access your financial dashboard."
      : mode === "signup"
      ? "Set up your business account to get started."
      : "Enter your email to receive a password reset link.";
    $("businessNameField").classList.toggle("hidden", mode !== "signup");
    $("passwordField").classList.toggle("hidden", mode === "reset");
    $("authSubmitBtn").textContent = mode === "login" ? "Log In" : mode === "signup" ? "Create Account" : "Send Reset Link";
    $("authPassword").setAttribute("autocomplete", mode === "signup" ? "new-password" : "current-password");
    $("switchModeText").innerHTML = mode === "login"
      ? `Don't have an account? <button type="button" class="link-btn" id="toSignupBtn">Sign up</button>`
      : mode === "signup"
      ? `Already have an account? <button type="button" class="link-btn" id="toLoginBtn">Log in</button>`
      : `<button type="button" class="link-btn" id="toLoginBtn">Back to login</button>`;
    $("forgotPasswordRow").classList.toggle("hidden", mode !== "login");
    attachModeSwitchHandlers();
  }

  function attachModeSwitchHandlers(){
    const toSignup = $("toSignupBtn");
    const toLogin = $("toLoginBtn");
    if (toSignup) toSignup.addEventListener("click", () => setMode("signup"));
    if (toLogin) toLogin.addEventListener("click", () => setMode("login"));
  }

  function setupAuthFormHandlers(){
    setMode("login");

    $("forgotPasswordBtn").addEventListener("click", (e) => {
      e.preventDefault();
      setMode("reset");
    });

    $("authForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("authEmail").value.trim();
      const password = $("authPassword").value;
      const businessName = $("authBusinessName").value.trim();
      const errorBox = $("authError");
      errorBox.classList.add("hidden");

      if (!email){
        showAuthError("Please enter your email address.");
        return;
      }
      if (mode !== "reset" && !password){
        showAuthError("Please enter your password.");
        return;
      }

      const submitBtn = $("authSubmitBtn");
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Please wait...";

      if (mode === "login"){
        const { error } = await signIn(email, password);
        if (error) showAuthError(friendlyAuthError(error));
      } else if (mode === "signup"){
        const { data, error } = await signUp(email, password, businessName);
        if (error){
          showAuthError(friendlyAuthError(error));
        } else if (data.user && !data.session){
          showAuthError("Account created! Please check your email to confirm your address before logging in.", true);
          setMode("login");
        }
      } else if (mode === "reset"){
        const { error } = await resetPasswordForEmail(email);
        if (error){
          showAuthError(friendlyAuthError(error));
        } else {
          showAuthError("If an account exists for that email, a reset link has been sent.", true);
        }
      }

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });

    $("logoutBtn").addEventListener("click", async () => {
      await signOut();
    });
  }

  function showAuthError(msg, isInfo){
    const box = $("authError");
    box.textContent = msg;
    box.classList.remove("hidden");
    box.classList.toggle("info", !!isInfo);
  }

  initAuthFlow();
})();
