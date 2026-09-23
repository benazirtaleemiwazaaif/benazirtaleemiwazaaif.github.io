// Quarterly stipend rates (PKR)
const RATES = {
  primary:   { boy: 2000, girl: 2500, label: "Primary",          ages: [4, 12] },
  secondary: { boy: 3000, girl: 3500, label: "Secondary",        ages: [8, 18] },
  higher:    { boy: 4000, girl: 4500, label: "Higher secondary", ages: [13, 22] }
};
const GIRL_PRIMARY_BONUS = 3000;
const rs = n => "Rs " + n.toLocaleString("en-PK");

// ---------- Eligibility checker ----------
const answers = {};

document.querySelectorAll(".seg").forEach(group => {
  group.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      group.querySelectorAll("button").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      answers[group.dataset.q] = btn.dataset.v;
    });
  });
});

const resultBox = document.getElementById("result");

function showResult(type, title, lines) {
  resultBox.className = "result " + type;
  resultBox.innerHTML = "";
  const h = document.createElement("h3");
  h.textContent = title;
  resultBox.appendChild(h);
  lines.forEach(t => {
    const p = document.createElement("p");
    p.textContent = t;
    resultBox.appendChild(p);
  });
  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

document.getElementById("checkBtn").addEventListener("click", () => {
  const age = parseInt(document.getElementById("age").value, 10);
  const { kafaalat, level, school } = answers;

  if (!kafaalat || !level || !school || isNaN(age)) {
    showResult("warn", "Answer all four questions", ["Pick an option for each question and enter the child's age, then press Check again."]);
    return;
  }

  if (kafaalat === "no") {
    showResult("no", "Not eligible yet", [
      "Taleemi Wazaif is only for children of active Benazir Kafaalat beneficiaries.",
      "The mother first needs to qualify for Kafaalat. Send her CNIC to 8171 to check her status."
    ]);
    return;
  }

  if (school === "no") {
    showResult("no", "Not eligible right now", [
      "The child must be enrolled in school and attending regularly.",
      "Once the child is admitted and attending, you can register at the BISP tehsil office."
    ]);
    return;
  }

  const r = RATES[level];
  const inRange = age >= r.ages[0] && age <= r.ages[1];

  if (!inRange) {
    showResult("warn", "Check the age band", [
      "BISP's age band for " + r.label.toLowerCase() + " is " + r.ages[0] + " to " + r.ages[1] + " years, and the child is " + age + ".",
      "Confirm the child's level and age with your BISP tehsil office before applying."
    ]);
    return;
  }

  const amount = "Expected stipend: " + rs(r.boy) + " per quarter for a boy, " + rs(r.girl) + " for a girl.";

  if (kafaalat === "unsure") {
    showResult("warn", "Likely eligible, confirm Kafaalat first", [
      "The child meets the school and age conditions.",
      "Send the mother's CNIC to 8171 to confirm she is an active Kafaalat beneficiary.",
      amount
    ]);
    return;
  }

  showResult("ok", "Your child looks eligible", [
    "Take the mother's CNIC and the child's B-Form to the nearest BISP tehsil office to register.",
    amount
  ]);
});

// ---------- Stipend calculator ----------
const kidsEl = document.getElementById("kids");
const qTotalEl = document.getElementById("qTotal");
const yTotalEl = document.getElementById("yTotal");
const bonusEl = document.getElementById("bonusNote");
let kidId = 0;

function makeSelect(options, value) {
  const s = document.createElement("select");
  options.forEach(([v, t]) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = t;
    if (v === value) o.selected = true;
    s.appendChild(o);
  });
  return s;
}

function addKid(gender, level) {
  kidId++;
  const row = document.createElement("div");
  row.className = "kid";

  const num = document.createElement("span");
  num.className = "kid-num";

  const g = makeSelect([["girl", "Girl"], ["boy", "Boy"]], gender || "girl");
  g.setAttribute("aria-label", "Gender");
  const l = makeSelect([["primary", "Primary"], ["secondary", "Secondary"], ["higher", "Higher secondary"]], level || "primary");
  l.setAttribute("aria-label", "Class level");

  const amt = document.createElement("span");
  amt.className = "kid-amt";

  const del = document.createElement("button");
  del.type = "button";
  del.className = "kid-del";
  del.textContent = "×";
  del.setAttribute("aria-label", "Remove child");
  del.addEventListener("click", () => { row.remove(); calc(); });

  g.addEventListener("change", calc);
  l.addEventListener("change", calc);

  row.append(num, g, l, amt, del);
  kidsEl.appendChild(row);
  calc();
}

function calc() {
  let total = 0;
  let girlsPrimary = 0;
  const rows = kidsEl.querySelectorAll(".kid");

  rows.forEach((row, i) => {
    const [g, l] = row.querySelectorAll("select");
    const amount = RATES[l.value][g.value];
    total += amount;
    if (g.value === "girl" && l.value === "primary") girlsPrimary++;
    row.querySelector(".kid-num").textContent = "Child " + (i + 1);
    row.querySelector(".kid-amt").textContent = rs(amount);
  });

  qTotalEl.textContent = rs(total);
  yTotalEl.textContent = rs(total * 4);

  if (girlsPrimary > 0) {
    bonusEl.textContent = "Bonus: each girl who completes primary gets a one-time " + rs(GIRL_PRIMARY_BONUS) +
      (girlsPrimary > 1 ? " (up to " + rs(GIRL_PRIMARY_BONUS * girlsPrimary) + " for your " + girlsPrimary + " girls)." : ".");
    bonusEl.hidden = false;
  } else {
    bonusEl.hidden = true;
  }
}

document.getElementById("addKid").addEventListener("click", () => addKid());

// Start with two example children
addKid("girl", "primary");
addKid("boy", "secondary");
