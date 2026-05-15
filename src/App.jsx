import { useState } from "react"
import { sampleQuestions } from "./sampleQuestions";

function App() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const currentQuestion = sampleQuestions[questionIndex];

  function handleSubmit(e) {
    e.preventDefault();

    const normalizedAnswer = answer.toLowerCase().trim();

    const isCorrect = currentQuestion.answers.includes(normalizedAnswer);

    if (isCorrect) {
      setScore((prev) => prev + 4);
    }

    setAnswer("");
    setQuestionIndex((prev) => prev + 1);
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

      <h2>
        {currentQuestion.question}
      </h2>

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