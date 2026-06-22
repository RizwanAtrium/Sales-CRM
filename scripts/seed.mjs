import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Set MONGODB_URI before running npm run seed");

await mongoose.connect(uri);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  passwordHash: { type: String, select: false },
  role: String,
  active: Boolean,
}, { timestamps: true });

const catalogSchema = new mongoose.Schema({
  type: String,
  name: String,
  active: Boolean,
  sortOrder: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });
catalogSchema.index({ type: 1, name: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const CatalogItem = mongoose.models.CatalogItem || mongoose.model("CatalogItem", catalogSchema);

const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@thefinedudes.com").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
if (!password || password.length < 12) throw new Error("Set SEED_ADMIN_PASSWORD to at least 12 characters");

const admin = await User.findOneAndUpdate(
  { email },
  { name: "Asad", email, passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN", active: true },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const managerEmail = (process.env.SEED_MANAGER_EMAIL ?? "manager@thefinedudes.com").toLowerCase();
const teamLeadEmail = (process.env.SEED_TEAM_LEAD_EMAIL ?? "teamlead@thefinedudes.com").toLowerCase();
const agentEmail = (process.env.SEED_AGENT_EMAIL ?? "agent@thefinedudes.com").toLowerCase();
const testPassword = process.env.SEED_TEST_PASSWORD ?? password;

const manager = await User.findOneAndUpdate(
  { email: managerEmail },
  { name: "Sales Manager", email: managerEmail, passwordHash: await bcrypt.hash(testPassword, 12), role: "MANAGER", active: true },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const teamLead = await User.findOneAndUpdate(
  { email: teamLeadEmail },
  { name: "Team Lead", email: teamLeadEmail, passwordHash: await bcrypt.hash(testPassword, 12), role: "TEAM_LEAD", manager: manager._id, active: true },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

await User.findOneAndUpdate(
  { email: agentEmail },
  { name: "Sales Agent", email: agentEmail, passwordHash: await bcrypt.hash(testPassword, 12), role: "AGENT", teamLead: teamLead._id, active: true },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const services = ["Website", "Google Business Profile (GMB)", "SEO", "Logo / Design", "Brand Guidelines", "Video Editing", "Community Management", "Ads Management", "Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube", "X (Twitter)", "Google Ads", "YouTube Ads", "AI Content Creation"];
const leadSources = ["Cold Calling", "Meta / Facebook Ads", "LinkedIn Outreach", "Google / SEO", "Referral", "Other"];

for (const [index, name] of services.entries()) {
  await CatalogItem.updateOne({ type: "SERVICE", name }, { $setOnInsert: { type: "SERVICE", name, active: true, sortOrder: index, createdBy: admin._id } }, { upsert: true });
}
for (const [index, name] of leadSources.entries()) {
  await CatalogItem.updateOne({ type: "LEAD_SOURCE", name }, { $setOnInsert: { type: "LEAD_SOURCE", name, active: true, sortOrder: index, createdBy: admin._id } }, { upsert: true });
}

console.log(`Seed complete: ${email}, ${managerEmail}, ${teamLeadEmail}, ${agentEmail}, ${services.length} services, ${leadSources.length} lead sources`);
await mongoose.disconnect();
