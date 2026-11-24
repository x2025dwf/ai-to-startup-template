// ============================================================
// app.js — a local-only class and assignment planner.
// ============================================================

(function () {
  "use strict";

  const STORAGE_KEY = "studysyncData";
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const PRIORITY_RANK = { low: 0, medium: 1, high: 2 };
  const WORK_TYPES = ["assignment", "exam", "deadline"];
  const notice = document.getElementById("storage-notice");
  const planDate = document.getElementById("plan-date");
  const startInput = document.getElementById("study-start");
  const endInput = document.getElementById("study-end");
  const classForm = document.getElementById("class-form");
  const assignmentForm = document.getElementById("assignment-form");
  const classMessage = document.getElementById("class-message");
  const assignmentFilter = document.getElementById("assignment-filter");
  const classSubmit = document.getElementById("class-submit");
  const assignmentSubmit = document.getElementById("assignment-submit");
  const classCancel = document.getElementById("class-cancel");
  const assignmentCancel = document.getElementById("assignment-cancel");
  let editingClassId = null;
  let editingAssignmentId = null;
  let calendarDate = dateFromString(localDateString(new Date()));
  let selectedCalendarDate = localDateString(new Date());
  let data = loadData();

  document.title = STARTUP.name + " — make room for what matters";

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function formatWorkType(type) {
    if (type === "exam") return "Exam";
    if (type === "deadline") return "Other deadline";
    return "Assignment";
  }

  function dateFromString(value) {
    return new Date(value + "T12:00:00");
  }

  function addDays(date, count) {
    const result = new Date(date);
    result.setDate(result.getDate() + count);
    return result;
  }

  function formatDate(value, options) {
    return dateFromString(value).toLocaleDateString(undefined, options || {
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

  function formatMinutes(value) {
    const minutes = Math.round(value);
    if (minutes < 60) return minutes + " min";
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? hours + "h " + remainder + "m" : hours + "h";
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

  function sampleData() {
    function dueIn(days) {
      return localDateString(addDays(new Date(), days));
    }

    return {
      settings: { start: "08:00", end: "21:00" },
      classes: [
        { id: "sample-biology-mon", name: "Biology 101", day: 1, start: "09:00", end: "10:15" },
        { id: "sample-statistics-mon", name: "Statistics", day: 1, start: "11:00", end: "12:00" },
        { id: "sample-writing-mon", name: "Academic Writing", day: 1, start: "14:00", end: "15:00" },
        { id: "sample-history-tue", name: "Modern History", day: 2, start: "10:00", end: "11:15" },
        { id: "sample-chemistry-tue", name: "Chemistry Lab", day: 2, start: "13:00", end: "14:30" },
        { id: "sample-biology-wed", name: "Biology 101", day: 3, start: "09:00", end: "10:15" },
        { id: "sample-statistics-wed", name: "Statistics", day: 3, start: "11:00", end: "12:00" },
        { id: "sample-history-thu", name: "Modern History", day: 4, start: "10:00", end: "11:15" },
        { id: "sample-chemistry-thu", name: "Chemistry Lab", day: 4, start: "13:00", end: "14:30" },
        { id: "sample-writing-fri", name: "Academic Writing", day: 5, start: "09:00", end: "10:00" },
        { id: "sample-chemistry-fri", name: "Chemistry Lab", day: 5, start: "11:00", end: "12:15" }
      ],
      assignments: [
        { id: "sample-biology-lab", name: "Cell structure lab notes", course: "Biology 101", due: dueIn(1), minutes: 60, priority: "high", type: "assignment", notes: "Label the diagrams and review key terms.", done: false },
        { id: "sample-history-reading", name: "Primary source response", course: "Modern History", due: dueIn(2), minutes: 45, priority: "medium", type: "assignment", notes: "Compare the two assigned sources.", done: false },
        { id: "sample-statistics-set", name: "Problem set 6", course: "Statistics", due: dueIn(3), minutes: 90, priority: "high", type: "assignment", notes: "Show each calculation step.", done: false },
        { id: "sample-writing-outline", name: "Research paper outline", course: "Academic Writing", due: dueIn(5), minutes: 120, priority: "medium", type: "assignment", notes: "Bring one draft thesis to seminar.", done: false },
        { id: "sample-chemistry-quiz", name: "Reactions practice quiz", course: "Chemistry Lab", due: dueIn(7), minutes: 60, priority: "low", type: "assignment", notes: "Review the reaction summary sheet.", done: false },
        { id: "sample-statistics-exam", name: "Statistics midterm", course: "Statistics", due: dueIn(6), minutes: 120, priority: "high", type: "exam", notes: "Review lecture examples and practice questions.", done: false },
        { id: "sample-history-done", name: "Week 3 reading notes", course: "Modern History", due: dueIn(-1), minutes: 45, priority: "low", type: "assignment", notes: "Finished and checked.", done: true }
      ]
    };
  }

  function validTime(value) {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = dateFromString(value);
    return !Number.isNaN(parsed.getTime()) && localDateString(parsed) === value;
  }

  function cleanStoredData(value) {
    if (!value || !Array.isArray(value.classes) || !Array.isArray(value.assignments) || !value.settings) {
      return null;
    }

    const classes = value.classes.filter(function (item) {
      return item && typeof item.id === "string" && typeof item.name === "string" &&
        Number.isInteger(Number(item.day)) && Number(item.day) >= 0 && Number(item.day) <= 6 &&
        validTime(item.start) && validTime(item.end) && item.start < item.end;
    }).map(function (item) {
      return { id: item.id, name: item.name, day: Number(item.day), start: item.start, end: item.end };
    });
    const assignments = value.assignments.filter(function (item) {
      return item && typeof item.id === "string" && typeof item.name === "string" &&
        typeof item.course === "string" && validDate(item.due) &&
        Number.isFinite(Number(item.minutes)) && Number(item.minutes) >= 15 &&
        Number(item.minutes) <= 600 && Object.prototype.hasOwnProperty.call(PRIORITY_RANK, item.priority) &&
        (item.type === undefined || WORK_TYPES.includes(item.type));
    }).map(function (item) {
      return {
        id: item.id,
        name: item.name,
        course: item.course,
        due: item.due,
        minutes: Number(item.minutes),
        priority: item.priority,
        type: item.type || "assignment",
        notes: typeof item.notes === "string" ? item.notes : "",
        done: item.done === true
      };
    });
    const settings = value.settings;
    if (!validTime(settings.start) || !validTime(settings.end) || settings.start >= settings.end) return null;
    return { classes: classes, assignments: assignments, settings: { start: settings.start, end: settings.end } };
  }

  function showStorageNotice(message) {
    notice.textContent = message;
    notice.hidden = !message;
  }

  function loadData() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === null) return sampleData();
      const cleaned = cleanStoredData(JSON.parse(saved));
      if (cleaned) return cleaned;
      showStorageNotice("Saved planner data could not be read. Sample data is shown; reset sample data to save a fresh copy.");
      return sampleData();
    } catch (error) {
      showStorageNotice("Browser storage is unavailable. Your changes will not remain after you leave this page.");
      return sampleData();
    }
  }

  function saveData() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showStorageNotice("");
    } catch (error) {
      showStorageNotice("Your changes are visible for this visit, but this browser could not save them.");
    }
    renderAll();
  }

  function switchView() {
    const requested = (window.location.hash || "#home").slice(1);
    const views = document.querySelectorAll("[data-view]");
    const exists = Array.prototype.some.call(views, function (view) { return view.id === requested; });
    const current = exists ? requested : "home";
    views.forEach(function (view) { view.hidden = view.id !== current; });
    document.querySelectorAll("nav a").forEach(function (link) {
      if (link.getAttribute("href") === "#" + current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function addActionButton(label, className, action, accessibleLabel) {
    const button = makeElement("button", className, label);
    button.type = "button";
    if (accessibleLabel) button.setAttribute("aria-label", accessibleLabel);
    button.addEventListener("click", action);
    return button;
  }

  function classesForDate(value) {
    const weekday = dateFromString(value).getDay();
    return data.classes.filter(function (item) {
      return Number(item.day) === weekday;
    }).sort(function (a, b) { return a.start.localeCompare(b.start); });
  }

  function assignmentsByDueDate(includeCompleted) {
    return data.assignments.filter(function (item) {
      return includeCompleted || !item.done;
    }).sort(function (a, b) {
      return a.due.localeCompare(b.due) || PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    });
  }

  function freeIntervals(value) {
    const windowStart = timeInMinutes(data.settings.start);
    const windowEnd = timeInMinutes(data.settings.end);
    let cursor = windowStart;
    const now = new Date();
    if (value === localDateString(now)) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      cursor = Math.max(cursor, Math.ceil(nowMinutes / 15) * 15);
    }
    if (cursor >= windowEnd) return [];

    const intervals = [];
    classesForDate(value).forEach(function (item) {
      const start = timeInMinutes(item.start);
      const end = timeInMinutes(item.end);
      if (end <= cursor || start >= windowEnd) return;
      if (start > cursor) intervals.push({ start: cursor, end: Math.min(start, windowEnd) });
      cursor = Math.max(cursor, Math.min(end, windowEnd));
    });
    if (cursor < windowEnd) intervals.push({ start: cursor, end: windowEnd });
    return intervals.filter(function (interval) { return interval.end > interval.start; });
  }

  function availableMinutes(value) {
    return freeIntervals(value).reduce(function (total, interval) {
      return total + interval.end - interval.start;
    }, 0);
  }

  function getStudySessions(value) {
    const latestDue = localDateString(addDays(dateFromString(value), 7));
    const upcoming = assignmentsByDueDate(false).filter(function (item) {
      return item.due <= latestDue;
    });

    const sessions = [];
    const remainingMinutes = new Map(upcoming.map(function (assignment) {
      return [assignment.id, assignment.minutes];
    }));
    freeIntervals(value).forEach(function (interval) {
      let cursor = interval.start;
      while (cursor + 15 <= interval.end) {
        const next = upcoming.find(function (assignment) {
          return remainingMinutes.get(assignment.id) > 0;
        });
        if (!next) break;
        const available = interval.end - cursor;
        const duration = Math.floor(Math.min(60, remainingMinutes.get(next.id), available) / 15) * 15;
        if (duration < 15) break;
        sessions.push({
          assignment: next,
          start: cursor,
          end: cursor + duration
        });
        remainingMinutes.set(next.id, remainingMinutes.get(next.id) - duration);
        cursor += duration + 15;
      }
    });

    return { sessions: sessions, hasAssignments: upcoming.length > 0 };
  }

  function renderDashboard() {
    const selectedDate = planDate.value;
    const todaysClasses = classesForDate(selectedDate);
    const study = getStudySessions(selectedDate);
    const upcoming = assignmentsByDueDate(false);
    const lastDue = localDateString(addDays(dateFromString(selectedDate), 7));
    const dueSoon = upcoming.filter(function (item) { return item.due <= lastDue; });
    const completed = data.assignments.filter(function (item) { return item.done; }).length;
    const outstanding = data.assignments.filter(function (item) { return !item.done; });
    const totalMinutes = outstanding.reduce(function (sum, item) { return sum + item.minutes; }, 0);

    document.getElementById("stat-classes").textContent = String(todaysClasses.length);
    document.getElementById("stat-due").textContent = String(dueSoon.length);
    document.getElementById("stat-workload").textContent = (totalMinutes / 60).toFixed(totalMinutes % 60 ? 1 : 0) + "h";
    document.getElementById("stat-completed").textContent = String(completed);
    const isToday = selectedDate === localDateString(new Date());
    document.getElementById("today-classes-heading").textContent = isToday
      ? "Today's classes"
      : "Classes on " + formatDate(selectedDate, { weekday: "short", month: "short", day: "numeric" });
    document.getElementById("study-heading").textContent = isToday
      ? "Today's study plan"
      : "Study plan for " + formatDate(selectedDate, { weekday: "short", month: "short", day: "numeric" });

    const classList = document.getElementById("class-list");
    classList.replaceChildren();
    todaysClasses.forEach(function (item) {
      const row = makeElement("li", "agenda-item");
      const time = makeElement("span", "agenda-time", formatTime(item.start) + " – " + formatTime(item.end));
      const details = makeElement("div", "agenda-details");
      details.append(makeElement("strong", "", item.name), makeElement("span", "item-meta", DAY_NAMES[item.day]));
      row.append(time, details);
      classList.append(row);
    });
    document.getElementById("classes-empty").hidden = todaysClasses.length > 0;

    const studyList = document.getElementById("study-list");
    studyList.replaceChildren();
    study.sessions.forEach(function (session) {
      const row = makeElement("li", "agenda-item study-item");
      const time = makeElement("span", "agenda-time", timeFromMinutes(session.start) + " – " + timeFromMinutes(session.end));
      const details = makeElement("div", "agenda-details");
      details.append(
        makeElement("strong", "", session.assignment.name),
        makeElement("span", "item-meta", session.assignment.course + " · due " + formatDate(session.assignment.due))
      );
      row.append(time, details);
      studyList.append(row);
    });
    const studyEmpty = document.getElementById("study-empty");
    studyEmpty.hidden = study.sessions.length > 0;
    studyEmpty.textContent = study.hasAssignments
      ? "No study time is available in your selected window. Adjust your study hours or choose another day."
      : "Add an unfinished assignment to get a personalized study plan.";
    document.getElementById("study-note").textContent = study.sessions.length
      ? "Sessions fit around your classes, start from your available time, and focus on urgent work first."
      : "";

    const deadlineList = document.getElementById("deadline-list");
    deadlineList.replaceChildren();
    upcoming.slice(0, 5).forEach(function (item) {
      const row = makeElement("li", "deadline-item");
      const date = makeElement("span", "deadline-date", formatDate(item.due));
      if (item.due < selectedDate) {
        date.classList.add("overdue");
        date.textContent += " · overdue";
      }
      const details = makeElement("div", "agenda-details");
      details.append(
        makeElement("strong", "", item.name),
        makeElement("span", "item-meta", formatWorkType(item.type) + " · " + item.course + " · " +
          formatMinutes(item.minutes) + " estimated")
      );
      row.append(date, details, addActionButton("Done", "small-button", function () {
        updateAssignment(item.id, { done: true });
      }, "Mark " + item.name + " complete"));
      deadlineList.append(row);
    });
    document.getElementById("deadlines-empty").hidden = upcoming.length > 0;

    const progressBar = document.getElementById("progress-bar");
    const percent = data.assignments.length ? Math.round(completed / data.assignments.length * 100) : 0;
    document.getElementById("progress-count").textContent = completed + " of " + data.assignments.length;
    document.getElementById("progress-remaining").textContent = outstanding.length
      ? outstanding.length + " assignment" + (outstanding.length === 1 ? "" : "s") + " still to go"
      : "All caught up";
    document.getElementById("progress-percent").textContent = percent + "%";
    document.getElementById("progress-fill").style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", String(percent));
  }

  function renderWeek() {
    const grid = document.getElementById("week-grid");
    grid.replaceChildren();
    const today = new Date().getDay();
    for (let day = 0; day < 7; day += 1) {
      const column = makeElement("section", "week-day" + (day === today ? " today" : ""));
      column.setAttribute("aria-label", DAY_NAMES[day] + " classes");
      column.append(makeElement("h3", "", SHORT_DAY_NAMES[day]));
      const items = data.classes.filter(function (item) {
        return Number(item.day) === day;
      }).sort(function (a, b) { return a.start.localeCompare(b.start); });
      if (!items.length) column.append(makeElement("p", "week-empty", "No classes"));
      items.forEach(function (item) {
        const card = makeElement("article", "week-class");
        card.append(
          makeElement("strong", "", item.name),
          makeElement("small", "", formatTime(item.start) + "–" + formatTime(item.end))
        );
        card.append(
          addActionButton("Edit", "small-button", function () { editClass(item); }, "Edit " + item.name),
          addActionButton("Delete", "small-button", function () {
            if (window.confirm("Delete " + item.name + " from your weekly schedule?")) {
              if (editingClassId === item.id) resetClassForm();
              data.classes = data.classes.filter(function (entry) { return entry.id !== item.id; });
              saveData();
            }
          }, "Delete " + item.name)
        );
        column.append(card);
      });
      grid.append(column);
    }
    document.getElementById("class-count").textContent = data.classes.length +
      " class" + (data.classes.length === 1 ? "" : "es");
  }

  function renderAssignments() {
    const list = document.getElementById("assignment-list");
    list.replaceChildren();
    const filter = assignmentFilter.value;
    const items = assignmentsByDueDate(true).filter(function (item) {
      if (filter === "active") return !item.done;
      if (filter === "completed") return item.done;
      return true;
    });

    items.forEach(function (item) {
      const row = makeElement("li", "assignment-row" + (item.done ? " completed" : ""));
      const check = addActionButton(item.done ? "✓" : "", "assignment-check", function () {
        updateAssignment(item.id, { done: !item.done });
      }, (item.done ? "Mark " + item.name + " not done" : "Mark " + item.name + " complete"));
      check.setAttribute("aria-pressed", String(item.done));
      const details = makeElement("div", "assignment-info");
      const titleRow = makeElement("div", "assignment-title-row");
      titleRow.append(makeElement("strong", "assignment-title", item.name));
      titleRow.append(makeElement("span", "work-type-badge", formatWorkType(item.type)));
      titleRow.append(makeElement("span", "priority-badge priority-" + item.priority,
        item.priority.charAt(0).toUpperCase() + item.priority.slice(1) + " priority"));
      if (item.done) titleRow.append(makeElement("span", "completed-label", "Completed"));
      const meta = makeElement("div", "assignment-meta");
      meta.append(
        makeElement("span", "", item.course),
        makeElement("span", "", "Due " + formatDate(item.due)),
        makeElement("span", "", formatMinutes(item.minutes) + " estimated")
      );
      details.append(titleRow, meta);
      if (item.notes) details.append(makeElement("p", "assignment-notes", item.notes));
      const actions = makeElement("div", "assignment-actions");
      actions.append(
        addActionButton("Edit", "small-button", function () { editAssignment(item); }, "Edit " + item.name),
        addActionButton("Delete", "small-button", function () {
          if (window.confirm("Delete " + item.name + "?")) {
            if (editingAssignmentId === item.id) resetAssignmentForm();
            data.assignments = data.assignments.filter(function (entry) { return entry.id !== item.id; });
            saveData();
          }
        }, "Delete " + item.name)
      );
      row.append(check, details, actions);
      list.append(row);
    });
    document.getElementById("assignments-empty").hidden = items.length > 0;
  }

  function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthStart = new Date(year, month, 1, 12);
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    const leadingDays = monthStart.getDay();
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
    const grid = document.getElementById("calendar-grid");
    document.getElementById("calendar-title").textContent =
      calendarDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    grid.replaceChildren();

    for (let cell = 0; cell < totalCells; cell += 1) {
      const dayNumber = cell - leadingDays + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        const blank = makeElement("span", "calendar-blank");
        blank.setAttribute("aria-hidden", "true");
        grid.append(blank);
        continue;
      }
      const value = localDateString(new Date(year, month, dayNumber, 12));
      const due = data.assignments.filter(function (item) { return item.due === value; });
      const button = makeElement("button", "calendar-day", undefined);
      button.type = "button";
      if (value === localDateString(new Date())) button.classList.add("today");
      if (value === selectedCalendarDate) button.classList.add("selected");
      button.setAttribute("aria-label", formatDate(value, { weekday: "long", month: "long", day: "numeric" }) +
        (due.length ? ", " + due.length + " deadline" + (due.length === 1 ? "" : "s") : ""));
      if (value === selectedCalendarDate) button.setAttribute("aria-pressed", "true");
      else button.setAttribute("aria-pressed", "false");
      button.append(makeElement("span", "calendar-number", String(dayNumber)));
      if (due.length) {
        button.append(makeElement("span", "calendar-mark"));
        button.title = due.length + " assignment deadline" + (due.length === 1 ? "" : "s");
      }
      button.addEventListener("click", function () {
        selectedCalendarDate = value;
        planDate.value = value;
        renderDashboard();
        renderCalendar();
      });
      grid.append(button);
    }

    const selectedItems = data.assignments.filter(function (item) { return item.due === selectedCalendarDate; });
    const list = document.getElementById("calendar-deadline-list");
    list.replaceChildren();
    selectedItems.forEach(function (item) {
      const row = makeElement("li", "deadline-item");
      row.append(
        makeElement("span", "deadline-date", formatMinutes(item.minutes)),
        makeElement("div", "agenda-details", undefined)
      );
      row.lastElementChild.append(
        makeElement("strong", "", item.name),
        makeElement("span", "item-meta", formatWorkType(item.type) + " · " + item.course + " · " +
          (item.done ? "completed" : item.priority + " priority"))
      );
      list.append(row);
    });
    document.getElementById("calendar-empty").hidden = selectedItems.length > 0;
    document.getElementById("calendar-day-heading").textContent = formatDate(selectedCalendarDate, {
      month: "long",
      day: "numeric"
    });
  }

  function renderAnalytics() {
    const today = new Date();
    const todayString = localDateString(today);
    const study = getStudySessions(planDate.value);
    const daysUntilWeekEnd = localDateString(addDays(dateFromString(todayString), 7));
    const weekWork = data.assignments.filter(function (item) {
      return !item.done && item.due <= daysUntilWeekEnd;
    }).reduce(function (total, item) { return total + item.minutes; }, 0);
    const outlookDays = Number(document.getElementById("analytics-horizon").value);
    const rows = [];
    for (let offset = 0; offset < outlookDays; offset += 1) {
      const date = localDateString(addDays(dateFromString(todayString), offset));
      const workload = data.assignments.filter(function (item) {
        return !item.done && item.due === date;
      }).reduce(function (total, item) { return total + item.minutes; }, 0);
      rows.push({ date: date, workload: workload, available: availableMinutes(date) });
    }
    const maximum = Math.max(60, ...rows.map(function (row) {
      return Math.max(row.workload, row.available);
    }));

    document.getElementById("analytics-available").textContent = formatMinutes(availableMinutes(planDate.value));
    document.getElementById("analytics-planned").textContent = formatMinutes(
      study.sessions.reduce(function (total, session) { return total + session.end - session.start; }, 0)
    );
    document.getElementById("analytics-week-work").textContent =
      (weekWork / 60).toFixed(weekWork % 60 ? 1 : 0) + "h";
    const classConflicts = study.sessions.filter(function (session) {
      return classesForDate(planDate.value).some(function (meeting) {
        return timeInMinutes(meeting.start) < session.end && timeInMinutes(meeting.end) > session.start;
      });
    }).length;
    document.getElementById("analytics-conflicts").textContent = String(classConflicts);

    const chart = document.getElementById("workload-chart");
    chart.replaceChildren();
    const legend = makeElement("div", "chart-legend");
    legend.append(
      makeElement("span", "workload-legend", "Work due"),
      makeElement("span", "availability-legend", "Study time available")
    );
    chart.append(legend);
    rows.forEach(function (row) {
      const line = makeElement("div", "bar-row");
      line.append(makeElement("span", "bar-day", formatDate(row.date, { weekday: "short", month: "short", day: "numeric" })));
      const values = makeElement("div", "bar-metrics");
      [
        { label: "Work due", value: row.workload, className: "workload-fill" },
        { label: "Study time available", value: row.available, className: "availability-fill" }
      ].forEach(function (metric) {
        const metricRow = makeElement("div", "bar-metric");
        const track = makeElement("span", "bar-track");
        const fill = makeElement("span", "bar-fill " + metric.className);
        fill.style.width = Math.max(metric.value ? 2 : 0, metric.value / maximum * 100) + "%";
        track.append(fill);
        metricRow.append(track, makeElement("span", "bar-hours", formatMinutes(metric.value)));
        metricRow.setAttribute("aria-label", metric.label + ": " + formatMinutes(metric.value));
        values.append(metricRow);
      });
      line.append(values);
      chart.append(line);
    });

    const upcoming = assignmentsByDueDate(false).filter(function (item) {
      return item.due <= localDateString(addDays(dateFromString(planDate.value), 7));
    });
    const decisionList = document.getElementById("decision-list");
    decisionList.replaceChildren();
    const nearest = upcoming[0];
    const totalAvailable = availableMinutes(planDate.value);
    const plannedMinutes = study.sessions.reduce(function (total, session) { return total + session.end - session.start; }, 0);
    const firstDecision = makeElement("li");
    if (nearest) {
      firstDecision.append(
        document.createTextNode("The next deadline is "),
        makeElement("strong", "", nearest.name),
        document.createTextNode(" on " + formatDate(nearest.due) + ". Earlier deadlines are considered first.")
      );
    } else {
      firstDecision.textContent = "There are no unfinished assignments due in the next week. Add work to get a tailored plan.";
    }
    const secondDecision = makeElement("li");
    secondDecision.append(
      document.createTextNode("Your study window is "),
      makeElement("strong", "", formatTime(data.settings.start) + "–" + formatTime(data.settings.end)),
      document.createTextNode(". Class times are removed before any study sessions are placed.")
    );
    const thirdDecision = makeElement("li");
    thirdDecision.append(
      document.createTextNode("There are "),
      makeElement("strong", "", formatMinutes(totalAvailable) + " available"),
      document.createTextNode(" in your selected study window on " + formatDate(planDate.value) +
        "; the planner schedules " + formatMinutes(plannedMinutes) + " for upcoming work.")
    );
    const fourthDecision = makeElement("li");
    fourthDecision.textContent = upcoming.length
      ? "Assignments are scheduled by due date first; priority moves high-priority work ahead when due dates match."
      : "Completing or removing an assignment immediately updates your workload and study suggestions.";
    decisionList.replaceChildren(firstDecision, secondDecision, thirdDecision, fourthDecision);
  }

  function renderAll() {
    startInput.value = data.settings.start;
    endInput.value = data.settings.end;
    renderDashboard();
    renderWeek();
    renderAssignments();
    renderCalendar();
    renderAnalytics();
  }

  function updateAssignment(id, updates) {
    data.assignments = data.assignments.map(function (item) {
      return item.id === id ? Object.assign({}, item, updates) : item;
    });
    saveData();
  }

  function editClass(item) {
    editingClassId = item.id;
    classForm.elements.name.value = item.name;
    classForm.elements.day.value = String(item.day);
    classForm.elements.start.value = item.start;
    classForm.elements.end.value = item.end;
    document.getElementById("class-form-heading").textContent = "Edit class";
    classSubmit.textContent = "Save changes";
    classCancel.hidden = false;
    classForm.elements.name.focus();
  }

  function resetClassForm() {
    editingClassId = null;
    classForm.reset();
    document.getElementById("class-form-heading").textContent = "Add a class";
    classSubmit.textContent = "Add class";
    classCancel.hidden = true;
    classMessage.textContent = "";
  }

  function editAssignment(item) {
    editingAssignmentId = item.id;
    assignmentForm.elements.name.value = item.name;
    assignmentForm.elements.course.value = item.course;
    assignmentForm.elements.type.value = item.type;
    assignmentForm.elements.due.value = item.due;
    assignmentForm.elements.minutes.value = String(item.minutes);
    assignmentForm.elements.priority.value = item.priority;
    assignmentForm.elements.notes.value = item.notes;
    document.getElementById("assignment-form-heading").textContent = "Edit assignment";
    assignmentSubmit.textContent = "Save changes";
    assignmentCancel.hidden = false;
    assignmentForm.elements.name.focus();
  }

  function resetAssignmentForm() {
    editingAssignmentId = null;
    assignmentForm.reset();
    assignmentForm.elements.minutes.value = "60";
    assignmentForm.elements.priority.value = "medium";
    document.getElementById("assignment-form-heading").textContent = "New assignment";
    assignmentSubmit.textContent = "Add assignment";
    assignmentCancel.hidden = true;
  }

  classForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const values = new FormData(classForm);
    const name = String(values.get("name")).trim();
    const day = Number(values.get("day"));
    const start = String(values.get("start"));
    const end = String(values.get("end"));
    if (!name || start >= end) {
      classMessage.textContent = "Choose a course name and an end time after the start time.";
      return;
    }
    const overlaps = data.classes.some(function (item) {
      return item.id !== editingClassId && Number(item.day) === day && start < item.end && end > item.start;
    });
    if (overlaps) {
      classMessage.textContent = "That time overlaps another class on this day.";
      return;
    }

    const updated = { id: editingClassId || makeId(), name: name, day: day, start: start, end: end };
    if (editingClassId) {
      data.classes = data.classes.map(function (item) { return item.id === editingClassId ? updated : item; });
    } else {
      data.classes.push(updated);
    }
    resetClassForm();
    saveData();
  });

  classCancel.addEventListener("click", resetClassForm);

  assignmentForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const values = new FormData(assignmentForm);
    const minutes = Number(values.get("minutes"));
    const item = {
      id: editingAssignmentId || makeId(),
      name: String(values.get("name")).trim(),
      course: String(values.get("course")).trim(),
      type: String(values.get("type")),
      due: String(values.get("due")),
      minutes: minutes,
      priority: String(values.get("priority")),
      notes: String(values.get("notes")).trim(),
      done: editingAssignmentId
        ? data.assignments.find(function (assignment) { return assignment.id === editingAssignmentId; }).done
        : false
    };
    if (!item.name || !item.course || !validDate(item.due) ||
      !Number.isInteger(minutes) || minutes < 15 || minutes > 600 || minutes % 15 !== 0 ||
      !Object.prototype.hasOwnProperty.call(PRIORITY_RANK, item.priority) || !WORK_TYPES.includes(item.type)) {
      return;
    }
    if (editingAssignmentId) {
      data.assignments = data.assignments.map(function (entry) {
        return entry.id === editingAssignmentId ? item : entry;
      });
    } else {
      data.assignments.push(item);
    }
    resetAssignmentForm();
    saveData();
  });

  assignmentCancel.addEventListener("click", resetAssignmentForm);
  assignmentFilter.addEventListener("change", renderAssignments);

  document.getElementById("calendar-prev").addEventListener("click", function () {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1, 12);
    renderCalendar();
  });
  document.getElementById("calendar-next").addEventListener("click", function () {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1, 12);
    renderCalendar();
  });
  document.getElementById("calendar-today").addEventListener("click", function () {
    selectedCalendarDate = localDateString(new Date());
    calendarDate = dateFromString(selectedCalendarDate);
    planDate.value = selectedCalendarDate;
    renderDashboard();
    renderCalendar();
  });

  document.getElementById("analytics-horizon").addEventListener("change", renderAnalytics);
  planDate.addEventListener("change", function () {
    if (!validDate(planDate.value)) {
      planDate.value = localDateString(new Date());
      return;
    }
    selectedCalendarDate = planDate.value;
    calendarDate = dateFromString(planDate.value);
    renderDashboard();
    renderCalendar();
    renderAnalytics();
  });

  function saveAvailability() {
    if (!validTime(startInput.value) || !validTime(endInput.value) || startInput.value >= endInput.value) {
      showStorageNotice("Choose a study window whose end time is after its start time. Your previous window is still in use.");
      startInput.value = data.settings.start;
      endInput.value = data.settings.end;
      return;
    }
    data.settings.start = startInput.value;
    data.settings.end = endInput.value;
    saveData();
  }
  startInput.addEventListener("change", saveAvailability);
  endInput.addEventListener("change", saveAvailability);

  document.getElementById("reset-data").addEventListener("click", function () {
    if (!window.confirm("Reset your planner to the fictional StudySync sample schedule and assignments? Your current planner data will be replaced.")) {
      return;
    }
    data = sampleData();
    resetClassForm();
    resetAssignmentForm();
    selectedCalendarDate = localDateString(new Date());
    calendarDate = dateFromString(selectedCalendarDate);
    planDate.value = selectedCalendarDate;
    saveData();
  });

  window.addEventListener("hashchange", switchView);
  planDate.value = localDateString(new Date());
  switchView();
  renderAll();
})();
