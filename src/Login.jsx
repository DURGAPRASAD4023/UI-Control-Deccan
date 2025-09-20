import { useGoogleLogin } from "@react-oauth/google";
import { useState, useEffect } from "react";
import App from "./App";

export default function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("google_access_token");
    if (token) setIsLoggedIn(true);
  }, []);

  // const login = useGoogleLogin({
  //   flow: "implicit",  
  //   scope: "https://www.googleapis.com/auth/drive.readonly",
  //   hosted_domain: "deccan.ai",
  //   onSuccess: (tokenResponse) => {
  //     localStorage.setItem("google_access_token", tokenResponse.access_token);
  //     setIsLoggedIn(true);
  //   },
  //   onError: () => alert("Login failed"),
  // });

  const login = useGoogleLogin({
    flow: "implicit",
    scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email",
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google's API
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
          }
        });
        const userInfo = await userInfoResponse.json();
        const userDomain = userInfo.hd; // 'hd' is the hosted domain property
        
        const allowedDomains = ["deccan.ai", "getdeccan.ai"];
  
        if (allowedDomains.includes(userDomain)) {
          // User is from an allowed domain
          localStorage.setItem("google_access_token", tokenResponse.access_token);
          setIsLoggedIn(true);
        } else {
          // User is not from an allowed domain
          alert("Login failed: Your email domain is not permitted.");
        }
      } catch (error) {
        alert("Login failed: Could not verify domain.");
      }
    },
    onError: () => alert("Login failed"),
  });

  const handleLogout = () => {
    localStorage.removeItem("google_access_token");
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return <App onLogout={handleLogout} />; 
  }

  return (
    <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "100px",
  }}
>
  <h1>Welcome to Agent Task Explorer</h1>
  <button
    onClick={() => login()}
    style={{
      padding: "10px 20px",
      fontSize: "1rem",
      borderRadius: "6px",
      backgroundColor: "#000",   
      color: "#fff",           
      border: "none",
      cursor: "pointer",
    }}
  >
    Login with Google
  </button>
</div>

  );
}
