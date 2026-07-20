import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(root, "index.html");
const html = await readFile(htmlPath, "utf8");
const robots = await readFile(resolve(root, "robots.txt"), "utf8");
const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
const failures = [];
const requiredFiles = [
  "css/styles.css",
  "data/portfolio.json",
  "js/site.js",
  "images/og-card.png",
  "images/selfie_formal.jpg",
  "images/whatsapp.svg",
  "robots.txt",
  "sitemap.xml",
  "Shrikant Shet_FullStack_Resume.pdf",
];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
const references = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
const expectedNavigationTargets = [
  "#testimonials",
  "#ai",
  "#work",
  "#timeline",
  "#practice",
  "#foundations",
  "#community",
  "#contact",
];

for (const file of requiredFiles) {
  try {
    await access(resolve(root, file));
  } catch {
    failures.push(`Missing required site file: ${file}`);
  }
}

for (const reference of references) {
  if (reference.startsWith("#")) {
    assert(ids.has(reference.slice(1)), `Missing anchor target: ${reference}`);
    continue;
  }
  if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;

  const cleanPath = decodeURIComponent(reference.split(/[?#]/)[0]);
  const localPath = cleanPath.startsWith("/") ? resolve(root, `.${cleanPath}`) : resolve(root, cleanPath);
  try {
    await access(localPath);
  } catch {
    failures.push(`Missing local asset: ${reference}`);
  }
}

for (const [link] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
  assert(/rel="[^"]*noreferrer[^"]*"/.test(link), `External link is missing rel=noreferrer: ${link}`);
}

const structuredDataMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(structuredDataMatch, "Profile structured data is missing");
if (structuredDataMatch) {
  try {
    const structuredData = JSON.parse(structuredDataMatch[1]);
    const structuredTypes = new Set(structuredData["@graph"]?.map((item) => item["@type"]));
    assert(structuredTypes.has("WebSite"), "WebSite structured data is missing");
    assert(structuredTypes.has("ProfilePage"), "ProfilePage structured data is missing");
  } catch {
    failures.push("Profile structured data is not valid JSON");
  }
}

assert(html.includes('<link rel="canonical" href="https://shrikantshet.github.io/"'), "Canonical URL is missing or incorrect");
assert(html.includes('name="robots" content="index, follow'), "Indexing robots meta tag is missing");
assert(html.includes('property="og:site_name"'), "Open Graph site name is missing");
assert(robots.includes("Sitemap: https://shrikantshet.github.io/sitemap.xml"), "robots.txt must reference the sitemap");
assert(sitemap.includes("<loc>https://shrikantshet.github.io/</loc>"), "Sitemap must include the canonical home page");

const data = JSON.parse(await readFile(resolve(root, "data/portfolio.json"), "utf8"));
const projectTabIds = new Set(data.projectTabs.filter((tab) => tab.id !== "all").map((tab) => tab.id));
const timelineTabIds = new Set(data.timelineTabs.filter((tab) => tab.id !== "all").map((tab) => tab.id));
const experienceIds = new Set(data.experiences.map((experience) => experience.id));
const communityEngagementIds = new Set(data.communityEngagements.map((engagement) => engagement.id));
const engagementIds = new Set([...experienceIds, ...communityEngagementIds]);
const projectIds = new Set(data.projects.map((project) => project.id));
const isCommunityDate = (value) => value === null || /^\d{4}-\d{2}$/.test(value);
assert(data.projects.length === 28, `Expected 28 project records, found ${data.projects.length}`);
assert(data.experiences.length === 16, `Expected 16 experience records, found ${data.experiences.length}`);
assert(data.aiPractice?.title && data.aiPractice?.description, "AI practice needs a title and description");
assert(data.aiPractice?.journey?.length === 5, "AI practice needs five journey stages");
assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact?.email), "Contact email must be valid");
assert(/^\+\d{10,15}$/.test(data.contact?.phoneHref), "Contact phoneHref must use international format");
assert(/^\d{10,15}$/.test(data.contact?.whatsappNumber), "WhatsApp number must contain country code and digits only");
assert(data.contact?.phoneHref?.replace(/\D/g, "") === data.contact?.whatsappNumber, "Call and WhatsApp numbers must match");
assert(data.contact?.phoneDisplay && data.contact?.whatsappMessage, "Contact labels and messages are required");
assert(data.skills?.length >= 40, "Skills inventory should contain at least 40 entries");
assert(new Set(data.skills).size === data.skills.length, "Skills inventory must not contain duplicates");
assert(data.skillEmphasis?.highlight?.every((skill) => data.skills.includes(skill)), "Highlighted skills must exist in the skills inventory");
assert(data.skillEmphasis?.border?.every((skill) => data.skills.includes(skill)), "Bordered skills must exist in the skills inventory");
assert(projectIds.size === data.projects.length, "Every project needs a unique id");
assert(experienceIds.size === data.experiences.length, "Every timeline item needs a unique id");
assert(communityEngagementIds.size === data.communityEngagements.length, "Every community engagement needs a unique id");
assert(data.projects.every((project) => project.id && project.client && project.title && project.description), "Every project needs id, client, title, and description");
assert(data.experiences.every((experience) => experience.id && experience.period && experience.organization && experience.role), "Every experience needs id, period, organization, and role");
assert(data.communityEngagements.every((engagement) => engagement.id && engagement.organization && engagement.role && engagement.description), "Every community engagement needs id, organization, role, and description");
assert(data.communityEngagements.every((engagement) => isCommunityDate(engagement.startDate) && isCommunityDate(engagement.endDate)), "Community dates must use YYYY-MM or null");
assert(data.projects.every((project) => project.tabs?.length && project.tabs.every((tab) => projectTabIds.has(tab))), "Every project tab must match a projectTabs id");
assert(data.experiences.every((experience) => experience.tabs?.length && experience.tabs.every((tab) => timelineTabIds.has(tab))), "Every timeline tab must match a timelineTabs id");
assert(data.projects.every((project) => Array.isArray(project.engagementIds) && project.engagementIds.every((id) => engagementIds.has(id))), "Every project engagementIds entry must match a timeline or community engagement id");
assert(data.projects.every((project) => new Set(project.engagementIds).size === project.engagementIds.length), "A project must not repeat the same engagement id");
assert(data.projects.some((project) => project.tabs.length > 1), "At least one project should demonstrate multi-tab membership");
assert(data.experiences.some((experience) => experience.tabs.length > 1), "At least one timeline entry should demonstrate multi-tab membership");
assert(html.includes("data-theme-toggle"), "Theme toggle is missing from the navigation");
assert(html.includes("data-contact-dock"), "Floating contact dock is missing");
assert(!/<a\b[^>]*href="mailto:/i.test(html), "Clickable email actions must use the browser-based compose flow");
assert(expectedNavigationTargets.every((target) => html.includes(`<a href="${target}">`)), "Primary navigation must link all eight numbered sections");

if (failures.length) {
  console.error(`Static-site validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

const communityLabel = data.communityEngagements.length === 1 ? "community engagement" : "community engagements";
console.log(`Static-site validation passed: ${data.projects.length} work files, ${data.experiences.length} timeline entries, ${data.skills.length} skills, ${data.communityEngagements.length} ${communityLabel}, and all local references resolved.`);
