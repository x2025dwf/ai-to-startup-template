# Business case: StudySync

## 1. The idea

- Customer: StudySync is designed for college and university students who manage recurring classes alongside assignments, exams, and other deadlines. It is especially useful for students who currently keep that information in several places.
- Problem: A student's timetable may be in one place, assignment deadlines are on Moodle, and personal study plans in a notebook or separate calendar. Moving between those sources makes it harder to see how much work is due and when there is time to do it. Students may respond by checking several tools or planning manually.
- Solution: StudySync brings weekly classes, assignments, exams, priorities, and estimated work time into one planner. It suggests study sessions in the student's chosen study window, avoids scheduled class times, and considers due dates and priority. A calendar, progress tracker, and workload insights help students review and adjust the plan. The prototype stores information in the browser and does not connect to school systems.
- Revenue: The prototype is free and does not process payments. A possible future model is premmium: keep core planning free and offer optional paid features such as secure cross-device sync, calendar integrations, or additional planning tools. A school license could also be explored, but it would require evidence that institutions want and would pay for the service.

## 2. Where IT creates value

StudySync changes the student's personal planning and coordination work: instead of manually comparing a timetable with several deadlines, the planner combines those inputs and suggests available study blocks. This is differentiation through a simpler, more connected workflow. Since it is software, a finished web product could be distributed to many users without producing a separate physical product for each one; that offers potential scale, although support, hosting, and development still have costs.

The website is a direct digital distribution channel. In the prototype, students enter their own information, and the planner uses it to personalize suggestions. That data creates immediate value for its owner but is stored only in their browser; it is not collected as a company-wide dataset. Switching costs are currently low: students could move their information elsewhere or deside not to use it at all, and the prototype has no integrations or account history tying them to the product. A real service should keep data portable rather than relying on making it difficult to leave.

## 3. Network effects

StudySync is currently a one-sided product: students use the planner for themselves. It does not have a second customer group such as tutors, profs or schools, and one student's use does not automatically make another student's planner more useful. That means the prototype has little direct network effect today.

If a future version added optional shared study groups or class planning, more participating students might make those features more useful. Such a feature would need clear consent and privacy safeguards; personal schedules and assignment details should not be shared by default. The current prototype does not include sharing or collect group data.

StudySync can address the empty network problem without a network: an individual student can enter classes and assignments and get value immediately. The fictional sample schedule and assignments in the prototype demonstrate how a new user can explore the planner before entering their own data. The “Reset sample data” option restores that example.

## 4. Can it be copied? (the moat question)

The code and feature set are not a lasting moat. Another team could copy the basic planner, calendar, and dashboard. Using the VRIN framework:

- Valuable: Combining class availability with deadlines can help students make a practical study plan.
- Rare: The basic features are not rare; calendars, task lists, and study planners already exist.
- Hard to imitate: The prototype is not hard to imitate. Over time, a trusted student-focused experience, useful integrations, and strong relationships with schools could be harder to reproduce than the code alone.
- Organized to capture value: The prototype demonstrates the workflow, but it has no operating company, support team, partnerships, or paid offering yet.

A competitor with a capable team could reproduce the prototype in weeks. A production-ready service with tested integrations, accessibility, security, and school partnerships would take longer, but none of those advantages is established by this demo. Brand trust, reliable service, and institution relationships could strengthen over time if StudySync earns them. User data should not be treated as a moat unless students knowingly choose to contribute it and the business can protect it responsibly.

## 5. Cloud and operations

The current site is a static HTML, CSS, and JavaScript prototype. It can be hosted as static files, and it stores planner information in browser `localStorage`; there is no server, account system, or backup. This makes the demo inexpensive to operate, but the data is tied to one browser and can be lost if its storage is cleared.

A real multi-device product could begin with a managed PaaS for hosting and backend services, plus a managed database and a reputable identity provider if accounts are introduced. It would also need secure backups, monitoring, data export and deletion, support, and possibly calendar integrations. A small early product would not necessarily need to operate its own IaaS infrastructure. Depending on cloud vendors brings risks such as outages, price changes, service lock-in, and third-party access; the company would need to assess providers, limit the data it stores, and plan for backup and migration.

## 6. Risks and ethics

Students' schedules and academic workload can reveal personal routines. A shared device, insecure account, unnecessary data collection, or a service breach could expose that information. The local-only prototype reduces the amount of data sent elsewhere, but browser storage is not encrypted by the app and is not a secure account or backup.

Planning suggestions can also be inaccurate or unrealistic. A missed deadline, incorrect class time, or overfull study plan could add stress. StudySync should explain that suggestions are estimates, let students edit or ignore them, and avoid presenting the planner as a guarantee of academic success. The interface should be accessible on mobile devices and to students using assistive technology.

A real service should collect only the information it needs, explain how it is used, provide straightforward export and deletion, secure stored data, and avoid selling personal study schedules. Any sharing or analytics beyond an individual user's plan should be opt-in and designed to prevent identification. The product should not make high-stakes judgments about students or penalize people for how they use the planner.
