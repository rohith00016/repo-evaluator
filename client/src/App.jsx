import GitHubForm from "./components/GithubForm";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GitHub Repository Evaluator</h1>
      </header>
      <main>
        <GitHubForm />
      </main>
    </div>
  );
}

export default App;
