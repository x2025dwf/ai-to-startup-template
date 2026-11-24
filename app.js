// ============================================================
// app.js — a local-only class and assignment planner.
// ============================================================

(function () {
  "use strict";

  const storage = {
    get: function (key, fallback) {
      try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // The planner remains usable for this visit if browser storage is unavailable.
      }
    }
  };

  let classes = storage.get("daywiseClasses", []);
  let assignments = storage.get("daywiseAssignments", []);
  let demoSignedIn = storage.get("daywiseDemoSignedIn", false) === true;
  const savedPlan = storage.get("daywiseDemoPlan", "free");
  let selectedPlan = ["free", "plus-monthly", "plus-yearly"].includes(savedPlan)
    ? savedPlan
    : "free";

  const planDate = document.getElementById("plan-date");
  const classList = document.getElementById("class-list");
  const studyList = document.getElementById("study-list");
  const deadlineList = document.getElementById("deadline-list");
  const manageClasses = document.getElementById("manage-classes");
  const manageAssignments = document.getElementById("manage-assignments");
  const accountStatus = document.getElementById("account-status");
  const planStatus = document.getElementById("plan-status");
  const signInButton = document.getElementById("demo-sign-in");
  const signOutButton = document.getElementById("demo-sign-out");

  document.title = STARTUP.name + " — your school day, sorted";
  document.getElementById("brand-name").textContent = STARTUP.name;
  document.getElementById("tagline").textContent = STARTUP.tagline;
  document.getElementById("pitch").textContent = STARTUP.pitch;

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function dateFromString(value) {
    return new Date(value + "T00:00:00");
  }

  function formatDate(value) {
    return dateFromString(value).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function formatTime(value) {
    const parts = value.split(":");
    const date = new Date();
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function timeInMinutes(value) {
    const parts = value.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function timeFromMinutes(value) {
    const date = new Date();
    date.setHours(Math.floor(value / 60), value % 60, 0, 0);
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function save() {
    storage.set("daywiseClasses", classes);
    storage.set("daywiseAssignments", assignments);
    render();
  }

  function showView() {
    const requested = (window.location.hash || "#plan").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const exists = Array.prototype.some.call(views, function (view) {
      return view.id === requested;
    });
    const current = exists ? requested : "plan";

    views.forEach(function (view) {
      view.hidden = view.id !== current;
    });

    document.querySelectorAll("nav a").forEach(function (link) {
      if (link.getAttribute("href") === "#" + current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    window.scrollTo(0, 0);
  }

  function addActionButton(label, className, action) {
    const button = makeElement("button", className, label);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
  }

  function renderClasses(selectedDate) {
    const weekday = dateFromString(selectedDate).getDay();
    const todayClasses = classes
      .filter(function (item) { return Number(item.day) === weekday; })
      .sort(function (a, b) { return a.start.localeCompare(b.start); });

    classList.replaceChildren();
    todayClasses.forEach(function (item) {
      const row = makeElement("li", "agenda-item");
      const time = makeElement("span", "agenda-time", formatTime(item.start) + " – " + formatTime(item.end));
      const details = makeElement("div", "agenda-details");
      details.append(makeElement("strong", "", item.name));
      row.append(time, details);
      classList.append(row);
    });
    document.getElementById("classes-empty").hidden = todayClasses.length > 0;
  }

  function getStudySessions(selectedDate) {
    const selected = dateFromString(selectedDate);
    const latestDue = new Date(selected);
    latestDue.setDate(latestDue.getDate() + 7);
    const weekday = selected.getDay();
    const todayClasses = classes
      .filter(function (item) { return Number(item.day) === weekday; })
      .map(function (item) {
        return { start: timeInMinutes(item.start), end: timeInMinutes(item.end) };
      })
      .sort(function (a, b) { return a.start - b.start; });
    const dueSoon = assignments
      .filter(function (item) {
        const dueDate = dateFromString(item.due);
        return !item.done && dueDate <= latestDue;
      })
      .sort(function (a, b) { return a.due.localeCompare(b.due); });

    const now = new Date();
    const isToday = selectedDate === localDateString(now);
    const roundedNow = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
    let cursor = Math.max(16 * 60, isToday ? roundedNow : 16 * 60);
    const dayEnds = 21 * 60;
    let plannedMinutes = 0;
    const sessions = [];

    dueSoon.forEach(function (item) {
      if (plannedMinutes >= 120) return;
      const duration = Math.min(45, Number(item.minutes), 120 - plannedMinutes);
      let start = cursor;

      while (start + duration <= dayEnds) {
        const conflict = todayClasses.find(function (meeting) {
          return start < meeting.end && start + duration > meeting.start;
        });
        if (!conflict) break;
        start = conflict.end;
      }

      if (start + duration > dayEnds) return;
      sessions.push({ assignment: item, start: start, end: start + duration });
      plannedMinutes += duration;
      cursor = start + duration + 15;
    });

    return { sessions: sessions, hasDeadlines: dueSoon.length > 0 };
  }

  function renderStudyPlan(selectedDate) {
    const result = getStudySessions(selectedDate);
    studyList.replaceChildren();

    result.sessions.forEach(function (session) {
      const row = makeElement("li", "agenda-item study-item");
      const time = makeElement("span", "agenda-time",
        timeFromMinutes(session.start) + " – " + timeFromMinutes(session.end));
      const details = makeElement("div", "agenda-details");
      details.append(
        makeElement("strong", "", session.assignment.name),
        makeElement("span", "item-meta",
          session.assignment.course + " · due " + formatDate(session.assignment.due))
      );
      if (session.assignment.rubric) {
        details.append(makeElement("span", "rubric-note", "Rubric: " + session.assignment.rubric));
      }
      row.append(time, details);
      studyList.append(row);
    });

    const empty = document.getElementById("study-empty");
    empty.hidden = result.sessions.length > 0;
    empty.textContent = result.hasDeadlines
      ? "No study time fits after 4 PM and your classes today. Check another day or your deadlines below."
      : "Add assignments with due dates to get a study plan.";
    document.getElementById("study-note").textContent = result.sessions.length > 0
      ? "Short focus sessions are prioritized by due date, with up to 2 hours planned per day."
      : "";
  }

  function renderDeadlines(selectedDate) {
    const deadlines = assignments
      .filter(function (item) { return !item.done; })
      .sort(function (a, b) { return a.due.localeCompare(b.due); });
    deadlineList.replaceChildren();

    deadlines.forEach(function (item) {
      const row = makeElement("li", "deadline-item");
      const date = makeElement("span", "deadline-date", formatDate(item.due));
      const details = makeElement("div", "agenda-details");
      details.append(
        makeElement("strong", "", item.name),
        makeElement("span", "item-meta", item.course + " · " + item.minutes + " min of work")
      );
      if (item.due < selectedDate) {
        date.classList.add("overdue");
        date.textContent += " · overdue";
      }
      row.append(date, details);
      row.append(addActionButton("Done", "small-button", function () {
        assignments = assignments.map(function (assignment) {
          return assignment.id === item.id ? Object.assign({}, assignment, { done: true }) : assignment;
        });
        save();
      }));
      deadlineList.append(row);
    });

    document.getElementById("deadlines-empty").hidden = deadlines.length > 0;
  }

  function renderManageLists() {
    manageClasses.replaceChildren();
    classes
      .slice()
      .sort(function (a, b) {
        return Number(a.day) - Number(b.day) || a.start.localeCompare(b.start);
      })
      .forEach(function (item) {
        const row = makeElement("li", "manage-item");
        const details = makeElement("span", "", item.name + " · " + item.dayName + " · " +
          formatTime(item.start) + "–" + formatTime(item.end));
        row.append(details, addActionButton("Remove", "small-button quiet-button", function () {
          classes = classes.filter(function (classItem) { return classItem.id !== item.id; });
          save();
        }));
        manageClasses.append(row);
      });
    document.getElementById("manage-classes-empty").hidden = classes.length > 0;

    manageAssignments.replaceChildren();
    assignments
      .slice()
      .sort(function (a, b) { return a.due.localeCompare(b.due); })
      .forEach(function (item) {
        const row = makeElement("li", "manage-item");
        const details = makeElement("span", item.done ? "completed-item" : "", item.name + " · " +
          item.course + " · due " + formatDate(item.due) + (item.done ? " · done" : ""));
        row.append(details, addActionButton("Remove", "small-button quiet-button", function () {
          assignments = assignments.filter(function (assignment) { return assignment.id !== item.id; });
          save();
        }));
        manageAssignments.append(row);
      });
    document.getElementById("manage-assignments-empty").hidden = assignments.length > 0;
  }

  function renderAccount() {
    accountStatus.textContent = demoSignedIn
      ? "Demo session active. Signed in as Demo Student."
      : "You are not signed in.";
    signInButton.hidden = demoSignedIn;
    signOutButton.hidden = !demoSignedIn;

    const planNames = {
      free: "Free",
      "plus-monthly": "Study Plus monthly",
      "plus-yearly": "Study Plus annual"
    };
    planStatus.textContent = "Current demo plan: " + planNames[selectedPlan];
    document.querySelectorAll(".plan-choice").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.plan === selectedPlan));
    });
  }

  function render() {
    const selectedDate = planDate.value;
    renderClasses(selectedDate);
    renderStudyPlan(selectedDate);
    renderDeadlines(selectedDate);
    renderManageLists();
    renderAccount();
  }

  signInButton.addEventListener("click", function () {
    demoSignedIn = true;
    storage.set("daywiseDemoSignedIn", demoSignedIn);
    renderAccount();
  });

  signOutButton.addEventListener("click", function () {
    demoSignedIn = false;
    selectedPlan = "free";
    storage.set("daywiseDemoSignedIn", demoSignedIn);
    storage.set("daywiseDemoPlan", selectedPlan);
    renderAccount();
  });

  document.querySelectorAll(".plan-choice").forEach(function (button) {
    button.addEventListener("click", function () {
      const requestedPlan = button.dataset.plan;
      if (requestedPlan !== "free" && !demoSignedIn) {
        accountStatus.textContent = "Start a demo session before previewing a subscription.";
        signInButton.focus();
        return;
      }

      selectedPlan = requestedPlan;
      storage.set("daywiseDemoPlan", selectedPlan);
      renderAccount();
    });
  });

  document.getElementById("class-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const start = formData.get("start");
    const end = formData.get("end");
    const day = formData.get("day");
    const message = document.getElementById("class-message");
    const overlaps = classes.some(function (item) {
      return Number(item.day) === Number(day) && start < item.end && end > item.start;
    });

    if (start >= end) {
      message.textContent = "The end time must be after the start time.";
      return;
    }
    if (overlaps) {
      message.textContent = "That time overlaps another class on this day.";
      return;
    }

    const dayName = document.getElementById("class-day").selectedOptions[0].textContent;
    classes.push({
      id: makeId(),
      name: String(formData.get("name")).trim(),
      day: day,
      dayName: dayName,
      start: start,
      end: end
    });
    message.textContent = "";
    form.reset();
    save();
  });

  document.getElementById("assignment-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    assignments.push({
      id: makeId(),
      name: String(formData.get("name")).trim(),
      course: String(formData.get("course")).trim(),
      due: formData.get("due"),
      minutes: Number(formData.get("minutes")),
      rubric: String(formData.get("rubric")).trim(),
      done: false
    });
    form.reset();
    save();
  });

  planDate.value = localDateString(new Date());
  planDate.addEventListener("change", render);
  window.addEventListener("hashchange", showView);
  showView();
  render();
})();
