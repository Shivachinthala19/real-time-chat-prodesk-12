const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  console.log("📦 Installing client dependencies...");
  execSync("npm install", { cwd: path.join(__dirname, "client"), stdio: "inherit" });

  console.log("🏗️ Building client...");
  execSync("npm run build", { cwd: path.join(__dirname, "client"), stdio: "inherit" });

  console.log("🚚 Moving build outputs to root dist...");
  const srcDist = path.join(__dirname, "client", "dist");
  const destDist = path.join(__dirname, "dist");

  if (fs.existsSync(destDist)) {
    fs.rmSync(destDist, { recursive: true, force: true });
  }
  fs.renameSync(srcDist, destDist);

  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
