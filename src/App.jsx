import { useState } from "react"
import { sampleQuestions } from "./sampleQuestions";

function App() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const currentQuestion = sampleQuestions[questionIndex];
  const [feedback, setFeedback] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    const normalizedAnswer = answer.toLowerCase().trim();

    const isCorrect = currentQuestion.answers.includes(normalizedAnswer);

    if (isCorrect) {
      setScore((prev) => prev + 4);

      setFeedback("Correct!");
    }
    else {
      setFeedback("Incorrect.");
    }

    setShowAnswer(true);
    setAnswer("");

    setTimeout(() => {
      setFeedback("");
      setShowAnswer(false);
      setQuestionIndex((prev) => prev + 1);
    }, 1200);
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
        Question {questionIndex + 1} of{" "} {sampleQuestions.length}
      </p>

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