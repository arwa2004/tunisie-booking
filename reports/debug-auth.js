// Quick verification: test if a hardcoded token works for GET /me
const axios = require("axios").create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 5000,
  validateStatus: () => true,
});

(async () => {
  // Step 1: Login and get token
  const loginRes = await axios.post("/login", {
    email: "admin@gmail.com",
    password: "admin1234",
  });
  console.log("Login status:", loginRes.status);
  const token = loginRes.data?.token || loginRes.data?.access_token;
  console.log("Token from login:", token ? token.substring(0, 20) + "..." : "NULL");
  console.log("Full login response:", JSON.stringify(loginRes.data).substring(0, 200));

  if (!token) {
    console.log("No token obtained!");
    return;
  }

  // Step 2: Try GET /me with the token
  const meRes = await axios.get("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("\nGET /me status:", meRes.status);
  console.log("GET /me response:", JSON.stringify(meRes.data).substring(0, 200));

  // Step 3: Also try with a manually injected Sanctum token (from debug-token.php)
  const hardcoded = "19|Ey7AiqIQeacdEzWUvmKqye9TpQdvSSiZmMaMo2l003920b86";
  const meRes2 = await axios.get("/me", {
    headers: { Authorization: `Bearer ${hardcoded}` },
  });
  console.log("\nGET /me (hardcoded token) status:", meRes2.status);
  console.log("GET /me (hardcoded token) response:", JSON.stringify(meRes2.data).substring(0, 200));
})();
