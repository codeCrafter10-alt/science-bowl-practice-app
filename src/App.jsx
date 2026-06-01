import { useState, useEffect } from "react"
import { sampleQuestions } from "./sampleQuestions";

function App() {
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [currentQuestionId  , setCurrentQuestionId] = useState(sampleQuestions[0].id)
  const currentQuestion = sampleQuestions.find((question) => question.id === currentQuestionId);
  const [feedback, setFeedback] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [phase, setPhase] = useState("reading");
  const [answerTimeLeft, setAnswerTimeLeft] = useState(3);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    resetTimers();
  }, [currentQuestionId]);

  useEffect(() => {
    if (phase !== "reading" || timeLeft <= 0 || !currentQuestion) {
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev-1);
    }, 1000)

    return () => clearTimeout(timer);
  }, [timeLeft, currentQuestion, phase])

  useEffect(() => {
    if (timeLeft > 0 || phase !== "reading" || !currentQuestion) {
      return;
    }

    setFeedback("Time's up.");
    setShowAnswer(true);
    setLastAnswerCorrect(false);
    setAnswer("");
    setPhase("feedback");
  }, [timeLeft, phase, currentQuestion]);

  useEffect(() => {
    if (phase !== "buzzed" || answerTimeLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setAnswerTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [answerTimeLeft, phase]);

  useEffect(() => {
    if (phase !== "buzzed" || answerTimeLeft > 0) {
      return;
    }

    setFeedback("Time's up.");
    setPhase("feedback");
    setShowAnswer(true);
    setLastAnswerCorrect(false);
    setAnswer("");
  }, [answerTimeLeft, phase]);

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
  }, [phase, currentQuestion, lastAnswerCorrect, isProcessing]);

  function resetTimers(question = currentQuestion) {
    if (!question) return;

    setTimeLeft(question.questionType === "tossup" ? 5 : 20);
    setAnswerTimeLeft(3);
  }

  function handleBuzz() {
    if (phase !== "reading" || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setPhase("buzzed");
    setAnswerTimeLeft(3);
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

    if (isCorrect) {
      setLastAnswerCorrect(isCorrect);
      if (currentQuestion.questionType === "tossup") {
        setScore((prev) => prev + 4);
      } else {
        setScore((prev) => prev + 10);
      }
      
      setFeedback("Correct!");
    }
    else {
      setFeedback("Incorrect");
    }

    setPhase("feedback");
    setShowAnswer(true);
    setAnswer("");
    setIsProcessing(false);
  }

  function goToNextQuestion(amount) {
    const currentIndex = sampleQuestions.findIndex(
      (question) => question.id === currentQuestionId
    );

    const nextQuestion = sampleQuestions[currentIndex + amount];

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

    setIsProcessing(true);
    setFeedback("");
    setShowAnswer(false);
    setAnswer("");
    setPhase("reading");

    resetTimers();

    if (currentQuestion.questionType === "tossup" && lastAnswerCorrect && currentQuestion.linkedBonusId) {
      setCurrentQuestionId(currentQuestion.linkedBonusId);
    } else if (currentQuestion.questionType === "bonus") {
      goToNextQuestion(1);
    } else {
      goToNextQuestion(2);
    }
    
    setIsProcessing(false);
  }

  function handleSkipQuestion() {
    if (phase !== "reading" || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setFeedback("");
    setShowAnswer(false);
    setAnswer("");
    setPhase("reading");
    setLastAnswerCorrect(false);

    resetTimers();

    if (currentQuestion.questionType === "tossup") {
      goToNextQuestion(2);
    } else {
      goToNextQuestion(1);
    }
    
    setIsProcessing(false);
  }

  if (!currentQuestion) {
    return(
     <main>
        <h1>End of Set</h1>

        <p>
          Final Score: {score}
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Science Bowl App</h1>

      <p>
        Score: {score}
      </p>

      <p>
        Question {sampleQuestions.findIndex((question) => question.id === currentQuestionId) + 1} of {" "} {sampleQuestions.length}
      </p>
      <h3 className="timer">Time Left: {timeLeft}</h3>

      <p className="division">
        {currentQuestion.division.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
      </p>
      <p className="question-data">
        {currentQuestion.topic} • {" "}
        {currentQuestion.questionType.charAt(0).toUpperCase() + currentQuestion.questionType.slice(1)}
      </p>

      <h2>
        {currentQuestion.question}
      </h2>

      {feedback && (
        <div>
          <p>{feedback}</p>

          {!feedback.includes("Correct") && (
            <p>
              Correct answer:{" "}
              {currentQuestion.answers[0]}
            </p>
          )}
        </div>
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
        <button className = "button-primary" onClick={handleNextQuestion}>
          Next Question
        </button>
      )}
    </main>
  );
}

export default App;