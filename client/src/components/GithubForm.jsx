import { useState } from "react";

function GitHubForm() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate GitHub URL
    const urlPattern =
      /^(https:\/\/github\.com\/)([a-zA-Z0-9-]+\/[a-zA-Z0-9-_]+)(\.git)?$/;
    if (!urlPattern.test(url)) {
      setMessage("Please enter a valid GitHub repository URL.");
      return;
    }

    try {
      // Make a request to the backend for evaluation
      const response = await fetch(
        "https://repo-evaluator.vercel.app/evaluate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(
          `Evaluation complete: ${data.message}. Marks: ${data.marks}`
        );
      } else {
        setMessage("Evaluation failed. Please try again.");
      }
    } catch (error) {
      setMessage("Error: Unable to submit the URL.");
    }
  };

  return (
    <div className="github-form">
      <h2>Submit GitHub URL</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="github-url">GitHub Repository URL:</label>
        <input
          type="url"
          id="github-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          required
        />
        <button type="submit">Submit</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default GitHubForm;
