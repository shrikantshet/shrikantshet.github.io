const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

const readStoredTheme = () => {
  try {
    return localStorage.getItem("portfolio-theme");
  } catch {
    return null;
  }
};

const applyTheme = (theme, persist = false) => {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  themeColor.setAttribute("content", theme === "dark" ? "#11130f" : "#f2eee5");
  const nextTheme = theme === "dark" ? "light" : "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  themeToggle.setAttribute("title", `Switch to ${nextTheme} mode`);
  if (persist) {
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
};

applyTheme(root.dataset.theme || (systemTheme.matches ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
});

systemTheme.addEventListener("change", (event) => {
  if (!readStoredTheme()) applyTheme(event.matches ? "dark" : "light");
});

const response = await fetch(new URL("../data/portfolio.json", import.meta.url));
if (!response.ok) throw new Error(`Unable to load portfolio data (${response.status})`);

const {
  aiPractice,
  communityEngagements,
  contact,
  experiences,
  philosophy,
  practiceAreas,
  projects,
  projectTabs,
  skillEmphasis,
  skills,
  testimonials,
  timelineTabs,
} = await response.json();

const projectGrid = document.querySelector("[data-project-grid]");
const projectCount = document.querySelector("[data-project-count]");
const projectTabContainer = document.querySelector("[data-project-tabs]");
const resultCount = document.querySelector("[data-result-count]");
const showAllButton = document.querySelector("[data-show-all]");
const projectSearch = document.querySelector("[data-project-search]");
const timeline = document.querySelector("[data-timeline]");
const timelineTabContainer = document.querySelector("[data-timeline-tabs]");
const philosophyGrid = document.querySelector("[data-philosophy-grid]");
const aiTitle = document.querySelector("[data-ai-title]");
const aiDescription = document.querySelector("[data-ai-description]");
const aiJourney = document.querySelector("[data-ai-journey]");
const skillsCloud = document.querySelector("[data-skills-cloud]");
const skillsCount = document.querySelector("[data-skills-count]");
const communityGrid = document.querySelector("[data-community-grid]");
const practiceGrid = document.querySelector("[data-practice-grid]");
const testimonialGrid = document.querySelector("[data-testimonial-grid]");
const contactDock = document.querySelector("[data-contact-dock]");

let activeProjectFilter = projectTabs[0].id;
let activeTimelineFilter = timelineTabs[0].id;
let showAllProjects = false;

const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character],
  );

const makeTag = (label) => `<span class="tag">${escapeHTML(label)}</span>`;
const timelineLabels = new Map(timelineTabs.map((tab) => [tab.id, tab.label]));
const experienceById = new Map(experiences.map((experience) => [experience.id, experience]));
const communityEngagementById = new Map(
  communityEngagements.map((engagement) => [engagement.id, engagement]),
);
const engagementById = new Map([...experienceById, ...communityEngagementById]);

const makeEngagementLink = (engagement) => `
  <a class="relationship-link" href="#engagement-${escapeHTML(engagement.id)}"
    data-engagement-link="${escapeHTML(engagement.id)}">
    ${escapeHTML(engagement.organization)} · ${escapeHTML(engagement.role)}
  </a>`;

const makeProjectLink = (project) => `
  <a class="relationship-link" href="#work-${escapeHTML(project.id)}"
    data-project-link="${escapeHTML(project.id)}">${escapeHTML(project.title)}</a>`;

function renderRelationships(label, links) {
  if (!links.length) return "";
  return `
    <div class="relationship-list">
      <span class="relationship-list__label">${escapeHTML(label)}</span>
      <div>${links.join("")}</div>
    </div>`;
}

function renderTabs() {
  projectTabContainer.innerHTML = projectTabs
    .map(
      (tab, index) => `
        <button class="filter-button ${index === 0 ? "is-active" : ""}" type="button"
          aria-pressed="${index === 0}" data-project-filter="${escapeHTML(tab.id)}">
          ${escapeHTML(tab.label)}
        </button>`,
    )
    .join("");

  timelineTabContainer.innerHTML = timelineTabs
    .map(
      (tab, index) => `
        <button class="timeline-filter ${index === 0 ? "is-active" : ""}" type="button"
          aria-pressed="${index === 0}" data-timeline-filter="${escapeHTML(tab.id)}">
          ${tab.color ? `<i data-color="${escapeHTML(tab.color)}" aria-hidden="true"></i>` : ""}${escapeHTML(tab.label)}
        </button>`,
    )
    .join("");
}

function renderProjects() {
  const query = projectSearch.value.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const inTab = activeProjectFilter === "all" || project.tabs.includes(activeProjectFilter);
    const searchable = [project.client, project.title, project.description, project.role, ...(project.stack || [])]
      .join(" ")
      .toLowerCase();
    return inTab && (!query || searchable.includes(query));
  });

  const visible = showAllProjects || query || activeProjectFilter !== "all" ? filtered : filtered.slice(0, 8);
  projectGrid.innerHTML = visible
    .map((project, index) => {
      const projectNumber = String(projects.indexOf(project) + 1).padStart(2, "0");
      const relatedEngagements = project.engagementIds.map((id) => engagementById.get(id)).filter(Boolean);
      const title = project.url
        ? `<a href="${escapeHTML(project.url)}" target="_blank" rel="noreferrer">${escapeHTML(project.title)}<span aria-hidden="true"> ↗</span></a>`
        : escapeHTML(project.title);
      return `
        <article id="work-${escapeHTML(project.id)}" class="project-card reveal ${index === 0 && activeProjectFilter === "all" ? "project-card--feature" : ""}">
          <div class="project-card__meta">
            <span>FILE ${projectNumber}</span>
            <span>${escapeHTML(project.role || "Engagement")}</span>
          </div>
          <p class="project-card__client">${escapeHTML(project.client)}</p>
          <h3>${title}</h3>
          <p>${escapeHTML(project.description)}</p>
          ${renderRelationships("Engagements", relatedEngagements.map(makeEngagementLink))}
          ${project.stack?.length ? `<div class="tag-list">${project.stack.map(makeTag).join("")}</div>` : ""}
        </article>`;
    })
    .join("");

  resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`;
  showAllButton.hidden = filtered.length <= 8 || query || activeProjectFilter !== "all";
  showAllButton.textContent = showAllProjects ? "Show selected files" : `Open the full archive (${projects.length})`;
  observeReveals();
}

function renderTimeline() {
  const filtered = experiences.filter(
    (experience) => activeTimelineFilter === "all" || experience.tabs.includes(activeTimelineFilter),
  );

  timeline.innerHTML = filtered
    .map((experience) => {
      const primaryTrack = experience.tabs[0];
      const tabLabel = experience.tabs.map((tab) => timelineLabels.get(tab) || tab).join(" · ");
      const relatedProjects = projects.filter((project) => project.engagementIds.includes(experience.id));
      return `
        <article id="engagement-${escapeHTML(experience.id)}" class="timeline-entry reveal" data-track="${escapeHTML(primaryTrack)}">
          <div class="timeline-entry__period">${escapeHTML(experience.period)}</div>
          <div class="timeline-entry__marker" aria-hidden="true"></div>
          <div class="timeline-entry__card">
            <div class="timeline-entry__topline">
              <span class="track-label">${escapeHTML(tabLabel)}</span>
              ${experience.parallel ? '<span class="parallel-label">parallel engagement</span>' : ""}
            </div>
            <h3>${escapeHTML(experience.role)}</h3>
            <p class="timeline-entry__organization">${escapeHTML(experience.organization)}</p>
            ${experience.detail ? `<p class="timeline-entry__detail">${escapeHTML(experience.detail)}</p>` : ""}
            ${renderRelationships("Work files", relatedProjects.map(makeProjectLink))}
            <div class="tag-list">${experience.tags.map(makeTag).join("")}</div>
          </div>
        </article>`;
    })
    .join("");
  observeReveals();
}

function formatCommunityDate(value) {
  if (!value) return "";
  const [year, month = 1] = value.split("-").map(Number);
  if (!year) return value;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function getCommunityPeriod(engagement) {
  if (engagement.periodLabel) return engagement.periodLabel;
  const start = formatCommunityDate(engagement.startDate);
  const end = formatCommunityDate(engagement.endDate);
  if (start && end) return `${start} — ${end}`;
  if (start) return `${start} — Present`;
  if (end) return `Until ${end}`;
  return "Dates to add";
}

function renderCommunityEngagements() {
  communityGrid.innerHTML = communityEngagements
    .map((engagement) => {
      const relatedProjects = projects.filter((project) => project.engagementIds.includes(engagement.id));
      const title = engagement.url
        ? `<a href="${escapeHTML(engagement.url)}" target="_blank" rel="noreferrer">${escapeHTML(engagement.organization)}<span aria-hidden="true"> ↗</span></a>`
        : escapeHTML(engagement.organization);
      return `
        <article id="engagement-${escapeHTML(engagement.id)}" class="community-card reveal">
          <p class="community-card__period">${escapeHTML(getCommunityPeriod(engagement))}</p>
          <p class="community-card__role">${escapeHTML(engagement.role)}</p>
          <h3>${title}</h3>
          <p>${escapeHTML(engagement.description)}</p>
          ${renderRelationships("Work files", relatedProjects.map(makeProjectLink))}
        </article>`;
    })
    .join("");
  observeReveals();
}

function renderPhilosophy() {
  philosophyGrid.innerHTML = philosophy
    .map(
      (item) => `
        <article class="philosophy-card reveal">
          <span>${escapeHTML(item.number)}</span>
          <div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p></div>
        </article>`,
    )
    .join("");
}

function renderAIPractice() {
  aiTitle.textContent = aiPractice.title;
  aiDescription.textContent = aiPractice.description;
  aiJourney.innerHTML = aiPractice.journey
    .map(
      (item) => `
        <li class="ai-journey__item reveal">
          <span class="ai-journey__number">${escapeHTML(item.number)}</span>
          <p class="ai-journey__phase">${escapeHTML(item.phase)}</p>
          <h3>${escapeHTML(item.tool)}</h3>
          <p>${escapeHTML(item.description)}</p>
        </li>`,
    )
    .join("");
}

function renderSkills() {
  skillsCount.textContent = skills.length;
  skillsCloud.innerHTML = skills
    .map((skill) => {
      const emphasisClasses = [
        skillEmphasis.highlight.includes(skill) ? "skills-cloud__item--highlight" : "",
        skillEmphasis.border.includes(skill) ? "skills-cloud__item--border" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<li class="${emphasisClasses}">${escapeHTML(skill)}</li>`;
    })
    .join("");
}

function renderPracticeAreas() {
  practiceGrid.innerHTML = practiceAreas
    .map(
      (area) => `
        <article class="practice-card reveal">
          <span class="practice-card__number">${escapeHTML(area.number)}</span>
          <p class="practice-card__subtitle">${escapeHTML(area.subtitle)}</p>
          <h3>${escapeHTML(area.title)}</h3>
          <p>${escapeHTML(area.description)}</p>
          <div class="tag-list">${area.skills.map(makeTag).join("")}</div>
        </article>`,
    )
    .join("");
}

function renderTestimonials() {
  testimonialGrid.innerHTML = testimonials
    .map(
      (item) => `
        <figure class="quote-card reveal">
          <blockquote>“${escapeHTML(item.quote)}”</blockquote>
          <figcaption><strong>${escapeHTML(item.person)}</strong><span>${escapeHTML(item.context)}</span></figcaption>
        </figure>`,
    )
    .join("");
}

function renderContactDock() {
  const emailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`;
  const whatsappMessage = encodeURIComponent(contact.whatsappMessage);
  const phoneLabel = `Call Shrikant at ${contact.phoneDisplay}`;

  contactDock.innerHTML = `
    <a class="contact-dock__link contact-dock__link--email"
      href="${escapeHTML(emailComposeUrl)}"
      target="_blank" rel="noreferrer"
      aria-label="Email Shrikant" title="Email Shrikant">
      <span class="contact-dock__icon" aria-hidden="true">✉</span>
      <span class="contact-dock__label" aria-hidden="true">Email</span>
    </a>
    <a class="contact-dock__link contact-dock__link--call"
      href="tel:${escapeHTML(contact.phoneHref)}"
      aria-label="${escapeHTML(phoneLabel)}" title="${escapeHTML(phoneLabel)}">
      <span class="contact-dock__icon" aria-hidden="true">☎</span>
      <span class="contact-dock__label" aria-hidden="true">Call</span>
    </a>
    <a class="contact-dock__link contact-dock__link--whatsapp"
      href="https://wa.me/${escapeHTML(contact.whatsappNumber)}?text=${whatsappMessage}"
      target="_blank" rel="noreferrer"
      aria-label="Message Shrikant on WhatsApp" title="Message Shrikant on WhatsApp">
      <span class="contact-dock__icon contact-dock__icon--whatsapp" aria-hidden="true">
        <img src="./images/whatsapp.svg" alt="" width="24" height="24" />
      </span>
      <span class="contact-dock__label" aria-hidden="true">WhatsApp</span>
    </a>`;
}

renderTabs();

document.querySelectorAll("[data-project-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeProjectFilter = button.dataset.projectFilter;
    showAllProjects = true;
    document.querySelectorAll("[data-project-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderProjects();
  });
});

document.querySelectorAll("[data-timeline-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeTimelineFilter = button.dataset.timelineFilter;
    document.querySelectorAll("[data-timeline-filter]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderTimeline();
  });
});

function syncFilterButtons(selector, activeValue, dataKey) {
  document.querySelectorAll(selector).forEach((button) => {
    const active = button.dataset[dataKey] === activeValue;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function scrollToLinkedCard(id) {
  requestAnimationFrame(() => {
    const card = document.getElementById(id);
    if (!card) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    card.classList.add("is-linked-target");
    card.scrollIntoView({ behavior, block: "center" });
    window.setTimeout(() => card.classList.remove("is-linked-target"), 1800);
  });
}

document.addEventListener("click", (event) => {
  const engagementLink = event.target.closest("[data-engagement-link]");
  if (engagementLink) {
    event.preventDefault();
    const engagementId = engagementLink.dataset.engagementLink;
    if (experienceById.has(engagementId)) {
      activeTimelineFilter = "all";
      syncFilterButtons("[data-timeline-filter]", "all", "timelineFilter");
      renderTimeline();
    }
    scrollToLinkedCard(`engagement-${engagementId}`);
    return;
  }

  const projectLink = event.target.closest("[data-project-link]");
  if (projectLink) {
    event.preventDefault();
    const projectId = projectLink.dataset.projectLink;
    activeProjectFilter = "all";
    showAllProjects = true;
    projectSearch.value = "";
    syncFilterButtons("[data-project-filter]", "all", "projectFilter");
    renderProjects();
    scrollToLinkedCard(`work-${projectId}`);
  }
});

projectSearch.addEventListener("input", renderProjects);
showAllButton.addEventListener("click", () => {
  showAllProjects = !showAllProjects;
  renderProjects();
  if (!showAllProjects) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    document.querySelector("#work").scrollIntoView({ behavior });
  }
});

const menuButton = document.querySelector("[data-menu-button]");
const navigation = document.querySelector("[data-navigation]");

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  navigation.classList.toggle("is-open", !open);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  });
});

let revealObserver;
function observeReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }
  revealObserver ||= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));
}

projectCount.textContent = projects.length;
document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
renderProjects();
renderTimeline();
renderPhilosophy();
renderAIPractice();
renderSkills();
renderCommunityEngagements();
renderPracticeAreas();
renderTestimonials();
renderContactDock();
observeReveals();
