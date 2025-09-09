import { useState } from 'react';
import Navbar from './components/Navbar';
import Step from './components/Step';
import Loader from './components/Loader';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [question, setQuestion] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // This function will recursively find and parse strings that are valid JSON.
  const recursivelyParseJson = (data) => {
    // If it's a string, try to parse it.
    if (typeof data === 'string') {
      try {
        // Attempt to parse the string as JSON.
        const parsed = JSON.parse(data);
        // If parsing is successful, recursively call the function on the parsed data.
        // This handles cases where JSON is nested within strings.
        return recursivelyParseJson(parsed);
      } catch (error) {
        // If parsing fails, it's just a regular string.
        // We will clean it up but not parse it.
        return data.trim();
      }
    }

    // If it's an array, map over its elements and apply the parsing to each one.
    if (Array.isArray(data)) {
      return data.map(item => recursivelyParseJson(item));
    }

    // If it's an object, recursively apply the parsing to each of its values.
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = recursivelyParseJson(data[key]);
        return acc;
      }, {});
    }

    // For any other data type (number, boolean, null), return it as is.
    return data;
  };


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      setFileName(file.name);
      setParsedData(null);
      setQuestion(null);
      setResponse(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setTimeout(() => {
          try {
            // 1. Initial parse of the file content.
            const initialData = JSON.parse(e.target.result);
            
            // 2. Use the robust recursive parser to handle all nested JSON strings.
            const processedData = recursivelyParseJson(initialData);

            setParsedData(processedData);
            setQuestion(processedData.question || null);
            setResponse(processedData.response_to_user || null);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Invalid JSON file. Please ensure it is a valid JSON file and try again.");
          }
          setLoading(false);
        }, 2000);
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    if (parsedData) {
      const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parsed_${fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setFileName('');
    setQuestion(null);
    setResponse(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
  };

  return (
    <div>
      <Navbar />
      {loading && <Loader />}
      <div className="container">
        <h1>JSON Parser</h1>
        <div className="card">
          {!parsedData ? (
            <div className="file-inputs">
              <div className="file-input-container">
                <input type="file" id="fileInput" onChange={handleFileChange} />
                <label htmlFor="fileInput" className="file-label">
                  {'Upload JSON'}
                </label>
              </div>
            </div>
          ) : (
            <div className="button-container">
              <button onClick={handleDownload}>Download Parsed JSON</button>
              <button onClick={handleReset} className="secondary-button">Parse Another File</button>
            </div>
          )}
        </div>
        <div className="main-content">
          {question && (
            <div className="question-container">
              <h2>Question</h2>
              <pre className="question-content">{typeof question === 'object' ? JSON.stringify(question, null, 2) : question}</pre>
            </div>
          )}
          {parsedData && parsedData.steps && (
            <div className="results">
              <h2>Parsed Steps</h2>
              {Array.isArray(parsedData.steps) ? (
                parsedData.steps.map((step, index) => (
                  <Step key={index} step={step} index={index} />
                ))
              ) : (
                <p>No steps found or steps are not in an array format.</p>
              )}
            </div>
          )}
          {response && (
            <div className="response-container">
              <h2>Final Response</h2>
              <pre className="response-content">{typeof response === 'object' ? JSON.stringify(response, null, 2) : response}</pre>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
