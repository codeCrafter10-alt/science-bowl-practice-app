import { useState, useEffect, useRef } from "react"
import { useSpeech } from "./useSpeech";
import highSchoolQuestions from "./highSchoolQuestions.json"
import middleSchoolQuestions from "./middleSchoolQuestions.json"
import { Analytics } from "@vercel/analytics/react"

function shuffleQuestionSets(questions) {
  const groups = [];

  for (let i = 0; i < questions.length; i += 2) {
    const pair = [questions[i]];
    if (questions[i + 1]) {
      pair.push(questions[i + 1]);
    }
    groups.push(pair);
  }

  for (let i = groups.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1)
    );

    [groups[i], groups[randomIndex]] = [
      groups[randomIndex],
      groups[i],
    ];
  }

  return groups.flat();
}

function App() {
  const allQuestions = [
    ...highSchoolQuestions.map(q => ({ 
      ...q, 
      id: `hs-${q.id}`, 
      linkedBonusId: q.linkedBonusId ? `hs-${q.linkedBonusId}` : null 
    })),
    ...middleSchoolQuestions.map(q => ({ 
      ...q, 
      id: `ms-${q.id}`, 
      linkedBonusId: q.linkedBonusId ? `ms-${q.linkedBonusId}` : null 
    }))
  ];
  const [activeQuestions, setActiveQuestions] = useState(allQuestions);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [currentQuestionId  , setCurrentQuestionId] = useState(activeQuestions[0].id)
  const currentQuestion = activeQuestions.find((question) => question.id === currentQuestionId);
  const [feedback, setFeedback] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [phase, setPhase] = useState("reading");
  const [answerTimeLeft, setAnswerTimeLeft] = useState(4);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingQuestion, setIsRenderingQuestion] = useState(true);
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const [buzzedEarly, setBuzzedEarly] = useState(false);
  const {speak, stop, isMuted, toggleMute} = useSpeech();
  const renderIntervalRef = useRef(null);
  const startDelayRef = useRef(null);
  const [canOverrideAnswer, setCanOverrideAnswer] = useState(false);
  const progress = ((activeQuestions.findIndex((question) => question.id === currentQuestionId) + 1) / activeQuestions.length) * 100;

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  const [correctInterruptions, setCorrectInterruptions] = useState(0);
  const [tossupAttempted, setTossupAttempted] = useState(0);
  const [tossupCorrect, setTossupCorrect] = useState(0);
  const [bonusAttempted, setBonusAttempted] = useState(0);
  const [bonusCorrect, setBonusCorrect] = useState(0);
  const [subjectStats, setSubjectStats] = useState({});
  const [timeoutCount, setTimeoutCount] = useState(0);

  const [questionHistory, setQuestionHistory] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);

  const [screen, setScreen] = useState("dashboard");
  const [selectedDivision, setSelectedDivision] = useState("high-school");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questionCount, setQuestionCount] = useState();

  function playSound(soundFile) {
    const audio = new Audio(`/sounds/${soundFile}`);
    audio.play().catch(() => {});
  }

  function toggleTopic(topic) {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics((prev) =>
        prev.filter((t) => t !== topic)
      );
    } else {
      setSelectedTopics((prev) => [
        ...prev,
        topic,
      ]);
    }
  }

  function startPractice() {
    let filteredQuestions = [...allQuestions];

    if (selectedDivision !== "both") {
      filteredQuestions = filteredQuestions.filter(
        (question) =>
          question.division === selectedDivision
      );
    }

    if (selectedTopics.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        (question) =>
          selectedTopics.includes(question.topic)
      );
    }

    filteredQuestions = shuffleQuestionSets(filteredQuestions);

    filteredQuestions = filteredQuestions.slice(
      0,
      Number(questionCount)
    );

    const hasNoCount = !questionCount;
    const hasNoTopics = !selectedTopics || selectedTopics.length === 0;

    if (hasNoCount || hasNoTopics) {
      alert("No questions match your filters! Please select at least one topic and a question count.");
      return; 
    }

    if (filteredQuestions.length === 0) {
      alert("No questions match your filters.");
      return;
    }

    setActiveQuestions(filteredQuestions);

    setCurrentQuestionId(
      filteredQuestions[0].id
    );

    setScreen("game");
  }

  const displayQuestionText = currentQuestion?.type === "multiple-choice" ? `${currentQuestion.question}

    W: ${currentQuestion.choices.W}
    X: ${currentQuestion.choices.X}
    Y: ${currentQuestion.choices.Y}
    Z: ${currentQuestion.choices.Z}`
        : currentQuestion?.question ?? "";

  const speechQuestionText =
    currentQuestion?.type === "multiple-choice" ? `${currentQuestion.question}

    W, ${currentQuestion.choices.W} X, ${currentQuestion.choices.X} Y, ${currentQuestion.choices.Y} Z, ${currentQuestion.choices.Z}` : currentQuestion?.question ?? "";

  useEffect(() => {
    resetTimers();
  }, [currentQuestionId]);

  function stopQuestionRendering() {
    clearTimeout(startDelayRef.current);
    clearInterval(renderIntervalRef.current);

    startDelayRef.current = null;
    renderIntervalRef.current = null;

    setIsRenderingQuestion(false);
  }

  useEffect(() => {
    if (!currentQuestion || phase !== "reading" || screen !== "game") return;

    setIsRenderingQuestion(true);
    setDisplayedQuestion("");

    speak(speechQuestionText);

    let charIndex = 0;
    const fullText = displayQuestionText;

    startDelayRef.current = setTimeout(() => {
      renderIntervalRef.current = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayedQuestion(fullText.substring(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(renderIntervalRef.current);
          renderIntervalRef.current = null;
          setIsRenderingQuestion(false);
        }
      }, 60);
    }, 1000);

    return () => {
      clearTimeout(startDelayRef.current);
      clearInterval(renderIntervalRef.current);
      stop();
    };
  }, [currentQuestion, phase]);

  useEffect(() => {
    if (phase !== "reading") {
      stop();
    }
  }, [phase, stop]);

  useEffect(() => {
  if (screen !== "game" || isRenderingQuestion) return;

  const timer = setInterval(() => {
    if (phase === "reading" && timeLeft > 0) {
      setTimeLeft((prev) => prev - 1);
    } else if (phase === "buzzed" && answerTimeLeft > 0) {
      setAnswerTimeLeft((prev) => prev - 1);
    }
  }, 1000);

  return () => clearInterval(timer);
}, [phase, timeLeft, answerTimeLeft, screen, isRenderingQuestion]);

useEffect(() => {
  if (screen !== "game") return;

  if (phase === "reading" && timeLeft === 0 && !isRenderingQuestion && currentQuestion) {
    recordQuestionResult("timeout");
    setTimeoutCount((prev) => prev + 1);
    setFeedback("Time's up.");
    setShowAnswer(true);
    setLastAnswerCorrect(false);
    setAnswer("");
    setPhase("feedback");
  }

  if (phase === "buzzed" && answerTimeLeft === 0) {
    recordQuestionResult("timeout");
    setTimeoutCount((prev) => prev + 1);
    setFeedback("Time's up.");
    setShowAnswer(true);
    setLastAnswerCorrect(false);
    setAnswer("");
    setPhase("feedback");
  }
}, [timeLeft, answerTimeLeft, phase, isRenderingQuestion, currentQuestion, screen]);

  useEffect(() => {
    function handleKeyPress(e) {
      if (isProcessing) return;
      
      if (e.key === "Enter" && phase === "feedback") {
        handleNextQuestion();
      } else if (e.code === "Space" && phase === "reading") {
        e.preventDefault();
        handleBuzz();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [phase, currentQuestion, lastAnswerCorrect, isProcessing, isRenderingQuestion]);

  function recordQuestionResult(result, userAnswer = "") {
    setQuestionHistory((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        topic: currentQuestion.topic,
        questionType: currentQuestion.questionType, result, userAnswer,
        correctAnswer:
          currentQuestion.type === "multiple-choice"
            ? currentQuestion.answers[1]
            : currentQuestion.answers[0],

        interrupted: buzzedEarly,
      },
    ]);
  }

  function recordSubjectAttempt(topic, questionType, isCorrect) {
    setSubjectStats((prev) => {
      const current = prev[topic] || {
        tossupAttempted: 0,
        tossupCorrect: 0,
        bonusAttempted: 0,
        bonusCorrect: 0,
      };

      const updated = { ...current };

      if (questionType === "tossup") {
        updated.tossupAttempted += 1;

        if (isCorrect) {
          updated.tossupCorrect += 1;
        }
      } else {
        updated.bonusAttempted += 1;

        if (isCorrect) {
          updated.bonusCorrect += 1;
        }
      }

      return {
        ...prev,
        [topic]: updated,
      };
    });
  }

  function resetTimers(question = currentQuestion) {
    if (!question) return;

    setTimeLeft(question.questionType === "tossup" ? 5 : 20);
    setAnswerTimeLeft(4);
  }

  function handleBuzz() {
    if (phase !== "reading" || isProcessing) {
      return;
    }

    playSound("buzzer.mp3");
    stop();
    setIsProcessing(true);

    if (isRenderingQuestion) {
      stopQuestionRendering();
      setBuzzedEarly(true);
      setInterruptions((prev) => prev+1);
    }

    setPhase("buzzed");
    setAnswerTimeLeft(4);
    setIsProcessing(false);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (phase !== "buzzed" || isProcessing) {
      return;
    }

    setIsProcessing(true);
    const normalizedAnswer = answer.toLowerCase().trim();

    const isCorrect = currentQuestion.answers.includes(normalizedAnswer);

    recordSubjectAttempt(
      currentQuestion.topic,
      currentQuestion.questionType,
      isCorrect
    );

    if (currentQuestion.questionType === "tossup") {
      setTossupAttempted((prev) => prev + 1);
    } else {
      setBonusAttempted((prev) => prev + 1);
    }

    if (isCorrect) {
      recordQuestionResult(
        "correct",
        answer
      );
      setCanOverrideAnswer(false);
      setLastAnswerCorrect(isCorrect);
      if (currentQuestion.questionType === "tossup") {
        setScore((prev) => prev + 4);
      } else {
        setScore((prev) => prev + 10);
      }
      
      setFeedback("Correct!");

      setCorrectCount((prev) => prev + 1);
      if (currentQuestion.questionType === "tossup") {
        setTossupCorrect((prev) => prev + 1);
      } else {
        setBonusCorrect((prev) => prev + 1);
      }

      if (buzzedEarly) {
        setCorrectInterruptions((prev) => prev + 1);
      }
    }
    else {
      recordQuestionResult(
        "incorrect",
        answer
      );
      setCanOverrideAnswer(true);

      if (buzzedEarly && currentQuestion.questionType === "tossup") {
        setScore((prev) => prev - 4);
        setFeedback("Incorrect. Penalty of 4 points applied");
      } else {
        setFeedback("Incorrect");
      }
      setIncorrectCount((prev) => prev + 1);
    }

    setPhase("feedback");
    setShowAnswer(true);
    setAnswer("");
    setIsProcessing(false);
  }

  function goToNextQuestion(amount) {
    const currentIndex = activeQuestions.findIndex(
      (question) => question.id === currentQuestionId
    );

    const nextQuestion = activeQuestions[currentIndex + amount];

    if (nextQuestion) {
      setCurrentQuestionId(nextQuestion.id);
    } else {
      setCurrentQuestionId(null);
    }
  }

  function handleNextQuestion() {
    if (phase !== "feedback" || isProcessing) {
      return;
    }

    setCanOverrideAnswer(false);
    stopQuestionRendering();
    setIsProcessing(true);
    setFeedback("");
    setShowAnswer(false);
    setAnswer("");
    setPhase("reading");
    setBuzzedEarly(false);

    resetTimers();

    if (currentQuestion.questionType === "tossup" && lastAnswerCorrect && currentQuestion.linkedBonusId) {
      setCurrentQuestionId(currentQuestion.linkedBonusId);
    } else if (currentQuestion.questionType === "tossup") {
      goToNextQuestion(2);
    } else if (currentQuestion.questionType === "bonus") {
      goToNextQuestion(1);
    }
    
    setIsProcessing(false);
  }

  function handleSkipQuestion() {
    if (phase !== "reading" || isProcessing) {
      return;
    }

    setSkippedCount((prev) => prev + 1);
    setCanOverrideAnswer(false);
    stopQuestionRendering();
    stop();
    setIsProcessing(true);
    setFeedback("");
    setShowAnswer(false);
    setAnswer("");
    setPhase("reading");
    setLastAnswerCorrect(false);
    setBuzzedEarly(false);

    resetTimers();

    if (currentQuestion.questionType === "tossup") {
      goToNextQuestion(2);
    } else {
      goToNextQuestion(1);
    }
    
    setIsProcessing(false);
  }

  function handleOverrideAnswer() {
    if (!canOverrideAnswer || isProcessing) {
      return;
    }

    setCanOverrideAnswer(false);
    setLastAnswerCorrect(true);

    if (buzzedEarly && currentQuestion.questionType === "tossup") {
      setScore((prev) => prev + 8);
    } else if (currentQuestion.questionType === "tossup") {
      setScore((prev) => prev + 4);
    } else {
      setScore((prev) => prev + 10);
    }

    setFeedback("Answer overridden.");
  }

  function handleSearchQuestion() {
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(
        currentQuestion.question
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const totalAttempts =
    correctCount +
    incorrectCount +
    timeoutCount;

  const accuracy =
    totalAttempts > 0
      ? (correctCount / totalAttempts) * 100
      : 0;

  const interruptionAccuracy =
    interruptions > 0
      ? (correctInterruptions / interruptions) * 100
      : 0;

  const tossupAccuracy =
    tossupAttempted > 0
      ? (tossupCorrect / tossupAttempted) * 100
      : 0;

  const bonusAccuracy =
    bonusAttempted > 0
      ? (bonusCorrect / bonusAttempted) * 100
      : 0;


  const handleDivisionChange = (newDivision) => {
    setSelectedDivision(newDivision);
    
    const baseTopics = ["Chemistry", "Math", "Earth And Space", "Energy"];
    let validTopics = [];
    if (newDivision === "high-school") validTopics = ["Biology", "Physics", ...baseTopics];
    else if (newDivision === "middle-school") validTopics = ["Life Science", "Physical Science", ...baseTopics];
    else validTopics = ["Biology", "Life Science", "Chemistry", "Physics", "Physical Science", "Math", "Earth And Space", "Energy"];

    setSelectedTopics((prevSelected) => 
      prevSelected.filter(topic => validTopics.includes(topic))
    );
  };

  
  const getVisibleTopics = () => {
    const baseTopics = ["Math", "Earth And Space", "Energy"];
    
    if (selectedDivision === "high-school") {
      return ["Biology", "Physics", "Chemistry", ...baseTopics];
    }
    if (selectedDivision === "middle-school") {
      return ["Life Science", "Physical Science", ...baseTopics];
    }
    
    return ["Biology", "Life Science", "Chemistry", "Physics", "Physical Science", "Math", "Earth And Space", "Energy"];
  };

  const visibleTopics = getVisibleTopics();

  if (screen === "dashboard") {
    return (
      <main className="dashboard">
        <h1>Science Bowl Practice</h1>

        <h2>Division</h2>

        <div className="selection-grid">
          {[
            "high-school",
            "middle-school",
            "both"
          ].map((division) => (
            <button
              key={division}
              type="button"
              className={
                selectedDivision === division
                  ? "selection-button selected"
                  : "selection-button"
              }
              onClick={() =>
                handleDivisionChange(division)
              }
            >
              {division
                .split("-")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
                )
                .join(" ")}
            </button>
          ))}
        </div>

        <h2>Topics</h2>

        <div className="selection-grid">
          {visibleTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              className={
                selectedTopics.includes(topic)
                  ? "selection-button selected"
                  : "selection-button"
              }
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>

        <h2>Question Count</h2>

        <div className="selection-grid">
          {["10", "20", "30", "40"].map(
            (count) => (
              <button
                key={count}
                type="button"
                className={
                  questionCount === count
                    ? "selection-button selected"
                    : "selection-button"
                }
                onClick={() =>
                  setQuestionCount(count)
                }
              >
                {count === "all"
                  ? "All"
                  : count}
              </button>
            )
          )}
        </div>

        <br />
        <br />

        <button
          className="button-primary"
          onClick={startPractice}
        >
          Start Practice
        </button>
      </main>
    );
  }

  if (reviewMode) {
    const missedQuestions = questionHistory.filter(
      (question) =>
        question.result === "incorrect" ||
        question.result === "timeout"
    );

    return (
      <main>
        <h1>Review Missed Questions</h1>

        {missedQuestions.length === 0 ? (
          <p>No missed questions.</p>
        ) : (
          missedQuestions.map((question, index) => (
            <div
              key={index}
              className="review-card"
            >
              <p>
                <strong>
                  {question.topic}
                </strong>
              </p>

              <p>
                {question.question}
              </p>

              <p>
                Your Answer:
                {" "}
                {question.userAnswer || "None"}
              </p>

              <p>
                Correct Answer:
                {" "}
                {question.correctAnswer}
              </p>

              <button
                className="search-button"
                onClick={() =>
                  window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(
                      question.question
                    )}`,
                    "_blank"
                  )
                }
              >
                Search Question
              </button>
            </div>
          ))
        )}
        <div>
          <button
            className="button-secondary"
            onClick={() => setReviewMode(false)}
            style={{ float: "none"}}
          >
            Back
          </button>
        </div>
      </main>
    );
  }
  
  if (!currentQuestion) {
    return (
      <main>
        <h1>End of Set</h1>

        <h2>Final Score: {score}</h2>

        <button
          className="button-primary"
          onClick={() => setReviewMode(true)}
          style={{ width: "230px", fontSize: "16px", marginBottom: "20px"}}
        >
          Review Missed Questions
        </button>

        <h3 className="stat-title">Overall Statistics</h3>

        <h4>Correct: {correctCount}</h4>
        <h4>Incorrect: {incorrectCount}</h4>
        <h4>Skipped: {skippedCount}</h4>

        <h4>
          Accuracy: {correctCount}/{totalAttempts}
          {" "}
          ({accuracy.toFixed(1)}%)
        </h4>

        <h4>
          Interruptions: {interruptions}
        </h4>

        <h4>
          Interruption Accuracy:
          {" "}
          {correctInterruptions}/{interruptions}
          {" "}
          ({interruptionAccuracy.toFixed(1)}%)
        </h4>

        <h4>
          Tossup Accuracy:
          {" "}
          {tossupCorrect}/{tossupAttempted}
          {" "}
          ({tossupAccuracy.toFixed(1)}%)
        </h4>

        <h4>
          Bonus Accuracy:
          {" "}
          {bonusCorrect}/{bonusAttempted}
          {" "}
          ({bonusAccuracy.toFixed(1)}%)
        </h4>

        <h3>Performance by Topic</h3>

        <table className="stats-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Tossups</th>
              <th>Bonuses</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(subjectStats).map(
              ([topic, stats]) => (
                <tr key={topic}>
                  <td>{topic}</td>

                  <td>
                    {stats.tossupCorrect}/
                    {stats.tossupAttempted}
                  </td>

                  <td>
                    {stats.bonusCorrect}/
                    {stats.bonusAttempted}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <button
          className="button-primary"
          onClick={() => {
            setScreen("dashboard");
          }}
        >
          New Session
        </button>
      </main>
    );
  }

  return (
    <main>
      <button
        className="mute-button"
        onClick={toggleMute}
      >
        {isMuted ? "Sound Off" : "Sound On"}
      </button>

      <h1>Science Bowl App</h1>

      <p>
        Score: {score}
      </p>

      <p>
        Question {activeQuestions.findIndex((question) => question.id === currentQuestionId) + 1} of {" "} {activeQuestions.length}
      </p>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h3 className="timer">Time Left: {timeLeft}</h3>

      <p className="division">
        {currentQuestion.division.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
      </p>
      <p className="question-data">
        {currentQuestion.topic} • {" "}
        {currentQuestion.questionType.charAt(0).toUpperCase() +
          currentQuestion.questionType.slice(1)} {" • "}
        {currentQuestion.type === "multiple-choice" ? "Multiple Choice" : "Short Answer"}
      </p>

      <h2 className="question-text">
        {displayedQuestion}
        {buzzedEarly && (
          <span className="interrupt">
            {" "} [INTERRUPT]
          </span>
        )}
      </h2>

      {feedback && (
        <div>
          <p>{feedback}</p>

          {!feedback.includes("Correct") && (
            <p>
              Correct answer:{" "}
              {currentQuestion.type === "multiple-choice"
                ? `${currentQuestion.answers[0].toUpperCase()}: ${currentQuestion.answers[1]}`
                : currentQuestion.answers[0]}
            </p>
          )}
        </div>
      )}

      {canOverrideAnswer && (
        <button
          className="button-secondary"
          onClick={handleOverrideAnswer}
        >
          I Was Right
        </button>
      )}

      {phase === "reading" && (
        <div>
          <button className = "button-primary" onClick={handleBuzz}>
            Buzz
          </button>
          <button className = "button-secondary" onClick={handleSkipQuestion}>
            Skip Question
          </button>
        </div>
      )}

      {phase === "buzzed" && (
        <>
          <h3>
            Answer Time Left: {" "} {answerTimeLeft}
          </h3>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={answer}
              onChange={(e) =>
                setAnswer(e.target.value)
              }
              autoFocus
            />

            <button className = "button-primary" type="submit">
              Submit
            </button>
          </form>
        </>
      )}

     {phase === "feedback" && (
        <div className="feedback-actions">
          <button
            className="button-primary"
            onClick={handleNextQuestion}
          >
            Next Question
          </button>

          <button
            className="search-button"
            onClick={handleSearchQuestion}
          >
            Search Question
          </button>
        </div>
      )}
    </main>
  );
}

export default App;