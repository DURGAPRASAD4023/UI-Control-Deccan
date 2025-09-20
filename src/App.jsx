import { useState } from 'react';
import JSZip from 'jszip';
import Navbar from './components/Navbar';
import Step from './components/Step';
import Loader from './components/Loader';
import Footer from './components/Footer';
import './App.css';


function App({ onLogout }) {
  const [parsedData, setParsedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [question, setQuestion] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState({});
  const [driveLink, setDriveLink] = useState("")

  const recursivelyParseJson = (data) => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return recursivelyParseJson(parsed);
      } catch (error) {
        return data.trim();
      }
    }
    if (Array.isArray(data)) {
      return data.map(item => recursivelyParseJson(item));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = recursivelyParseJson(data[key]);
        return acc;
      }, {});
    }
    return data;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      setParsedData(null);
      setQuestion(null);
      setResponse(null);
      setImages({});
      setFileName('');

      const reader = new FileReader();
      reader.onload = (e) => {
        JSZip.loadAsync(e.target.result).then(async (zip) => {
          const jsonFile = Object.values(zip.files).find(f => f.name.endsWith('.json'));
          const imageFiles = Object.values(zip.files).filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f.name));

          const imageMap = { before: {}, after: {} };
          for (const imageFile of imageFiles) {
            const name = imageFile.name.toLowerCase();
            const typeMatch = name.match(/before|after/);
            const numberMatch = name.match(/\d+(?!.*\d)/);

            if (typeMatch && numberMatch) {
                const type = typeMatch[0];
                const number = parseInt(numberMatch[0], 10);
                if(!imageMap[type][number]) {
                    const blob = await imageFile.async('blob');
                    imageMap[type][number] = {
                        url: URL.createObjectURL(blob),
                        name: imageFile.name,
                    };
                }
            }
          }

          if (jsonFile) {
            setFileName(jsonFile.name);
            const jsonContent = await jsonFile.async('string');
            setTimeout(() => {
              try {
                const initialData = JSON.parse(jsonContent);
                const processedData = recursivelyParseJson(initialData);
                const newImages = {};

                if (processedData.steps && Array.isArray(processedData.steps)) {
                  processedData.steps.forEach((step, index) => {
                    const stepImages = { before: [], after: [] };
                    let codeOutput = step.code_output;

                    if (codeOutput && typeof codeOutput === 'string') {
                      const rangeRegex = /(\d+)[_.-]?(before|after)[_.-]?image to (\d+)[_.-]?(before|after)[_.-]?image/gi;
                      let match;

                      let mutableCodeOutput = codeOutput;

                      while ((match = rangeRegex.exec(codeOutput)) !== null) {
                        const start = parseInt(match[1], 10);
                        const type1 = match[2].toLowerCase();
                        const end = parseInt(match[3], 10);
                        const type2 = match[4].toLowerCase();

                        if (type1 === type2) {
                          for (let i = start; i <= end; i++) {
                              const image = imageMap[type1][i];
                              if (image && !stepImages[type1].some(img => img.name === image.name)) {
                                  stepImages[type1].push(image);
                              }
                          }
                        }
                        mutableCodeOutput = mutableCodeOutput.replace(match[0], '');
                      }

                      const individualImageRegex = /(\d+)[_.-]?(before|after)[_.-]?image/gi;
                      while ((match = individualImageRegex.exec(mutableCodeOutput)) !== null) {
                          const number = parseInt(match[1], 10);
                          const type = match[2].toLowerCase();
                          
                          const image = imageMap[type][number];
                          if (image && !stepImages[type].some(img => img.name === image.name)) {
                              stepImages[type].push(image);
                          }
                      }
                    }

                    if (stepImages.before.length > 0 || stepImages.after.length > 0) {
                      stepImages.before.sort((a, b) => a.name.localeCompare(b.name));
                      stepImages.after.sort((a, b) => a.name.localeCompare(b.name));
                      newImages[index] = stepImages;
                    }
                  });
                }
                
                setImages(newImages);
                setParsedData(processedData);
                setQuestion(processedData.question || null);
                setResponse(processedData.response_to_user || null);
              } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Invalid JSON file. Please ensure it is a valid JSON file and try again.");
              }
              setLoading(false);
            }, 2000);
          } else {
            alert("No JSON file found in the selected zip archive.");
            setLoading(false);
          }
        });
      };
      reader.readAsArrayBuffer(file);
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
    setImages({});
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleDriveFiles = async (files) => {
    try {
      setLoading(true);
      setParsedData(null);
      setQuestion(null);
      setResponse(null);
      setImages({});
      setFileName("");
  
      const accessToken = localStorage.getItem("google_access_token");
      if (!accessToken) return alert("You must login first to access Drive");
  
      // Fetch blobs for all files
      const fileBlobs = await Promise.all(
        files.map(async (file) => {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) throw new Error(`Failed to fetch file ${file.name}`);
          const blob = await res.blob();
          return { name: file.name, blob };
        })
      );
  
      // Separate JSON and images
      const jsonFile = fileBlobs.find(f => f.name.endsWith(".json"));
      const imageFiles = fileBlobs.filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f.name));
  
      const imageMap = { before: {}, after: {} };
      for (const imageFile of imageFiles) {
        const name = imageFile.name.toLowerCase();
        const typeMatch = name.match(/before|after/);
        const numberMatch = name.match(/\d+(?!.*\d)/);
  
        if (typeMatch && numberMatch) {
          const type = typeMatch[0];
          const number = parseInt(numberMatch[0], 10);
          if (!imageMap[type][number]) {
            imageMap[type][number] = {
              url: URL.createObjectURL(imageFile.blob),
              name: imageFile.name,
            };
          }
        }
      }
  
      if (jsonFile) {
        setFileName(jsonFile.name);
        const jsonText = await jsonFile.blob.text();
        const initialData = JSON.parse(jsonText);
        const processedData = recursivelyParseJson(initialData);
        const newImages = {};
  
        if (processedData.steps && Array.isArray(processedData.steps)) {
          processedData.steps.forEach((step, index) => {
            const stepImages = { before: [], after: [] };
            let codeOutput = step.code_output;
  
            if (codeOutput && typeof codeOutput === 'string') {
              const rangeRegex = /(\d+)[_.-]?(before|after)[_.-]?image to (\d+)[_.-]?(before|after)[_.-]?image/gi;
              let match;
              let mutableCodeOutput = codeOutput;
  
              while ((match = rangeRegex.exec(codeOutput)) !== null) {
                const start = parseInt(match[1], 10);
                const type1 = match[2].toLowerCase();
                const end = parseInt(match[3], 10);
                const type2 = match[4].toLowerCase();
  
                if (type1 === type2) {
                  for (let i = start; i <= end; i++) {
                    const image = imageMap[type1][i];
                    if (image && !stepImages[type1].some(img => img.name === image.name)) {
                      stepImages[type1].push(image);
                    }
                  }
                }
                mutableCodeOutput = mutableCodeOutput.replace(match[0], '');
              }
  
              const individualImageRegex = /(\d+)[_.-]?(before|after)[_.-]?image/gi;
              while ((match = individualImageRegex.exec(mutableCodeOutput)) !== null) {
                const number = parseInt(match[1], 10);
                const type = match[2].toLowerCase();
                const image = imageMap[type][number];
                if (image && !stepImages[type].some(img => img.name === image.name)) {
                  stepImages[type].push(image);
                }
              }
            }
  
            if (stepImages.before.length > 0 || stepImages.after.length > 0) {
              stepImages.before.sort((a, b) => a.name.localeCompare(b.name));
              stepImages.after.sort((a, b) => a.name.localeCompare(b.name));
              newImages[index] = stepImages;
            }
          });
        }
  
        setImages(newImages);
        setParsedData(processedData);
        setQuestion(processedData.question || null);
        setResponse(processedData.response_to_user || null);
      } else {
        alert("No JSON file found in the Drive folder.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  

  const handleFetchDrive = async () => {
    if (!driveLink) return alert("Please paste a Google Drive folder link");
  
    const folderIdMatch = driveLink.match(/[-\w]{25,}/);
    const folderId = folderIdMatch ? folderIdMatch[0] : null;
    if (!folderId) return alert("Invalid Drive folder link");
  
    const accessToken = localStorage.getItem("google_access_token");
    if (!accessToken) return alert("You must login first to access Drive");
  
    try {
      setLoading(true);
  
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      if (!response.ok) throw new Error("Failed to fetch folder contents");
  
      const data = await response.json();
      const files = data.files;
  
      if (!files || files.length === 0) throw new Error("Folder is empty");
  
      console.log("Fetched files:", files.map(f => f.name));
  
      await handleDriveFiles(files); // <-- process the Drive files directly
    } catch (err) {
      console.error(err);
      alert(err.message);
      setLoading(false);
    }
  };
  
  
  
  
  
  
  return (
    <div>
      <Navbar onLogout={onLogout} />
      {loading && <Loader />}
      <div className="container">
        <h1>Agent Task Explorer</h1>

        <div className="card">
          {!parsedData ? (
            <div className="file-inputs">
              <div className="file-input-container">
                <input type="file" id="fileInput" onChange={handleFileChange} accept=".zip" />
                <label htmlFor="fileInput" className="file-label">
                  Upload Zip File
                </label>
              </div>

              <div className="drive-link-container">
                <input
                  type="text"
                  placeholder="Paste Google Drive link here"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="drive-link-input"
                />
                <button onClick={handleFetchDrive} className="drive-fetch-btn">
                  Fetch from Drive
                </button>
              </div>
            </div>
          ) : (
            <div className="button-container">
              <button onClick={handleDownload}>Download Parsed JSON</button>
              <button onClick={handleReset} className="secondary-button">
                Parse Another File
              </button>
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
                  <Step key={index} step={step} index={index} images={images[index]} />
                ))
              ) : (
                <p>No steps found or steps are not in an array format.</p>
              )}
            </div>
          )}
          {parsedData && (
            <div className="response-container">
              <h2>Final Response</h2>
              {response ? (
                <pre className="response-content">{typeof response === 'object' ? JSON.stringify(response, null, 2) : response}</pre>
              ) : (
                <p>No final response was generated.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
