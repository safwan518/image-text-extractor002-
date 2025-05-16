import { useState } from 'react';
import Tesseract from 'tesseract.js';

const ImageTextExtractor = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [qa, setQa] = useState({});

  const handleImageInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };
/
  const handleProcessImage = () => {                                                                                                                                      //
    if (!image) return alert('Upload image');
    setLoading(true);
    Tesseract.recognize(image, 'eng')
      .then(({ data: { text } }) => setText(text))
      .catch(() => alert('Error extracting text'))
      .finally(() => setLoading(false));
  };


  const generateQnA = async (line, index) => {
    setQa(prev => ({ ...prev, [index]: 'Loading...' }));
    setLoading(true);
    try {
      const res = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct', {
        method: 'POST',
        headers: {
          Authorization:  'Bearer ',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `generate a basic question and answer: "${line.trim()}"`
        }),
      });
      const data = await res.json();
      const answer = data[0]?.generated_text || 'No response';
      const cleaned = answer.replace(/generate a basic question and answer:.*?\n?/i, '').trim();
      setQa(prev => ({ ...prev, [index]: cleaned }));
    } catch {
      setQa(prev => ({ ...prev, [index]: 'Error generating Q&A' }));
    } finally {
      setLoading(false);
    }
  };


  const AskAI = async (line, index) => {
    const userQuestion = prompt(`Ask your question about:\n"${line.trim()}"`);
    if (!userQuestion || userQuestion.trim() === '') {
      alert('No question entered');
      return;
    }
    setQa(prev => ({ ...prev, [index]: 'Loading...' }));
    setLoading(true);
    try {
      const promptText = `Based on the following text:\n"${line.trim()}"\nAnswer this question:\n"${userQuestion.trim()}"`;

      const res = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct', {
        method: 'POST',
        headers: {
          Authorization:  'Bearer ',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: promptText,
        }),
      });
      const data = await res.json();
      const answer = data[0]?.generated_text || 'No response from AI';
      setQa(prev => ({ ...prev, [index]: answer.trim() }));
    } catch (error) {
      console.error(error);
      setQa(prev => ({ ...prev, [index]: 'Error generating answer' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Image Text Extractor & Q&A Generator</h1>
      <input type="file" accept="image/*" onChange={handleImageInput} />
      <button onClick={handleProcessImage} disabled={loading}>
        {loading ? 'Extracting Text...' : 'Extract Text'}
      </button>

      {image && (
        <img
          src={image}
          alt="Preview"
          style={{ display: 'block', marginTop: '20px', maxHeight: '300px' }}
        />
      )}

      {text && (
        <div>
          <h3>Extracted Text:</h3>
          <div>
            {text
              .split('\n')
              .filter(line => line.trim())
              .map((line, index) => (
                <div key={index} style={{ marginBottom: 10 }}>
                  <p>{line}</p>
                  <button onClick={() => AskAI(line, index)} disabled={loading}>
                    Ask AI about this line
                  </button>
                  <button onClick={() => generateQnA(line, index)} disabled={loading}>
                    Generate Q&A
                  </button>
                  {qa[index] && <p>{qa[index]}</p>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTextExtractor;
