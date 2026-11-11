/**
 * DeenImpact Academy - CBT Examination Simulator Engine
 * Supports SSCE (WAEC/NECO) & JAMB UTME with 8-Key Navigation, Timer, On-Screen Calculator & Review
 */

const SUBJECT_CATALOG = {
  english: { title: "Use of English", icon: "📖", category: "Core", tag: "Compulsory for JAMB" },
  mathematics: { title: "General Mathematics", icon: "📐", category: "Science / Commercial", tag: "STEM & Core" },
  physics: { title: "Physics", icon: "⚡", category: "Science", tag: "STEM" },
  chemistry: { title: "Chemistry", icon: "🧪", category: "Science", tag: "STEM" },
  biology: { title: "Biology", icon: "🔬", category: "Science", tag: "STEM & Health" },
  government: { title: "Government", icon: "🏛️", category: "Arts / Social Science", tag: "Humanities" },
  economics: { title: "Economics", icon: "📈", category: "Commercial / Social Science", tag: "Social Sciences" },
  civic: { title: "Civic Education", icon: "⚖️", category: "Core", tag: "National Values" },
  irs: { title: "Islamic Religious Studies (IRS)", icon: "🕌", category: "Arts", tag: "Religious Studies" },
  crs: { title: "Christian Religious Studies (CRS)", icon: "✝️", category: "Arts", tag: "Religious Studies" },
  literature: { title: "Literature in English", icon: "📚", category: "Arts", tag: "Humanities" },
  yoruba: { title: "Yoruba Language", icon: "🗣️", category: "Languages", tag: "Indigenous Language" },
  accounting: { title: "Financial Accounting", icon: "💰", category: "Commercial", tag: "Business & Finance" },
  livestock: { title: "Livestock Farming", icon: "🐄", category: "Vocational Trades", tag: "Trade Subject" },
  agriculture: { title: "Agricultural Science", icon: "🌾", category: "Science / Vocational", tag: "Agronomy" }
};

const JAMB_PRESETS = {
  medicine: {
    name: "Medicine & Health Sciences",
    subjects: ["english", "biology", "chemistry", "physics"]
  },
  engineering: {
    name: "Engineering & Technology",
    subjects: ["english", "mathematics", "physics", "chemistry"]
  },
  commercial: {
    name: "Commercial & Business",
    subjects: ["english", "economics", "mathematics", "accounting"]
  },
  arts: {
    name: "Law & Arts (IRS option)",
    subjects: ["english", "literature", "government", "irs"]
  },
  arts_crs: {
    name: "Law & Arts (CRS option)",
    subjects: ["english", "literature", "government", "crs"]
  },
  agriculture: {
    name: "Agricultural Science",
    subjects: ["english", "agriculture", "biology", "chemistry"]
  }
};

// Global CBT State
const CBT = {
  mode: "jamb", // 'jamb' or 'single'
  studyMode: false, // In single mode: true = instant explanation
  candidateName: "JAMB / SSCE Practice Candidate",
  selectedSubjects: ["english", "biology", "chemistry", "physics"],
  currentSubIndex: 0,
  currentQIndex: 0,
  questionsData: {}, // { english: [...], physics: [...] }
  userAnswers: {},   // { english: { 0: 'A', 1: 'B' } }
  flaggedMap: {},    // { english: { 0: true } }
  timerSeconds: 40 * 60, // Total remaining seconds
  totalExamSeconds: 40 * 60,
  timerInterval: null,
  reviewFilter: "all" // 'all', 'wrong', 'correct'
};

document.addEventListener("DOMContentLoaded", () => {
  initCBTTabs();
  renderSubjectGrid();
  initPresetButtons();
  initCalculator();
  init8KeyNavigation();
});

/* -------------------------------------------------------------
   Setup Screen UI Handlers
   ------------------------------------------------------------- */
function initCBTTabs() {
  const tabs = document.querySelectorAll(".cbt-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const mode = tab.dataset.mode;
      CBT.mode = mode;
      
      const jambPanel = document.getElementById("panelJambMode");
      const singlePanel = document.getElementById("panelSingleMode");
      if (mode === "jamb") {
        jambPanel.style.display = "block";
        singlePanel.style.display = "none";
      } else {
        jambPanel.style.display = "none";
        singlePanel.style.display = "block";
      }
    });
  });
}

function renderSubjectGrid() {
  const grid = document.getElementById("singleSubjectGrid");
  if (!grid) return;
  grid.innerHTML = "";

  Object.entries(SUBJECT_CATALOG).forEach(([key, sub], idx) => {
    const card = document.createElement("div");
    card.className = `subject-card-select ${idx === 0 ? "selected" : ""}`;
    card.dataset.subject = key;
    card.innerHTML = `
      <div class="sub-icon">${sub.icon}</div>
      <div>
        <div class="sub-badge">${sub.category}</div>
        <div class="sub-title">${sub.title}</div>
      </div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".subject-card-select").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
    grid.appendChild(card);
  });
}

function initPresetButtons() {
  const container = document.getElementById("presetContainer");
  if (!container) return;

  Object.entries(JAMB_PRESETS).forEach(([key, p]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "faculty-preset-btn";
    btn.textContent = p.name;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".faculty-preset-btn").forEach(b => b.style.borderColor = "#cbd5e1");
      btn.style.borderColor = "#065f46";
      btn.style.backgroundColor = "#ecfdf5";
      
      document.getElementById("jambSub2").value = p.subjects[1];
      document.getElementById("jambSub3").value = p.subjects[2];
      document.getElementById("jambSub4").value = p.subjects[3];
    });
    container.appendChild(btn);
  });
}

/* -------------------------------------------------------------
   Start Examination & Data Fetching
   ------------------------------------------------------------- */
async function startExam(mode) {
  const nameInput = document.getElementById("candidateName");
  if (nameInput && nameInput.value.trim()) {
    CBT.candidateName = nameInput.value.trim();
  }

  CBT.mode = mode;
  CBT.userAnswers = {};
  CBT.flaggedMap = {};
  CBT.currentSubIndex = 0;
  CBT.currentQIndex = 0;

  if (mode === "jamb") {
    const sub2 = document.getElementById("jambSub2").value;
    const sub3 = document.getElementById("jambSub3").value;
    const sub4 = document.getElementById("jambSub4").value;

    const uniqueSet = new Set(["english", sub2, sub3, sub4]);
    if (uniqueSet.size < 4) {
      alert("Please ensure you choose 4 different subjects for your JAMB UTME combination.");
      return;
    }
    CBT.selectedSubjects = ["english", sub2, sub3, sub4];
    CBT.studyMode = false;
    CBT.timerSeconds = 40 * 60; // 40 mins for practice drill (10 per subject)
  } else {
    const selectedEl = document.querySelector(".subject-card-select.selected");
    const chosenSub = selectedEl ? selectedEl.dataset.subject : "english";
    CBT.selectedSubjects = [chosenSub];
    
    const studyCheck = document.getElementById("studyModeCheck");
    CBT.studyMode = studyCheck ? studyCheck.checked : false;
    
    const timeChoice = parseInt(document.getElementById("singleDurationSelect")?.value || "15", 10);
    CBT.timerSeconds = timeChoice * 60;
  }

  CBT.totalExamSeconds = CBT.timerSeconds;

  // Show Loading indicator
  const startBtns = document.querySelectorAll(".btn-start-cbt");
  startBtns.forEach(b => { b.disabled = true; b.textContent = "Loading Questions..."; });

  try {
    for (const sub of CBT.selectedSubjects) {
      if (!CBT.questionsData[sub]) {
        const resp = await fetch(`data/cbt/${sub}.json`);
        if (!resp.ok) throw new Error(`Could not load ${sub}`);
        const data = await resp.json();
        CBT.questionsData[sub] = data;
      }
      CBT.userAnswers[sub] = {};
      CBT.flaggedMap[sub] = {};
    }

    // Switch Screens
    document.getElementById("cbtSetupScreen").style.display = "none";
    document.getElementById("cbtResultScreen").style.display = "none";
    document.getElementById("cbtReviewScreen").style.display = "none";
    document.getElementById("cbtExamScreen").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    renderExamHeader();
    renderCurrentQuestion();
    renderPalette();
    startTimer();

  } catch (err) {
    console.error(err);
    alert("Error loading questions. Please check your internet connection.");
  } finally {
    startBtns.forEach(b => { b.disabled = false; b.textContent = "Begin Examination"; });
  }
}

/* -------------------------------------------------------------
   Active Exam Screen Rendering
   ------------------------------------------------------------- */
function renderExamHeader() {
  const nameEl = document.getElementById("examCandidateName");
  if (nameEl) nameEl.textContent = CBT.candidateName;

  const tabsContainer = document.getElementById("examSubjectTabs");
  if (!tabsContainer) return;
  tabsContainer.innerHTML = "";

  if (CBT.mode === "jamb") {
    tabsContainer.style.display = "flex";
    CBT.selectedSubjects.forEach((subKey, idx) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = `cbt-sub-tab ${idx === CBT.currentSubIndex ? "active" : ""}`;
      tab.textContent = `${SUBJECT_CATALOG[subKey].title}`;
      tab.addEventListener("click", () => {
        CBT.currentSubIndex = idx;
        CBT.currentQIndex = 0;
        renderExamHeader();
        renderCurrentQuestion();
        renderPalette();
      });
      tabsContainer.appendChild(tab);
    });
  } else {
    tabsContainer.style.display = "none";
  }
}

function getCurrentQuestions() {
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];
  return CBT.questionsData[currentSub] || [];
}

function renderCurrentQuestion() {
  const questions = getCurrentQuestions();
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];
  const q = questions[CBT.currentQIndex];

  if (!q) return;

  // Update Meta
  document.getElementById("qNumberDisplay").textContent = `Question ${CBT.currentQIndex + 1} of ${questions.length}`;
  document.getElementById("qTopicDisplay").textContent = q.topic || SUBJECT_CATALOG[currentSub].title;
  document.getElementById("qExamDisplay").textContent = q.exam || "JAMB/WAEC";
  document.getElementById("qTextDisplay").innerHTML = q.question.replace(/\n/g, "<br>");

  // Render Options
  const optionsContainer = document.getElementById("optionsList");
  optionsContainer.innerHTML = "";

  const savedAnswer = CBT.userAnswers[currentSub]?.[CBT.currentQIndex];

  ["A", "B", "C", "D"].forEach(letter => {
    if (!q.options[letter]) return;

    const optItem = document.createElement("div");
    optItem.className = `cbt-option-item ${savedAnswer === letter ? "selected" : ""}`;
    optItem.dataset.option = letter;

    // In study mode after answer is chosen
    if (CBT.studyMode && savedAnswer) {
      if (letter === q.answer) {
        optItem.classList.add("correct-answer");
      } else if (savedAnswer === letter) {
        optItem.classList.add("wrong-selected");
      }
    }

    optItem.innerHTML = `
      <div class="cbt-option-letter">${letter}</div>
      <div class="cbt-option-text">${q.options[letter]}</div>
    `;

    optItem.addEventListener("click", () => {
      selectAnswer(letter);
    });

    optionsContainer.appendChild(optItem);
  });

  // Study Mode instant explanation box
  const studyBox = document.getElementById("studyExplanationBox");
  if (CBT.studyMode && savedAnswer) {
    studyBox.style.display = "block";
    const isCorrect = savedAnswer === q.answer;
    studyBox.innerHTML = `
      <div style="font-weight: 800; font-size: 1rem; color: ${isCorrect ? '#065f46' : '#b91c1c'}; margin-bottom: 0.35rem;">
        ${isCorrect ? "✓ Correct Answer!" : `✗ Incorrect (Correct Answer is Option ${q.answer})`}
      </div>
      <div>${q.explanation || 'No further explanation available.'}</div>
    `;
  } else {
    studyBox.style.display = "none";
  }

  // Update Prev / Next buttons
  const prevBtn = document.getElementById("btnPrevQ");
  const nextBtn = document.getElementById("btnNextQ");

  if (prevBtn) {
    prevBtn.disabled = (CBT.currentQIndex === 0 && CBT.currentSubIndex === 0);
  }
  if (nextBtn) {
    const isLastQ = CBT.currentQIndex === questions.length - 1;
    const isLastSub = CBT.currentSubIndex === CBT.selectedSubjects.length - 1;
    nextBtn.textContent = (isLastQ && isLastSub) ? "End of Exam" : "Next (N) ➡";
  }

  // Update Flag button state
  const flagBtn = document.getElementById("btnFlagQ");
  const isFlagged = CBT.flaggedMap[currentSub]?.[CBT.currentQIndex];
  if (flagBtn) {
    if (isFlagged) {
      flagBtn.classList.add("flagged");
      flagBtn.innerHTML = "🚩 Flagged (R)";
    } else {
      flagBtn.classList.remove("flagged");
      flagBtn.innerHTML = "🏳️ Flag Question (R)";
    }
  }

  updatePaletteStatus();
}

function selectAnswer(letter) {
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];
  if (!CBT.userAnswers[currentSub]) {
    CBT.userAnswers[currentSub] = {};
  }
  CBT.userAnswers[currentSub][CBT.currentQIndex] = letter;
  renderCurrentQuestion();
  renderPalette();
}

function nextQuestion() {
  const questions = getCurrentQuestions();
  if (CBT.currentQIndex < questions.length - 1) {
    CBT.currentQIndex++;
    renderCurrentQuestion();
    renderPalette();
  } else if (CBT.currentSubIndex < CBT.selectedSubjects.length - 1) {
    // Jump to next subject
    CBT.currentSubIndex++;
    CBT.currentQIndex = 0;
    renderExamHeader();
    renderCurrentQuestion();
    renderPalette();
  }
}

function prevQuestion() {
  if (CBT.currentQIndex > 0) {
    CBT.currentQIndex--;
    renderCurrentQuestion();
    renderPalette();
  } else if (CBT.currentSubIndex > 0) {
    // Jump to previous subject last question
    CBT.currentSubIndex--;
    const prevQuestions = getCurrentQuestions();
    CBT.currentQIndex = Math.max(0, prevQuestions.length - 1);
    renderExamHeader();
    renderCurrentQuestion();
    renderPalette();
  }
}

function toggleFlag() {
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];
  if (!CBT.flaggedMap[currentSub]) {
    CBT.flaggedMap[currentSub] = {};
  }
  const curr = CBT.flaggedMap[currentSub][CBT.currentQIndex];
  CBT.flaggedMap[currentSub][CBT.currentQIndex] = !curr;
  renderCurrentQuestion();
  renderPalette();
}

/* -------------------------------------------------------------
   Question Palette (Grid of Numbers)
   ------------------------------------------------------------- */
function renderPalette() {
  const grid = document.getElementById("paletteGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const questions = getCurrentQuestions();
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];

  questions.forEach((_, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cbt-palette-btn";
    btn.textContent = idx + 1;

    const isAnswered = CBT.userAnswers[currentSub]?.[idx] !== undefined;
    const isFlagged = CBT.flaggedMap[currentSub]?.[idx];
    const isCurrent = idx === CBT.currentQIndex;

    if (isAnswered) btn.classList.add("answered");
    if (isFlagged) btn.classList.add("flagged");
    if (isCurrent) btn.classList.add("current");

    btn.addEventListener("click", () => {
      CBT.currentQIndex = idx;
      renderCurrentQuestion();
      renderPalette();
    });

    grid.appendChild(btn);
  });

  updatePaletteStatus();
}

function updatePaletteStatus() {
  let answeredCount = 0;
  let flaggedCount = 0;
  let totalCount = 0;

  CBT.selectedSubjects.forEach(sub => {
    const qs = CBT.questionsData[sub] || [];
    totalCount += qs.length;
    answeredCount += Object.keys(CBT.userAnswers[sub] || {}).length;
    flaggedCount += Object.values(CBT.flaggedMap[sub] || {}).filter(Boolean).length;
  });

  const ansEl = document.getElementById("paletteAnsweredCount");
  const unansEl = document.getElementById("paletteUnansweredCount");
  const flagEl = document.getElementById("paletteFlaggedCount");

  if (ansEl) ansEl.textContent = answeredCount;
  if (unansEl) unansEl.textContent = Math.max(0, totalCount - answeredCount);
  if (flagEl) flagEl.textContent = flaggedCount;
}

/* -------------------------------------------------------------
   Timer & Countdown
   ------------------------------------------------------------- */
function startTimer() {
  clearInterval(CBT.timerInterval);
  const timerBadge = document.getElementById("examTimerDisplay");

  updateTimerDisplay();

  CBT.timerInterval = setInterval(() => {
    CBT.timerSeconds--;

    if (timerBadge) {
      if (CBT.timerSeconds <= 120) {
        timerBadge.className = "cbt-timer-badge danger";
      } else if (CBT.timerSeconds <= 300) {
        timerBadge.className = "cbt-timer-badge warning";
      } else {
        timerBadge.className = "cbt-timer-badge";
      }
    }

    updateTimerDisplay();

    if (CBT.timerSeconds <= 0) {
      clearInterval(CBT.timerInterval);
      alert("Time is up! Your exam will now be automatically submitted.");
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerBadge = document.getElementById("examTimerDisplay");
  if (!timerBadge) return;
  const m = Math.floor(CBT.timerSeconds / 60);
  const s = CBT.timerSeconds % 60;
  timerBadge.textContent = `⏱ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* -------------------------------------------------------------
   8-Key Navigation Listener (A, B, C, D, P, N, S, R)
   ------------------------------------------------------------- */
function init8KeyNavigation() {
  window.addEventListener("keydown", (e) => {
    // Only active during exam screen
    const examScreen = document.getElementById("cbtExamScreen");
    if (!examScreen || examScreen.style.display !== "block") return;

    // Ignore if typing inside input/calculator
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    const key = e.key.toUpperCase();

    if (["A", "B", "C", "D"].includes(key)) {
      selectAnswer(key);
    } else if (key === "N") {
      nextQuestion();
    } else if (key === "P") {
      prevQuestion();
    } else if (key === "R" || key === "F") {
      toggleFlag();
    } else if (key === "S") {
      promptSubmitExam();
    }
  });
}

/* -------------------------------------------------------------
   Exam Submission & Results Computation
   ------------------------------------------------------------- */
function promptSubmitExam() {
  let answered = 0;
  let total = 0;
  let flagged = 0;

  CBT.selectedSubjects.forEach(sub => {
    const qs = CBT.questionsData[sub] || [];
    total += qs.length;
    answered += Object.keys(CBT.userAnswers[sub] || {}).length;
    flagged += Object.values(CBT.flaggedMap[sub] || {}).filter(Boolean).length;
  });

  const unattempted = total - answered;

  const msg = `Are you sure you want to submit your examination?\n\n` +
              `• Answered: ${answered} of ${total}\n` +
              `• Unattempted: ${unattempted}\n` +
              `• Flagged for Review: ${flagged}\n\n` +
              `Click OK to finalize and view your score.`;

  if (confirm(msg)) {
    submitExam();
  }
}

function submitExam() {
  clearInterval(CBT.timerInterval);

  let totalQuestions = 0;
  let totalCorrect = 0;
  const subjectScores = {};

  CBT.selectedSubjects.forEach(sub => {
    const qs = CBT.questionsData[sub] || [];
    let correct = 0;
    qs.forEach((q, idx) => {
      const userChoice = CBT.userAnswers[sub]?.[idx];
      if (userChoice === q.answer) {
        correct++;
      }
    });
    subjectScores[sub] = {
      correct,
      total: qs.length,
      percentage: Math.round((correct / qs.length) * 100)
    };
    totalQuestions += qs.length;
    totalCorrect += correct;
  });

  const totalPercentage = Math.round((totalCorrect / totalQuestions) * 100);
  const timeUsedSecs = CBT.totalExamSeconds - Math.max(0, CBT.timerSeconds);
  const timeUsedStr = `${Math.floor(timeUsedSecs / 60)}m ${timeUsedSecs % 60}s`;

  // Render Result Screen
  document.getElementById("cbtExamScreen").style.display = "none";
  document.getElementById("cbtResultScreen").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  document.getElementById("resCandidateName").textContent = CBT.candidateName;
  document.getElementById("resScoreNum").textContent = totalCorrect;
  document.getElementById("resScoreDenom").textContent = `/ ${totalQuestions} (${totalPercentage}%)`;
  document.getElementById("resTimeSpent").textContent = timeUsedStr;

  // Grade badge & remark
  const remarkBadge = document.getElementById("resGradeRemark");
  if (totalPercentage >= 75) {
    remarkBadge.textContent = "🏆 Excellent Performance — Outstanding JAMB/SSCE Readiness!";
    remarkBadge.style.background = "#ecfdf5";
    remarkBadge.style.color = "#065f46";
  } else if (totalPercentage >= 50) {
    remarkBadge.textContent = "👍 Good Effort — Review Corrections to Target 80%+";
    remarkBadge.style.background = "#eff6ff";
    remarkBadge.style.color = "#1d4ed8";
  } else {
    remarkBadge.textContent = "📚 Needs Improvement — Review Step-by-Step Solutions Below";
    remarkBadge.style.background = "#fff1f2";
    remarkBadge.style.color = "#be123c";
  }

  // JAMB Scaled Score (out of 400) if in JAMB mode
  const jambScaleBox = document.getElementById("resJambScaledBox");
  if (CBT.mode === "jamb") {
    jambScaleBox.style.display = "block";
    const scaledScore = Math.round((totalCorrect / totalQuestions) * 400);
    document.getElementById("resJambScaledNum").textContent = `${scaledScore} / 400`;
  } else {
    jambScaleBox.style.display = "none";
  }

  // Subject Breakdown Cards
  const breakdownGrid = document.getElementById("resSubjectBreakdown");
  breakdownGrid.innerHTML = "";
  Object.entries(subjectScores).forEach(([sub, sc]) => {
    const box = document.createElement("div");
    box.className = "cbt-breakdown-box";
    box.innerHTML = `
      <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${SUBJECT_CATALOG[sub].icon}</div>
      <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 0.25rem;">${SUBJECT_CATALOG[sub].title}</div>
      <div style="font-size: 1.3rem; font-weight: 800; color: #065f46;">${sc.correct} / ${sc.total}</div>
      <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Score: ${sc.percentage}%</div>
    `;
    breakdownGrid.appendChild(box);
  });
}

/* -------------------------------------------------------------
   Review & Step-by-Step Corrections Screen
   ------------------------------------------------------------- */
function openReviewScreen(filter = "all") {
  CBT.reviewFilter = filter;
  document.getElementById("cbtResultScreen").style.display = "none";
  document.getElementById("cbtReviewScreen").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderReviewQuestions();
}

function renderReviewQuestions() {
  const container = document.getElementById("reviewQuestionsList");
  container.innerHTML = "";

  CBT.selectedSubjects.forEach(sub => {
    const qs = CBT.questionsData[sub] || [];
    
    // Subject Section Header
    const subHeader = document.createElement("div");
    subHeader.style.cssText = "margin: 2rem 0 1rem; padding: 0.75rem 1rem; background: #f8fafc; border-left: 4px solid #065f46; border-radius: 4px; font-weight: 800; font-size: 1.15rem; color: #0f172a;";
    subHeader.innerHTML = `${SUBJECT_CATALOG[sub].icon} ${SUBJECT_CATALOG[sub].title}`;
    container.appendChild(subHeader);

    qs.forEach((q, idx) => {
      const userChoice = CBT.userAnswers[sub]?.[idx];
      const isCorrect = userChoice === q.answer;

      if (CBT.reviewFilter === "wrong" && isCorrect) return;
      if (CBT.reviewFilter === "correct" && !isCorrect) return;

      const card = document.createElement("div");
      card.className = "cbt-question-card";
      card.style.marginBottom = "1.5rem";

      let optionsHtml = "";
      ["A", "B", "C", "D"].forEach(letter => {
        if (!q.options[letter]) return;
        let optClass = "cbt-option-item";
        if (letter === q.answer) {
          optClass += " correct-answer";
        } else if (userChoice === letter && !isCorrect) {
          optClass += " wrong-selected";
        }

        optionsHtml += `
          <div class="${optClass}">
            <div class="cbt-option-letter">${letter}</div>
            <div class="cbt-option-text">${q.options[letter]}</div>
            ${letter === q.answer ? '<span style="color:#059669; font-weight:800; font-size:0.85rem; margin-left:auto;">✓ Correct Answer</span>' : ''}
            ${userChoice === letter && !isCorrect ? '<span style="color:#dc2626; font-weight:800; font-size:0.85rem; margin-left:auto;">✗ Your Choice</span>' : ''}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="cbt-q-meta">
          <span class="cbt-q-number">Question ${idx + 1}</span>
          <span style="font-weight: 700; color: ${isCorrect ? '#059669' : '#dc2626'};">
            ${isCorrect ? "✓ Answered Correctly" : (userChoice ? "✗ Answered Incorrectly" : "⚪ Unattempted")}
          </span>
        </div>
        <div class="cbt-q-text">${q.question.replace(/\n/g, "<br>")}</div>
        <div class="cbt-options-list">${optionsHtml}</div>
        <div class="review-explanation-box">
          <strong>💡 Teacher's Step-by-Step Explanation:</strong><br>
          ${q.explanation || 'Review topic notes for comprehensive explanation.'}
        </div>
      `;
      container.appendChild(card);
    });
  });
}

function resetToSetup() {
  clearInterval(CBT.timerInterval);
  document.getElementById("cbtExamScreen").style.display = "none";
  document.getElementById("cbtResultScreen").style.display = "none";
  document.getElementById("cbtReviewScreen").style.display = "none";
  document.getElementById("cbtSetupScreen").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* -------------------------------------------------------------
   On-Screen Pop-Up Calculator
   ------------------------------------------------------------- */
let calcBuffer = "0";
function initCalculator() {
  const modal = document.getElementById("calcModal");
  const toggleBtn = document.getElementById("btnToggleCalc");
  const closeBtn = document.getElementById("btnCloseCalc");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      modal.style.display = (modal.style.display === "block") ? "none" : "block";
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
  }

  document.querySelectorAll(".calc-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.val;
      handleCalcInput(val);
    });
  });
}

function handleCalcInput(val) {
  const disp = document.getElementById("calcDisplay");
  if (!disp) return;

  if (val === "C") {
    calcBuffer = "0";
  } else if (val === "DEL") {
    calcBuffer = calcBuffer.length > 1 ? calcBuffer.slice(0, -1) : "0";
  } else if (val === "=") {
    try {
      // Safe math evaluation
      const sanitized = calcBuffer.replace(/×/g, "*").replace(/÷/g, "/");
      const res = Function(`'use strict'; return (${sanitized})`)();
      calcBuffer = String(Number(res.toFixed(6)));
    } catch {
      calcBuffer = "Error";
    }
  } else if (val === "sqrt") {
    try {
      const num = parseFloat(calcBuffer);
      calcBuffer = String(Math.sqrt(num));
    } catch {
      calcBuffer = "Error";
    }
  } else {
    if (calcBuffer === "0" || calcBuffer === "Error") {
      calcBuffer = val;
    } else {
      calcBuffer += val;
    }
  }
  disp.textContent = calcBuffer;
}
