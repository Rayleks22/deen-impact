/**
 * DeenImpact Academy - CBT Examination Simulator Engine
 * Supports SSCE (WAEC/NECO) & JAMB UTME with Multi-Year Question Pools,
 * Per-Student Randomization & Option Shuffling, Timer, Calculator, and In-Depth Topic Review.
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

// Global CBT Engine State
const CBT = {
  mode: "jamb", // 'jamb' or 'single'
  studyMode: false,
  candidateName: "JAMB / SSCE Practice Candidate",
  selectedSubjects: ["english", "biology", "chemistry", "physics"],
  currentSubIndex: 0,
  currentQIndex: 0,
  rawBank: {},          // Raw full question banks cached per subject
  questionsData: {},    // Active randomized & option-scrambled questions for current student session
  userAnswers: {},      // { english: { 0: 'A', 1: 'C' } }
  flaggedMap: {},       // { english: { 0: true } }
  timerSeconds: 40 * 60,
  totalExamSeconds: 40 * 60,
  timerInterval: null,
  reviewFilter: "all"
};

document.addEventListener("DOMContentLoaded", () => {
  initCBTTabs();
  renderSubjectGrid();
  initPresetButtons();
  initCalculator();
  init8KeyNavigation();
});

/* -------------------------------------------------------------
   Randomization & Option Shuffling Utilities (Fisher-Yates)
   ------------------------------------------------------------- */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Scrambles options A, B, C, D for a single question per student session
 * to prevent malpractice and ensure answer choices are not identical
 */
function scrambleQuestionOptions(q) {
  const letters = ["A", "B", "C", "D"];
  const correctText = q.options[q.answer];
  
  const originalValues = letters.map(l => q.options[l]).filter(Boolean);
  const shuffledValues = shuffleArray(originalValues);
  
  const newOptions = {};
  let newAnswer = "A";

  letters.forEach((letter, idx) => {
    if (idx < shuffledValues.length) {
      newOptions[letter] = shuffledValues[idx];
      if (shuffledValues[idx] === correctText) {
        newAnswer = letter;
      }
    }
  });

  return {
    ...q,
    options: newOptions,
    answer: newAnswer,
    originalId: q.id
  };
}

/**
 * Samples N questions from a subject bank balancing multiple years and topics
 */
function selectSessionQuestions(rawBank, count) {
  if (!rawBank || rawBank.length === 0) return [];
  
  // If count >= bank length, return full shuffled bank
  if (count >= rawBank.length) {
    return shuffleArray(rawBank).map(q => scrambleQuestionOptions(q));
  }

  // Group by past year to ensure multi-year distribution
  const yearBuckets = {};
  rawBank.forEach(q => {
    const yr = q.year || "General";
    if (!yearBuckets[yr]) yearBuckets[yr] = [];
    yearBuckets[yr].push(q);
  });

  const selected = [];
  const years = shuffleArray(Object.keys(yearBuckets));
  const pickedIds = new Set();
  let yrIdx = 0;

  // Round-robin selection across different years
  while (selected.length < count && pickedIds.size < rawBank.length) {
    const yr = years[yrIdx % years.length];
    const available = yearBuckets[yr].filter(q => !pickedIds.has(q.id));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      selected.push(pick);
      pickedIds.add(pick.id);
    }
    yrIdx++;
  }

  // If still need more, pick randomly from remaining
  if (selected.length < count) {
    const remaining = rawBank.filter(q => !pickedIds.has(q.id));
    const extra = shuffleArray(remaining).slice(0, count - selected.length);
    selected.push(...extra);
  }

  // Final shuffle of question order and scramble options
  return shuffleArray(selected).map(q => scrambleQuestionOptions(q));
}

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

  Object.entries(SUBJECT_CATALOG).forEach(([key, info], idx) => {
    const card = document.createElement("div");
    card.className = `subject-card-select ${idx === 0 ? "selected" : ""}`;
    card.dataset.subject = key;
    card.innerHTML = `
      <div class="sub-icon">${info.icon}</div>
      <div>
        <div class="sub-badge">${info.tag}</div>
        <div class="sub-title">${info.title}</div>
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
  container.innerHTML = "";

  Object.entries(JAMB_PRESETS).forEach(([key, preset]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline";
    btn.style.cssText = "font-size: 0.8rem; padding: 0.4rem 0.75rem; border-radius: 999px;";
    btn.textContent = preset.name;
    btn.addEventListener("click", () => {
      applyJambPreset(key);
    });
    container.appendChild(btn);
  });
}

function applyJambPreset(presetKey) {
  const preset = JAMB_PRESETS[presetKey];
  if (!preset) return;

  const subs = preset.subjects; // [english, sub2, sub3, sub4]
  document.getElementById("jambSub2").value = subs[1];
  document.getElementById("jambSub3").value = subs[2];
  document.getElementById("jambSub4").value = subs[3];
}

/* -------------------------------------------------------------
   Exam Initialization (Dynamic Randomization per Student)
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

  let questionsPerSub = 10;

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

    // Read question count selector if available
    const jambCountSelect = document.getElementById("jambQuestionCountSelect");
    const countVal = jambCountSelect ? jambCountSelect.value : "official";

    if (countVal === "official") {
      // Official Full JAMB UTME Mock: Exactly 180 Questions (60 English + 40 per elective) in 120 Minutes
      CBT.jambQuestionsPerSub = {
        english: 60,
        [sub2]: 40,
        [sub3]: 40,
        [sub4]: 40
      };
      CBT.timerSeconds = 120 * 60; // 120 Minutes (2 Hours)
    } else {
      const qNum = parseInt(countVal, 10);
      CBT.jambQuestionsPerSub = {
        english: qNum,
        [sub2]: qNum,
        [sub3]: qNum,
        [sub4]: qNum
      };
      CBT.timerSeconds = qNum * 4 * 60; // 1 min per question
    }
  } else {
    const selectedEl = document.querySelector(".subject-card-select.selected");
    const chosenSub = selectedEl ? selectedEl.dataset.subject : "english";
    CBT.selectedSubjects = [chosenSub];
    
    const studyCheck = document.getElementById("studyModeCheck");
    CBT.studyMode = studyCheck ? studyCheck.checked : false;

    const singleCountSelect = document.getElementById("singleQuestionCountSelect");
    questionsPerSub = singleCountSelect ? parseInt(singleCountSelect.value, 10) : 50;
    
    const timeChoice = document.getElementById("singleDurationSelect")?.value || "60";
    if (timeChoice === "0") {
      CBT.timerSeconds = 999 * 60; // Untimed
    } else {
      CBT.timerSeconds = parseInt(timeChoice, 10) * 60;
    }
  }

  CBT.totalExamSeconds = CBT.timerSeconds;

  // Show Loading indicator
  const startBtns = document.querySelectorAll(".btn-start-cbt");
  startBtns.forEach(b => { b.disabled = true; b.textContent = "Loading Question Bank..."; });

  try {
    for (const sub of CBT.selectedSubjects) {
      // Load raw full question bank if not yet cached in memory
      if (!CBT.rawBank[sub]) {
        const resp = await fetch(`data/cbt/${sub}.json?v=${Date.now()}`);
        if (!resp.ok) throw new Error(`Could not load ${sub}`);
        const data = await resp.json();
        CBT.rawBank[sub] = data;
      }
      
      // Determine question count for this subject
      const subCount = (mode === "jamb" && CBT.jambQuestionsPerSub)
        ? (CBT.jambQuestionsPerSub[sub] || 40)
        : questionsPerSub;

      // Generate a fresh randomized & option-scrambled subset for this student session
      CBT.questionsData[sub] = selectSessionQuestions(CBT.rawBank[sub], subCount);
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

  // Update Meta Badges (Number, Year, Exam Body, Topic)
  document.getElementById("qNumberDisplay").textContent = `Question ${CBT.currentQIndex + 1} of ${questions.length}`;
  
  const yearEl = document.getElementById("qYearDisplay");
  if (yearEl) {
    yearEl.textContent = q.year ? `Year ${q.year}` : "Current Syllabus";
  }

  const examEl = document.getElementById("qExamDisplay");
  if (examEl) {
    examEl.textContent = q.exam || "JAMB UTME";
  }

  const topicEl = document.getElementById("qTopicDisplay");
  if (topicEl) {
    topicEl.textContent = q.topic ? `Topic: ${q.topic}` : SUBJECT_CATALOG[currentSub].title;
  }

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
      <div style="font-size: 0.85rem; color: #475569; margin-bottom: 0.4rem;">
        <strong>Exam Source:</strong> ${q.exam || 'JAMB'} ${q.year || ''} &bull; <strong>Syllabus Topic:</strong> ${q.topic || 'General'}
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
  if (!CBT.userAnswers[currentSub]) CBT.userAnswers[currentSub] = {};
  
  CBT.userAnswers[currentSub][CBT.currentQIndex] = letter;

  renderCurrentQuestion();
  updatePaletteStatus();
}

function toggleFlag() {
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];
  if (!CBT.flaggedMap[currentSub]) CBT.flaggedMap[currentSub] = {};

  const currentFlag = CBT.flaggedMap[currentSub][CBT.currentQIndex];
  CBT.flaggedMap[currentSub][CBT.currentQIndex] = !currentFlag;

  renderCurrentQuestion();
  updatePaletteStatus();
}

function nextQuestion() {
  const questions = getCurrentQuestions();
  if (CBT.currentQIndex < questions.length - 1) {
    CBT.currentQIndex++;
    renderCurrentQuestion();
    renderPalette();
  } else if (CBT.currentSubIndex < CBT.selectedSubjects.length - 1) {
    CBT.currentSubIndex++;
    CBT.currentQIndex = 0;
    renderExamHeader();
    renderCurrentQuestion();
    renderPalette();
  } else {
    promptSubmitExam();
  }
}

function prevQuestion() {
  if (CBT.currentQIndex > 0) {
    CBT.currentQIndex--;
    renderCurrentQuestion();
    renderPalette();
  } else if (CBT.currentSubIndex > 0) {
    CBT.currentSubIndex--;
    const prevQuestions = getCurrentQuestions();
    CBT.currentQIndex = prevQuestions.length - 1;
    renderExamHeader();
    renderCurrentQuestion();
    renderPalette();
  }
}

/* -------------------------------------------------------------
   Question Palette (Grid Navigation)
   ------------------------------------------------------------- */
function renderPalette() {
  const grid = document.getElementById("questionPaletteGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const questions = getCurrentQuestions();
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];

  questions.forEach((q, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cbt-pal-btn";
    btn.textContent = idx + 1;
    btn.dataset.idx = idx;

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
  const questions = getCurrentQuestions();
  const currentSub = CBT.selectedSubjects[CBT.currentSubIndex];
  const buttons = document.querySelectorAll(".cbt-pal-btn");

  let answeredCount = 0;
  let flaggedCount = 0;

  buttons.forEach((btn, idx) => {
    btn.className = "cbt-pal-btn";

    const isCurrent = idx === CBT.currentQIndex;
    const hasAnswer = CBT.userAnswers[currentSub]?.[idx] !== undefined;
    const isFlagged = CBT.flaggedMap[currentSub]?.[idx] === true;

    if (isCurrent) btn.classList.add("current");
    if (isFlagged) {
      btn.classList.add("flagged");
      flaggedCount++;
    } else if (hasAnswer) {
      btn.classList.add("answered");
      answeredCount++;
    }

    if (hasAnswer && !isFlagged) answeredCount++;
  });

  // Unique answered count across current subject
  const currentSubAnswered = Object.keys(CBT.userAnswers[currentSub] || {}).length;
  const currentSubFlagged = Object.values(CBT.flaggedMap[currentSub] || {}).filter(Boolean).length;
  const currentSubRemaining = questions.length - currentSubAnswered;

  const countBadge = document.getElementById("paletteAnsweredCount");
  if (countBadge) {
    countBadge.textContent = `${currentSubAnswered} Answered / ${currentSubRemaining} Left`;
  }
}

/* -------------------------------------------------------------
   Exam Timer Management
   ------------------------------------------------------------- */
function startTimer() {
  clearInterval(CBT.timerInterval);
  updateTimerDisplay();

  CBT.timerInterval = setInterval(() => {
    CBT.timerSeconds--;
    updateTimerDisplay();

    if (CBT.timerSeconds <= 0) {
      clearInterval(CBT.timerInterval);
      alert("Time is up! Your examination will now be automatically submitted.");
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerBadge = document.getElementById("examTimerDisplay");
  if (!timerBadge) return;

  if (CBT.timerSeconds <= 5 * 60) {
    timerBadge.classList.add("danger");
    timerBadge.classList.remove("warning");
  } else if (CBT.timerSeconds <= 10 * 60) {
    timerBadge.classList.add("warning");
    timerBadge.classList.remove("danger");
  } else {
    timerBadge.classList.remove("warning", "danger");
  }

  const m = Math.floor(CBT.timerSeconds / 60);
  const s = CBT.timerSeconds % 60;
  timerBadge.textContent = `⏱ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* -------------------------------------------------------------
   8-Key Navigation Listener (A, B, C, D, P, N, S, R)
   ------------------------------------------------------------- */
function init8KeyNavigation() {
  window.addEventListener("keydown", (e) => {
    const examScreen = document.getElementById("cbtExamScreen");
    if (!examScreen || examScreen.style.display !== "block") return;

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
  const topicStats = {}; // { "Topic Name": { total: X, correct: Y } }
  const yearStats = {};  // { "2024": { total: X, correct: Y } }

  CBT.selectedSubjects.forEach(sub => {
    const qs = CBT.questionsData[sub] || [];
    let correct = 0;
    qs.forEach((q, idx) => {
      const userChoice = CBT.userAnswers[sub]?.[idx];
      const isCorrect = userChoice === q.answer;
      if (isCorrect) correct++;

      // Track Topic Stats
      const topic = q.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;

      // Track Year Stats
      const yr = q.year || "Syllabus";
      if (!yearStats[yr]) yearStats[yr] = { total: 0, correct: 0 };
      yearStats[yr].total++;
      if (isCorrect) yearStats[yr].correct++;
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

  // Topic and Year Analysis Breakdown
  const topicBreakdownContainer = document.getElementById("resTopicBreakdown");
  if (topicBreakdownContainer) {
    topicBreakdownContainer.innerHTML = "";
    
    // Sort topics by name
    Object.entries(topicStats).forEach(([top, st]) => {
      const pct = Math.round((st.correct / st.total) * 100);
      const item = document.createElement("div");
      item.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.65rem 0.85rem;";
      item.innerHTML = `
        <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-bottom: 0.25rem;">${top}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
          <span style="color: ${pct >= 70 ? '#059669' : (pct >= 50 ? '#d97706' : '#dc2626')}; font-weight: 800;">
            ${st.correct} / ${st.total} correct (${pct}%)
          </span>
        </div>
      `;
      topicBreakdownContainer.appendChild(item);
    });
  }
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
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="badge" style="background: #fef3c7; color: #92400e; font-weight: 700;">${q.year ? `Year ${q.year}` : 'Past Exam'}</span>
            <span class="badge" style="background: var(--cbt-primary-light); color: var(--cbt-primary); font-weight: 700;">${q.exam || 'JAMB'}</span>
            <span class="badge" style="background: #f1f5f9; color: #475569; font-weight: 600;">${q.topic || 'General'}</span>
          </div>
          <span style="font-weight: 700; color: ${isCorrect ? '#059669' : '#dc2626'}; margin-left: auto;">
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
  const screen = document.getElementById("calcScreen");
  if (!screen) return;

  if (val === "C") {
    calcBuffer = "0";
  } else if (val === "=") {
    try {
      // Safe sanitized eval for numbers and basic arithmetic operators
      const sanitized = calcBuffer.replace(/[^0-9+\-*/.]/g, "");
      const res = Function(`'use strict'; return (${sanitized})`)();
      calcBuffer = String(Math.round(res * 10000) / 10000);
    } catch (e) {
      calcBuffer = "Error";
    }
  } else if (val === "sqrt") {
    try {
      const n = parseFloat(calcBuffer);
      calcBuffer = (n >= 0) ? String(Math.round(Math.sqrt(n) * 10000) / 10000) : "Error";
    } catch (e) {
      calcBuffer = "Error";
    }
  } else {
    if (calcBuffer === "0" || calcBuffer === "Error") {
      calcBuffer = val;
    } else {
      calcBuffer += val;
    }
  }

  screen.textContent = calcBuffer;
}
