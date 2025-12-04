// exam.js
console.log("Exam script loaded");

// ===============================
// DOM references
// ===============================
const candidateIdInput = document.getElementById("candidateId");
const examStatus = document.getElementById("examStatus");
const debugInfo = document.getElementById("debugInfo");
const submitBtn = document.getElementById("submitExam");

const questionTitle = document.getElementById("questionTitle");
const questionText = document.getElementById("questionText");
const answerBox = document.getElementById("answerBox");
const questionIndicator = document.getElementById("questionIndicator");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const timerDisplay = document.getElementById("timerDisplay");

// ===============================
// Question data (you can add more questions here)
// ===============================
const questions = [
  {
    id: 1,
    title: "Question 1",
    text: "Explain the working of a refrigerator using the concept of heat transfer."
  },
  {
    id: 2,
    title: "Question 2",
    text: "Why is behavioral analytics better than webcam-based proctoring?"
  }
  // Add more questions here if needed
];

// Store answers in memory (index-based)
const answers = new Array(questions.length).fill("");

// Track current question index
let currentIndex = 0;

// ===============================
// Timer setup (CodeTantra-style)
// ===============================
// Total exam time in seconds (e.g., 30 minutes)
const EXAM_DURATION_SECONDS = 30 * 60;
let remainingSeconds = EXAM_DURATION_SECONDS;
let timerInterval = null;

function formatTime(sec) {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function startTimer() {
  // Prevent multiple intervals
  if (timerInterval !== null) return;

  timerDisplay.textContent = formatTime(remainingSeconds);

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      timerDisplay.textContent = formatTime(remainingSeconds);
      clearInterval(timerInterval);
      autoSubmitOnTimeout();
    } else {
      timerDisplay.textContent = formatTime(remainingSeconds);
    }
  }, 1000);
}

function autoSubmitOnTimeout() {
  debugInfo.textContent =
    "Time is up. Exam auto-submitted (demo behaviour).";
  submitExam(true);
}

// ===============================
// Question rendering + navigation
// ===============================
function renderQuestion() {
  const q = questions[currentIndex];
  questionTitle.textContent = q.title;
  questionText.textContent = q.text;

  // Load stored answer if any
  answerBox.value = answers[currentIndex];

  // Update indicator text
  questionIndicator.textContent = `Question ${currentIndex + 1} of ${
    questions.length
  }`;

  // Enable/disable Prev/Next like CodeTantra
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === questions.length - 1;
}

function saveCurrentAnswer() {
  answers[currentIndex] = answerBox.value;
}

// Navigation buttons
prevBtn.addEventListener("click", () => {
  saveCurrentAnswer();
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  saveCurrentAnswer();
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
});

// ===============================
// Submit
// ===============================
function submitExam(auto = false) {
  saveCurrentAnswer();

  const candidateId = candidateIdInput.value.trim();
  if (!candidateId) {
    alert("Please enter Candidate ID before submitting.");
    return;
  }

  // For now just log everything and show alert (frontend only)
  const payload = {
    candidateId,
    answers,
    autoSubmitted: auto,
    timeUsedSeconds: EXAM_DURATION_SECONDS - remainingSeconds
  };

  console.log("Exam submission payload:", payload);
  debugInfo.textContent =
    "Exam submitted. (Check console for payload in this demo.)";

  alert(auto ? "Time is up! Exam auto-submitted." : "Exam submitted successfully.");

  // Optionally disable UI after submit
  answerBox.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  submitBtn.disabled = true;
}

submitBtn.addEventListener("click", () => submitExam(false));

// ===============================
// Simple behaviour / monitoring demo
// ===============================

// Turn monitoring "active" when candidate ID is entered
candidateIdInput.addEventListener("input", () => {
  if (candidateIdInput.value.trim().length > 0) {
    examStatus.textContent = "Monitoring active";
  } else {
    examStatus.textContent = "Monitoring inactive";
  }
});

// Track basic interactions for demo (you can extend later)
let mouseMoves = 0;
let keyPresses = 0;

document.addEventListener("mousemove", () => {
  mouseMoves++;
  updateDebugText();
});

document.addEventListener("keydown", () => {
  keyPresses++;
  updateDebugText();
});

window.addEventListener("blur", () => {
  debugInfo.textContent = "Tab switched or window not in focus!";
});

window.addEventListener("focus", () => {
  updateDebugText();
});

function updateDebugText() {
  debugInfo.textContent = `Mouse moves: ${mouseMoves}, Key presses: ${keyPresses}`;
}

// ===============================
// Init
// ===============================
renderQuestion();
startTimer();
