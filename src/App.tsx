import { useEffect, useState } from "react";
import "./App.css";

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type Step = "idle" | "checking" | "connecting" | "done" | "error";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (!tokenFromUrl) {
      setStep("error");
      setErrorMessage("Missing authentication token");
      return;
    }

    runFlow(tokenFromUrl);
  }, []);

  async function runFlow(authToken: string) {
    try {
      setStep("checking");

      // 1️⃣ Get Profile
      const profileResp = await fetch("/api/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!profileResp.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profileData: User = await profileResp.json();
      setUser(profileData);

      // 2️⃣ Connect Wallet
      setStep("connecting");
      await connectWallet(authToken);

      // 3️⃣ Success
      setStep("done");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Something went wrong");
      setStep("error");
    }
  }

  async function connectWallet(authToken: string) {
    if (!(window as any).ethereum) {
      throw new Error("MetaMask not detected");
    }

    const accounts = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    const address = accounts[0];
    const message = "I am connecting my wallet to Slice platform";

    const signature = await (window as any).ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });

    const chainId = await (window as any).ethereum.request({
      method: "eth_chainId",
    });

    const payload = {
      walletAddress: address,
      walletType: "metamask",
      chainId: parseInt(chainId, 16),
      signature,
      message,
    };

    const connectResp = await fetch("/api/users/wallets/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!connectResp.ok) {
      throw new Error("Wallet connection failed");
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      {step === "idle" && <h2>Initializing...</h2>}
      {step === "checking" && <h2>Checking profile...</h2>}
      {step === "connecting" && (
        <div>
          <h3>
            Welcome <span>{user?.username}</span>
          </h3>
          <span>Connecting wallet...</span>
        </div>
      )}
      {step === "done" && (
        <>
          <h2>Wallet connected successfully ✅</h2>
          <div>
            <a
              href={`slice://`}
              style={{
                padding: "16px 32px",
                background: "#3b82f6",
                color: "white",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: "bold",
                marginTop:12
              }}
            >
              Return to App
            </a>
          </div>
        </>
      )}
      {step === "error" && (
        <>
          <h2>Something went wrong ❌</h2>
          <p>{errorMessage}</p>
        </>
      )}
    </div>
  );
}

export default App;
