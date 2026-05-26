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

  useEffect(() => {
    if (currentQuestion?.questionType === "tossup") {
      setTimeLeft(5);
    } else {
      setTimeLeft(20);
    }
  }, [currentQuestionId])

  useEffect(() => {
    if (timeLeft <= 0 || currentQuestionId === null) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev-1);
    }, 1000)

    return () => clearInterval(timer);
  }, [timeLeft, currentQuestionId])

  useEffect(() => {
  if (timeLeft > 0 || feedback === "Correct!") {
    return;
  }

  setFeedback("Time's up.");
  setShowAnswer(true);
  setAnswer("");

  const timeout = setTimeout(() => {
    setFeedback("");
    setShowAnswer(false);
    if (currentQuestion?.questionType === "bonus" || !currentQuestion?.linkedBonusId) {
      goToNextQuestion(1);
    } else {
      goToNextQuestion(2);
    }
  }, 5000);

  return () => clearTimeout(timeout);
}, [timeLeft]);

  function handleSubmit(e) {
    e.preventDefault();

    if (timeLeft <= 0) {
      return;
    }

    const normalizedAnswer = answer.toLowerCase().trim();

    const isCorrect = currentQuestion.answers.includes(normalizedAnswer);

    if (isCorrect) {
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

    setShowAnswer(true);
    setAnswer("");

    setTimeout(() => {
      setFeedback("");
      setShowAnswer(false);

      if (currentQuestion.questionType === "tossup" && isCorrect && currentQuestion.linkedBonusId) {
        setCurrentQuestionId(currentQuestion.linkedBonusId);
      } else if (currentQuestion.questionType === "bonus") {
        goToNextQuestion(1);
      } else {
        goToNextQuestion(2);
      }
    }, 1200);
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

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={answer}
          onChange={(e) =>
            setAnswer(e.target.value)
          }
          autoFocus
        />

        <button type="submit">
          Submit
        </button>
      </form>
    </main>
  );
}

export default App;